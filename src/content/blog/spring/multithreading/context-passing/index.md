---
title: "spring项目中多线程场景下的线程上下文传递（1）"
description: "理解spring提供的TaskDecorator任务包装钩子、Alibaba提供的TransmittableThreadLocal和TtlRunnable的使用场景"
publishedAt: "2026-09-15"
updatedAt:
category: "技术实践"
tags: [Spring, 多线程, 上下文]
series:
draft: false
---

## 前言

在 Spring 项目中，请求线程经常需要把任务提交给线程池异步执行。例如：

```text
HTTP 请求线程
    │
    ├── 设置 requestId、tenantId、traceId
    │
    └── 提交任务到线程池
             │
             ▼
        Worker 线程执行
```

业务代码通常不会把租户、请求标识、链路标识作为参数层层传递，而是放进 `ThreadLocal`、MDC 或安全上下文中，通过静态 Holder 获取：

```java
String requestId = RequestContextHolder.getRequestId();
Long tenantId = TenantContextHolder.getTenantId();
```

问题在于：`ThreadLocal` 保存的是当前线程的数据。提交任务的请求线程和真正执行任务的线程不是同一个线程，因此 Worker 默认看不到请求线程中的上下文。

## 一、先理解 ThreadLocal：数据为什么会丢失

### 1.1 ThreadLocal 保存在哪里

可以把 `ThreadLocal` 理解成一张“以线程为索引的表”：

```text
ThreadLocal 变量
    │
    ├── 请求线程 → requestId=REQ-001
    │
    └── Worker 线程 → 没有 requestId
```

`ThreadLocal` 并不是把值绑定到任务对象上，而是把值放在当前线程自己的存储结构里。任务换了线程，读取到的自然是另一份数据。

以如下的`RequestContextHolder`普通上下文 Holder 为例：

```java
public final class RequestContextHolder {

    private static final ThreadLocal<String> REQUEST_ID = new ThreadLocal<>();

    public static void setRequestId(String requestId) {
        REQUEST_ID.set(requestId);
    }

    public static String getRequestId() {
        return REQUEST_ID.get();
    }

    public static void clear() {
        REQUEST_ID.remove();
    }
}
```

### 1.2 直接提交到线程池：上下文不会自动传递

先不配置任何装饰器：

```java
ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
executor.setCorePoolSize(1);
executor.setMaxPoolSize(1);
executor.setQueueCapacity(8);
executor.initialize();

RequestContextHolder.setRequestId("REQ-001");

FutureTask<String> task = new FutureTask<>(RequestContextHolder::getRequestId);
executor.execute(task);

assertNull(task.get());
```

这里断言 `null` 是正确结果：`RequestContextHolder.setRequestId("REQ-001")` 发生在提交线程，Worker 线程并没有这份普通 `ThreadLocal` 数据。

测试时要注意 Worker 的创建时机。为了排除线程创建阶段的继承行为，Demo 会先用一个空任务预热 Worker，再在请求线程设置上下文。这样验证的是“任务提交时是否传播”，而不是“新线程创建时是否碰巧继承”。

## 二、问题一：用 TaskDecorator 手动传播普通 ThreadLocal

### 2.1 TaskDecorator 是什么

Spring 的 `TaskDecorator` 不是某一种上下文传播实现，而是一个任务包装钩子：

```java
@FunctionalInterface
public interface TaskDecorator {

    Runnable decorate(Runnable runnable);
}
```

当 `ThreadPoolTaskExecutor` 配置了 `TaskDecorator` 后，任务提交过程可以抽象成：

```text
executor.execute(originalTask)
        │
        ▼
decorator.decorate(originalTask)
        │
        ▼
把包装后的 Runnable 放入线程池
```

它只负责提供“包装机会”，并不知道要保存 MDC、租户还是安全上下文。具体保存什么、何时恢复、是否清理，都由装饰器实现。

### 2.2 普通 ThreadLocal 的手动快照和恢复

针对上面的 `RequestContextHolder`，可以实现一个装饰器：

