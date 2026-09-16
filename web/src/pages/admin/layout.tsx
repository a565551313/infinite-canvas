import { Button, Layout, Menu } from "antd";
import { useMemo } from "react";
import { Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "@/stores/use-auth-store";

export default function AdminLayout() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const user = useAuthStore((s) => s.user);
    const status = useAuthStore((s) => s.status);

    if (status !== "signedIn" || !user || user.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    const selectedKeys = useMemo(() => {
        if (pathname.startsWith("/admin/credits")) return ["/admin/credits"];
        if (pathname.startsWith("/admin/channels")) return ["/admin/channels"];
        if (pathname.startsWith("/admin/dashboard")) return ["/admin/dashboard"];
        return ["/admin/users"];
    }, [pathname]);

    const items = [
        { key: "/admin/users", label: t("admin.menu.users") },
        { key: "/admin/credits", label: t("admin.menu.credits") },
        { key: "/admin/channels", label: t("admin.menu.channels") },
        { key: "/admin/dashboard", label: t("admin.menu.dashboard") },
    ];

    return (
        <Layout className="min-h-dvh">
            <Layout.Sider width={216} theme="light" className="border-r border-stone-200 dark:border-stone-800">
                <div className="flex h-full flex-col">
                    <div className="px-5 py-4 text-base font-semibold">{t("admin.title")}</div>
                    <Menu
                        mode="inline"
                        selectedKeys={selectedKeys}
                        defaultSelectedKeys={["/admin/users"]}
                        items={items}
                        onClick={({ key }) => navigate(key)}
                        className="flex-1 border-r-0"
                    />
                    <div className="p-4">
                        <Button block onClick={() => navigate("/")}>
                            {t("admin.backToSite")}
                        </Button>
                    </div>
                </div>
            </Layout.Sider>
            <Layout.Content className="bg-stone-50 dark:bg-stone-950">
                <div className="mx-auto max-w-6xl p-6">
                    <Outlet />
                </div>
            </Layout.Content>
        </Layout>
    );
}
