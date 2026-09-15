# context-passing-demo

这是博客《spring项目中多线程场景下的线程上下文传递（1）》的配套示例。

## 运行环境

- Java 17
- Maven 3.8+
- Spring Boot 3.3.4
- transmittable-thread-local 2.14.5

## 运行测试

在当前目录执行：

```powershell
mvn test
```

测试覆盖：

1. 普通 ThreadLocal 直接提交时不会自动传播；
2. 使用 TaskDecorator 手动传播普通 ThreadLocal；
3. 普通 ThreadLocal 捕获的是提交时快照；
4. 使用 TtlRunnable 传播 TransmittableThreadLocal；
5. 使用混合装饰器同时传播两种上下文。

## 核心组合

混合场景的关键代码是：

```java
public Runnable decorate(Runnable runnable) {
    return TtlRunnable.get(
            new RequestIdTaskDecorator().decorate(runnable));
}
```

外层的 TtlRunnable 负责 TTL 上下文，内层的 RequestIdTaskDecorator 负责普通 ThreadLocal。两者都在任务结束时恢复 Worker 原有上下文。

## 与生产代码的对应关系

| Demo | 生产代码中的对应物 |
| --- | --- |
| RequestContextHolder | MDC 或其他普通 ThreadLocal Holder |
| TenantContextHolder | 租户、安全等 TTL Holder |
| RequestIdTaskDecorator | MdcTaskDecorator |
| HybridTaskDecorator | CustomExecutors 中的 TTL_MDC_DECORATOR |