```java
public final class RequestIdTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        // decorate 被调用时位于提交线程，先保存提交时的快照
        String requestIdAtSubmit = RequestContextHolder.getRequestId();

        return () -> {
            // run 被调用时位于 Worker，先保存 Worker 原来的上下文
            String requestIdBeforeRun = RequestContextHolder.getRequestId();
            try {
                restore(requestIdAtSubmit);
                runnable.run();
            } finally {
                // 任务结束后恢复 Worker 原来的上下文
                restore(requestIdBeforeRun);
            }
        };
    }

    private static void restore(String requestId) {
        if (requestId == null) {
            RequestContextHolder.clear();
        } else {
            RequestContextHolder.setRequestId(requestId);
        }
    }
}
```

配置到线程池：

```java
executor.setTaskDecorator(new RequestIdTaskDecorator());
```

此时执行过程变成：

```text
提交线程
    ├── decorate 时捕获 REQ-001
    └── 生成包装任务

Worker 线程
    ├── 保存 Worker 原来的 requestId
    ├── 设置 REQ-001
    ├── 执行业务任务
    └── finally 恢复 Worker 原来的 requestId
```

业务任务内部就可以读取到：

```java
assertEquals("REQ-001", RequestContextHolder.getRequestId());
```

### 2.3 为什么必须恢复 Worker 原来的值

线程池 Worker 不会随着任务执行结束而销毁。假设只有设置、没有恢复：

```text
任务 A：requestId=REQ-A
任务 A 执行结束
任务 B：没有 requestId
```

任务 B 可能错误地读取到 `REQ-A`。因此正确的装饰器必须具备以下结构：

```java
保存 Worker 原上下文
try {
    设置提交时上下文
    执行业务任务
} finally {
    恢复 Worker 原上下文
}
```

这里的 `finally` 不是可选的，即使业务任务抛出异常，也必须执行上下文恢复。

### 2.4 普通 ThreadLocal 方案的局限

手动装饰普通 `ThreadLocal` 可以工作，但需要知道每一种上下文：

```text
RequestIdHolder   → 手动捕获
UserContextHolder → 手动捕获
SecurityContext   → 手动捕获
MDC               → 手动捕获
```

上下文种类增多以后，装饰器很容易遗漏某个 Holder。更麻烦的是，新增一个基于 `ThreadLocal` 的框架组件时，线程池装饰器通常不会自动感知它。

这就是 `TransmittableThreadLocal` 要解决的问题之一：把“如何发现并传递 TTL 上下文”交给通用组件处理。

## 三、问题二：使用 TransmittableThreadLocal 和 TtlRunnable

### 3.1 为什么 InheritableThreadLocal 仍然不够

`InheritableThreadLocal` 的继承发生在线程创建时：

```text
创建 Worker 线程
    └── 复制创建者当时的值

之后提交任务 A、B、C
    └── Worker 线程一直复用同一份线程上下文
```

线程池的 Worker 往往会提前创建并反复复用，因此它不能表达“每次提交任务时都复制一份最新上下文”。

`TransmittableThreadLocal`（简称 TTL）提供了面向线程池任务的传递能力：在任务包装时捕获上下文，在任务执行时恢复上下文，执行结束后再还原 Worker 原有上下文。

### 3.2 定义一个 TTL 上下文

配套 Demo 中的租户上下文使用 `TransmittableThreadLocal`：

```java
public final class TenantContextHolder {

    private static final TransmittableThreadLocal<Long> TENANT_ID =
            new TransmittableThreadLocal<>();

    public static void setTenantId(Long tenantId) {
        TENANT_ID.set(tenantId);
    }

    public static Long getTenantId() {
        return TENANT_ID.get();
    }

    public static void clear() {
        TENANT_ID.remove();
    }
}
```

### 3.3 TtlRunnable 的基本用法

`TtlRunnable.get(task)` 会返回一个包装后的 `Runnable`：

```java
TenantContextHolder.setTenantId(1001L);

FutureTask<Long> task = new FutureTask<>(TenantContextHolder::getTenantId);
executor.execute(TtlRunnable.get(task));

assertEquals(1001L, task.get());
```

