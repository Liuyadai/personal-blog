package com.example.contextpassing.context;

/**
 * 使用普通 ThreadLocal 保存请求标识。
 */
public final class RequestContextHolder {

    private static final ThreadLocal<String> REQUEST_ID = new ThreadLocal<>();

    private RequestContextHolder() {
    }

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

