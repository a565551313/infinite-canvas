import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/stores/use-auth-store";

/**
 * 前端守卫仅负责跳转，服务端接入后必须再校验一次权限
 */
export function RequireAuth({ children }: { children: ReactNode }) {
    const status = useAuthStore((s) => s.status);
    const user = useAuthStore((s) => s.user);
    const { pathname } = useLocation();
    if (status !== "signedIn" || !user) {
        return <Navigate to="/login" replace state={{ from: pathname }} />;
    }
    return <>{children}</>;
}

/**
 * 前端守卫仅负责跳转，服务端接入后必须再校验一次权限
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
    const status = useAuthStore((s) => s.status);
    const user = useAuthStore((s) => s.user);
    const { pathname } = useLocation();
    if (status !== "signedIn" || !user) {
        return <Navigate to="/login" replace state={{ from: pathname }} />;
    }
    if (user.role !== "admin") {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}
