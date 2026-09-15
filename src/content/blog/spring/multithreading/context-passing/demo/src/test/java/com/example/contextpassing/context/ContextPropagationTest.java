package com.example.contextpassing.context;

import com.alibaba.ttl.TtlRunnable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.task.TaskDecorator;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.FutureTask;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 线程上下文传播示例测试。
 */
class ContextPropagationTest {

    private final List<ThreadPoolTaskExecutor> executors = new ArrayList<>();

    @AfterEach
    void tearDown() {
        for (ThreadPoolTaskExecutor executor : executors) {
            executor.destroy();
        }
        executors.clear();
        RequestContextHolder.clear();
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("普通 ThreadLocal 直接提交时不会自动传播")
    void ordinaryThreadLocalIsNotPropagatedWithoutDecorator() throws Exception {
        ThreadPoolTaskExecutor executor = register(newExecutor(null));
        warmUp(executor);

        RequestContextHolder.setRequestId("REQ-001");

        assertNull(submit(executor, RequestContextHolder::getRequestId));
    }

    @Test
    @DisplayName("TaskDecorator 可以手动传播普通 ThreadLocal")
    void ordinaryThreadLocalIsPropagatedByDecorator() throws Exception {
        ThreadPoolTaskExecutor executor =
                register(newExecutor(new RequestIdTaskDecorator()));
        warmUp(executor);

        RequestContextHolder.setRequestId("REQ-001");

        assertEquals("REQ-001",
                submit(executor, RequestContextHolder::getRequestId));

        // 任务内部的修改不能泄漏到同一个 Worker 的后续任务。
        submit(executor, () -> {
            RequestContextHolder.setRequestId("WORKER-MODIFIED");
            return null;
        });
        RequestContextHolder.clear();

        assertNull(submit(executor, RequestContextHolder::getRequestId));
    }

    @Test
    @DisplayName("普通 ThreadLocal 捕获的是任务提交时的快照")
    void ordinaryThreadLocalSnapshotIsCapturedAtSubmitTime() throws Exception {
        ThreadPoolTaskExecutor executor =
                register(newExecutor(new RequestIdTaskDecorator()));
        warmUp(executor);

        CountDownLatch blockerStarted = new CountDownLatch(1);
        CountDownLatch releaseBlocker = new CountDownLatch(1);
        executor.execute(() -> {
            blockerStarted.countDown();
            try {
                assertTrue(releaseBlocker.await(5, TimeUnit.SECONDS));
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            }
        });
        assertTrue(blockerStarted.await(5, TimeUnit.SECONDS));

        RequestContextHolder.setRequestId("REQ-001");
        FutureTask<String> queuedTask =
                new FutureTask<>(RequestContextHolder::getRequestId);
        executor.execute(queuedTask);

        // 任务已经包装并入队，之后修改提交线程上下文不影响任务快照。
        RequestContextHolder.setRequestId("REQ-002");
        releaseBlocker.countDown();

        assertEquals("REQ-001", queuedTask.get(5, TimeUnit.SECONDS));
    }

    @Test
    @DisplayName("TtlRunnable 可以传播 TransmittableThreadLocal")
    void ttlRunnablePropagatesTtlContext() throws Exception {
        ThreadPoolTaskExecutor executor = register(newExecutor(null));
        warmUp(executor);

        TenantContextHolder.setTenantId(1001L);

        assertEquals(1001L,
                submitWithTtl(executor, TenantContextHolder::getTenantId));

        // 清空提交线程后，新任务不应读到上一个任务的租户。
        TenantContextHolder.clear();

        assertNull(submitWithTtl(executor, TenantContextHolder::getTenantId));
    }

    @Test
    @DisplayName("混合装饰器可以同时传播普通 ThreadLocal 和 TTL")
    void hybridDecoratorPropagatesBothContexts() throws Exception {
        ThreadPoolTaskExecutor executor =
                register(newExecutor(new HybridTaskDecorator()));
        warmUp(executor);

        RequestContextHolder.setRequestId("REQ-001");
        TenantContextHolder.setTenantId(1001L);

        ContextSnapshot captured = submit(executor, ContextSnapshot::capture);

        assertEquals("REQ-001", captured.requestId());
        assertEquals(1001L, captured.tenantId());

        RequestContextHolder.clear();
        TenantContextHolder.clear();

        ContextSnapshot empty = submit(executor, ContextSnapshot::capture);

        assertNull(empty.requestId());
        assertNull(empty.tenantId());
    }

    private ThreadPoolTaskExecutor register(ThreadPoolTaskExecutor executor) {
        executors.add(executor);
        return executor;
    }

    private static ThreadPoolTaskExecutor newExecutor(TaskDecorator taskDecorator) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(1);
        executor.setQueueCapacity(8);
        executor.setThreadNamePrefix("context-demo-");
        if (taskDecorator != null) {
            executor.setTaskDecorator(taskDecorator);
        }
        executor.initialize();
        return executor;
    }

    private static void warmUp(ThreadPoolTaskExecutor executor) throws Exception {
        submit(executor, () -> null);
    }

    private static <T> T submit(
            ThreadPoolTaskExecutor executor,
            Callable<T> callable) throws Exception {
        FutureTask<T> futureTask = new FutureTask<>(callable);
        executor.execute(futureTask);
        return futureTask.get(5, TimeUnit.SECONDS);
    }

    private static <T> T submitWithTtl(
            ThreadPoolTaskExecutor executor,
            Callable<T> callable) throws Exception {
        FutureTask<T> futureTask = new FutureTask<>(callable);
        executor.execute(TtlRunnable.get(futureTask));
        return futureTask.get(5, TimeUnit.SECONDS);
    }

    private record ContextSnapshot(String requestId, Long tenantId) {

        private static ContextSnapshot capture() {
            return new ContextSnapshot(
                    RequestContextHolder.getRequestId(),
                    TenantContextHolder.getTenantId());
        }
    }
}

