package com.example.contextpassing.context;

import com.alibaba.ttl.TransmittableThreadLocal;

/**
 * 使用 TransmittableThreadLocal 保存租户标识。
 */
public final class TenantContextHolder {

    private static final TransmittableThreadLocal<Long> TENANT_ID =
            new TransmittableThreadLocal<>();

    private TenantContextHolder() {
    }

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

