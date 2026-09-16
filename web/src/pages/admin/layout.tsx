import { Button, Layout, Menu } from "antd";
import { LayoutDashboard, Ticket, Users, Waypoints, Home } from "lucide-react";
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
        { key: "/admin/users", label: t("admin.menu.users"), icon: <Users className="size-4" /> },
        { key: "/admin/credits", label: t("admin.menu.credits"), icon: <Ticket className="size-4" /> },
        { key: "/admin/channels", label: t("admin.menu.channels"), icon: <Waypoints className="size-4" /> },
        { key: "/admin/dashboard", label: t("admin.menu.dashboard"), icon: <LayoutDashboard className="size-4" /> },
    ];

    return (
        <Layout className="min-h-dvh">
            <Layout.Sider
                width={216}
                theme="light"
                className="!bg-stone-50 dark:!bg-stone-900"
                style={{ background: "transparent" }}
            >
                <div className="flex h-full flex-col border-r border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
                    <div className="px-5 py-4 text-sm font-semibold text-stone-950 dark:text-stone-100">{t("admin.title")}</div>
                    <Menu
                        mode="inline"
                        selectedKeys={selectedKeys}
                        defaultSelectedKeys={["/admin/users"]}
                        items={items}
                        onClick={({ key }) => navigate(key)}
                        className="flex-1 border-r-0 !bg-transparent"
                    />
                    <div className="p-4">
                        <Button block icon={<Home className="size-4" />} onClick={() => navigate("/")}>
                            {t("admin.backToSite")}
                        </Button>
                    </div>
                </div>
            </Layout.Sider>
            <Layout.Content className="bg-background">
                <main className="h-full overflow-y-auto">
                    <div className="mx-auto max-w-6xl px-6 py-6">
                        <Outlet />
                    </div>
                </main>
            </Layout.Content>
        </Layout>
    );
}
