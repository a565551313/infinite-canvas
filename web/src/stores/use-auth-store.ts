/**
 * 空壳 Auth Store（纯前端演示）
 * - 不发任何网络请求，全部本地 mock
 * - 接入 Supabase 时只需替换 signIn / signOut 的实现，组件层不改
 * - 渠道 API Key 永不随用户数据上云，仅本地存储
 */
import { create } from "zustand";

export type AuthRole = "user" | "admin";

export type AuthUser = {
    id: string;
    email: string;
    name: string;
    role: AuthRole;
    createdAt: string;
};

type AuthStatus = "signedOut" | "signedIn";

type SignInInput = {
    email: string;
    password: string;
    asAdmin?: boolean;
};

type AuthStore = {
    status: AuthStatus;
    user: AuthUser | null;
    signIn: (input: SignInInput) => void;
    signOut: () => void;
};

const STORAGE_KEY = "canvas-auth-session";

function loadInitial(): Pick<AuthStore, "status" | "user"> {
    if (typeof window === "undefined") return { status: "signedOut", user: null };
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { status: "signedOut", user: null };
        const parsed = JSON.parse(raw) as { status?: AuthStatus; user?: AuthUser | null };
        if (parsed.status === "signedIn" && parsed.user) {
            return { status: "signedIn", user: parsed.user };
        }
    } catch {
        // ignore
    }
    return { status: "signedOut", user: null };
}

function persist(status: AuthStatus, user: AuthUser | null) {
    if (typeof window === "undefined") return;
    try {
        if (status === "signedIn" && user) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ status, user }));
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // ignore quota error
    }
}

const initial = loadInitial();

export const useAuthStore = create<AuthStore>((set) => ({
    status: initial.status,
    user: initial.user,
    signIn: ({ email, password: _password, asAdmin }) => {
        // 不校验密码、不发请求，name 取 email 的 @ 前缀
        const name = email.split("@")[0] || email;
        const role: AuthRole = asAdmin ? "admin" : "user";
        const user: AuthUser = {
            id: `user-${Date.now()}`,
            email,
            name,
            role,
            createdAt: new Date().toISOString(),
        };
        persist("signedIn", user);
        set({ status: "signedIn", user });
    },
    signOut: () => {
        persist("signedOut", null);
        set({ status: "signedOut", user: null });
    },
}));
