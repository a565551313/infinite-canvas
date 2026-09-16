import { createBrowserRouter, Outlet } from "react-router-dom";

import { AnalyticsTracker } from "@/components/layout/analytics-tracker";
import { RequireAdmin, RequireAuth } from "@/components/layout/route-guards";
import UserLayout from "@/layouts/user-layout";
import AccountPage from "@/pages/account";
import AdminLayout from "@/pages/admin/layout";
import AdminChannelsPage from "@/pages/admin/channels";
import AdminCreditsPage from "@/pages/admin/credits";
import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminUsersPage from "@/pages/admin/users";
import AssetsPage from "@/pages/assets";
import AuthPage from "@/pages/auth";
import CanvasPage from "@/pages/canvas";
import CanvasProjectPage from "@/pages/canvas/project";
import ConfigPage from "@/pages/config";
import HomePage from "@/pages/home";
import ImagePage from "@/pages/image";
import NotFound from "@/pages/not-found";
import PromptsPage from "@/pages/prompts";
import VideoPage from "@/pages/video";

export const router = createBrowserRouter([
    { path: "/login", element: <AuthPage /> },
    {
        element: (
            <UserLayout>
                <AnalyticsTracker />
                <Outlet />
            </UserLayout>
        ),
        children: [
            { path: "/", element: <HomePage /> },
            { path: "/image", element: <ImagePage /> },
            { path: "/video", element: <VideoPage /> },
            { path: "/assets", element: <AssetsPage /> },
            { path: "/prompts", element: <PromptsPage /> },
            { path: "/canvas", element: <CanvasPage /> },
            { path: "/canvas/:id", element: <CanvasProjectPage /> },
            { path: "/config", element: <ConfigPage /> },
        ],
    },
    {
        element: (
            <RequireAuth>
                <UserLayout>
                    <Outlet />
                </UserLayout>
            </RequireAuth>
        ),
        children: [{ path: "/account", element: <AccountPage /> }],
    },
    {
        element: (
            <RequireAdmin>
                <AdminLayout />
            </RequireAdmin>
        ),
        children: [
            { path: "/admin", element: <AdminUsersPage /> },
            { path: "/admin/users", element: <AdminUsersPage /> },
            { path: "/admin/credits", element: <AdminCreditsPage /> },
            { path: "/admin/channels", element: <AdminChannelsPage /> },
            { path: "/admin/dashboard", element: <AdminDashboardPage /> },
        ],
    },
    { path: "*", element: <NotFound /> },
]);
