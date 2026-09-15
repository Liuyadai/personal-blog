package com.example.contextpassing.context;

import com.alibaba.ttl.TtlRunnable;
import org.springframework.core.task.TaskDecorator;

/**
 * 同时传播普通 ThreadLocal 和 TTL 上下文。
 */
public final class HybridTaskDecorator implements TaskDecorator {

    private static final TaskDecorator REQUEST_ID_DECORATOR =
            new RequestIdTaskDecorator();

    @Override
    public Runnable decorate(Runnable runnable) {
        // 外层负责 TTL，内层负责普通 ThreadLocal。
        return TtlRunnable.get(REQUEST_ID_DECORATOR.decorate(runnable));
    }
}