关键在于：`TtlRunnable.get(...)` 要在提交线程中、每次提交任务时调用。

可以把它的生命周期理解为：

```text
TtlRunnable.get(task)
    └── capture：捕获提交线程的 TTL 快照

TtlRunnable.run()
    ├── replay：把快照恢复到 Worker
    ├── 执行 task
    └── restore：恢复 Worker 原来的 TTL
```

概念上的伪代码如下：

```java
public void run() {
    Object backup = replay(capturedTtlValues);
    try {
        runnable.run();
    } finally {
        restore(backup);
    }
}
```

所以 TTL 不是把值永久写入 Worker，而是让上下文只在任务执行期间临时生效。

### 3.4 TtlRunnable 解决了什么问题

使用 TTL 后，调用方不需要为每一个 TTL Holder 单独编写：

```java
captureTenant();
captureSecurity();
captureLocale();
captureOtherContext();
```

只要这些上下文确实使用了 `TransmittableThreadLocal`，`TtlRunnable` 就可以统一捕获和恢复。

但要注意，`TtlRunnable` 不是普通 `ThreadLocal` 的万能包装器：

```text
普通 ThreadLocal                 → TtlRunnable 不会自动发现
TransmittableThreadLocal          → TtlRunnable 可以捕获和恢复
MDC                               → 通常需要单独处理
```

另外，TTL 默认传递的是上下文值本身，并不意味着对任意可变对象做深拷贝。如果 TTL 中保存的是可变对象，需要根据业务需要实现复制策略，或者避免在线程之间共享可变状态。

## 四、问题三：普通 ThreadLocal 与 TTL 的混合场景

生产系统经常同时存在两类上下文：

```text
MDC / 自定义 RequestContextHolder
    └── 普通 ThreadLocal，需要手动快照和恢复

TenantContextHolder / SecurityContext
    └── TransmittableThreadLocal，由 TTL 统一处理
```

两者不是二选一，而是可以把两个 Runnable 包装器嵌套起来：

```java
TaskDecorator hybridDecorator = runnable ->
        TtlRunnable.get(
                new RequestIdTaskDecorator().decorate(runnable));

executor.setTaskDecorator(hybridDecorator);
```

更推荐把它封装成独立的 `HybridTaskDecorator`，避免业务代码到处手动组合。

### 4.1 提交阶段发生了什么

假设提交线程当前有：

```text
requestId = REQ-001
tenantId  = 1001
```

任务原本是 `businessTask`，提交时的包装关系如下：

```text
businessTask
    │
    ├── RequestIdTaskDecorator.decorate
    │       └── 捕获普通 ThreadLocal：REQ-001
    │
    └── TtlRunnable.get
            └── 捕获 TTL：tenantId=1001
```

最终放入线程池的是：

```text
TtlRunnable(
    RequestIdTaskDecorator 的包装任务(
        businessTask
    )
)
```

### 4.2 Worker 执行阶段发生了什么

Worker 执行时，包装器按照嵌套顺序完成恢复和清理：

```text
TtlRunnable.run()
    ├── 保存 Worker 原来的 TTL
    ├── 恢复 tenantId=1001
    │
    └── RequestIdTaskDecorator 包装任务.run()
            ├── 保存 Worker 原来的 requestId
            ├── 恢复 requestId=REQ-001
            ├── 执行业务任务
            ├── 恢复 Worker 原来的 requestId
            │
            └── TtlRunnable 恢复 Worker 原来的 TTL
```

业务任务执行期间可以同时读取两种上下文：

```java
assertEquals("REQ-001", RequestContextHolder.getRequestId());
assertEquals(1001L, TenantContextHolder.getTenantId());
```

任务结束后，普通 `ThreadLocal` 和 TTL 分别恢复自己的 Worker 快照，互不负责对方的上下文。

### 4.3 为什么当前项目采用这种组合

当前优护通项目的 `CustomExecutors.java` 在全量上下文线程池中使用了：

```java
private static final TaskDecorator TTL_MDC_DECORATOR = runnable ->
        TtlRunnable.get(MdcTaskDecorator.wrap(runnable));
```

