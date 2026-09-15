package com.example.contextpassing.context;

import org.springframework.core.task.TaskDecorator;

/**
 * 手动传播普通 ThreadLocal 中的 requestId。
 */
public final class RequestIdTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        // decorate 在提交线程中调用，捕获提交时的快照。
        String requestIdAtSubmit = RequestContextHolder.getRequestId();

        return () -> {
            // run 在 Worker 中调用，先保存 Worker 原有的上下文。
            String requestIdBeforeRun = RequestContextHolder.getRequestId();
            try {
                restore(requestIdAtSubmit);
                runnable.run();
            } finally {
                // 无论任务是否异常，都恢复 Worker 原来的上下文。
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