其中：

```text
MdcTaskDecorator.wrap(runnable)
    └── 捕获、设置、恢复 MDC

TtlRunnable.get(...)
    └── 捕获、设置、恢复 TransmittableThreadLocal
```

因此，当前项目中的 `traceId` 如果存放在 MDC，由 `MdcTaskDecorator` 负责；租户、安全等基于 TTL 的上下文，由 `TtlRunnable` 负责。

当前线程池分成两种策略：

```text
dataStatisticExecutor
feignCallExecutor
monitorExecutor
externalApiExecutor
orderShareProfitExecutor
deviceCommandExecutor
    └── TTL + MDC

delayTaskExecutor
    └── 只传递 MDC
```

延迟任务执行间隔可能较长，提交时捕获的租户或身份快照可能已经不适合任务真正执行时使用，因此它只传播日志上下文。需要在延迟任务中确定租户时，更稳妥的做法是把租户 ID 作为业务参数传入，并在任务执行边界显式建立上下文。

## 五、生产环境中的几个边界

### 5.1 TaskDecorator 不会自动覆盖所有异步入口

装饰器只对配置了它的线程池生效。下面这些异步入口如果使用了其他执行器，仍然需要单独处理：

```java
CompletableFuture.supplyAsync(task); // 默认公共线程池
new Thread(task).start();
其他框架创建的线程池
```

要么显式传入已经配置好的 Executor，要么在对应的异步框架中配置上下文传播方案。

### 5.2 快照时间是提交时间，不是执行时间

任务进入队列后可能等待很久。装饰器捕获的是提交瞬间的上下文：

```text
提交时：tenantId=1001
排队 30 秒
执行时：业务请求可能已经结束
```

对于实时异步任务，这通常是想要的语义；对于延迟任务、重试任务和定时任务，需要重新评估上下文是否仍然有效。

### 5.3 不要把可变业务状态直接放进上下文

上下文传播通常传递的是值或对象引用，不等于事务快照、数据库快照或深拷贝。建议在上下文中只保存轻量、稳定的标识，例如：

```text
requestId
tenantId
userId
traceId
```

订单对象、权限集合等可变业务对象应尽量作为任务参数传递，并明确其生命周期。

### 5.4 任务结束后的清理是正确性的组成部分

线程池场景中，最危险的不是“某个任务没有读到上下文”，而是“下一个任务读到了上一个任务的上下文”。因此每个传播器都应该满足：

```text
捕获提交线程上下文
→ 执行前保存 Worker 上下文
→ 执行期间临时恢复
→ finally 中还原 Worker 上下文
```

## 六、三个问题的对照总结

| 场景 | 上下文类型 | 传播方式 | 任务结束后的处理 |
| --- | --- | --- | --- |
| 直接提交 | 普通 `ThreadLocal` | 不会自动传播 | Worker 保持原状 |
| 普通 ThreadLocal + TaskDecorator | 普通 `ThreadLocal` | 自定义快照、恢复 | 装饰器负责还原 |
| TTL + TtlRunnable | `TransmittableThreadLocal` | TTL 统一捕获、恢复 | TTL 负责还原 |
| 混合装饰 | 两者同时存在 | 两层 Runnable 嵌套 | 两层分别还原 |

可以用一句话记住它们的关系：

> `TaskDecorator` 是 Spring 提供的任务包装入口；普通 `ThreadLocal` 的传播逻辑需要自己实现；`TtlRunnable` 是 Alibaba 提供的 TTL 上下文包装器；两者可以通过嵌套包装共同工作。

## 七、小结

本文从一个最基础的线程池任务开始，逐步解决了三个问题：

1. 普通 `ThreadLocal` 不会跨线程，需要通过 `TaskDecorator` 手动捕获、恢复和清理；
2. `TransmittableThreadLocal` 配合 `TtlRunnable`，可以在任务提交和执行之间传递 TTL 上下文；
3. 普通 `ThreadLocal` 与 TTL 可以组合，分别由各自的包装器负责，最终形成混合上下文传播方案。

