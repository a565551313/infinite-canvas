import { Avatar, Button, Dropdown } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "@/stores/use-auth-store";

export function UserMenu() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const status = useAuthStore((s) => s.status);
    const user = useAuthStore((s) => s.user);
    const signOut = useAuthStore((s) => s.signOut);

    if (status !== "signedIn" || !user) {
        return (
            <Button ghost type="primary" onClick={() => navigate("/login")}>
                {t("topNav.userMenu.login")}
            </Button>
        );
    }

    const initial = user.name?.[0]?.toUpperCase() ?? user.email[0]?.toUpperCase() ?? "U";

    const items: import("antd").MenuProps["items"] = [
        {
            key: "account",
            label: t("topNav.userMenu.account"),
            onClick: () => navigate("/account"),
        },
        ...(user.role === "admin"
            ? [
                  {
                      key: "admin",
                      label: t("topNav.userMenu.admin"),
                      onClick: () => navigate("/admin"),
                  } as const,
              ]
            : []),
        { type: "divider" as const },
        {
            key: "signOut",
            label: t("topNav.userMenu.signOut"),
            onClick: () => {
                signOut();
                navigate("/", { replace: true });
            },
        },
    ];

    return (
        <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <button type="button" className="inline-flex items-center gap-2 rounded-full px-1 py-1 hover:bg-stone-100 dark:hover:bg-stone-800">
                <Avatar size={28} style={{ backgroundColor: "#1677ff", verticalAlign: "middle" }}>
                    {initial}
                </Avatar>
                <span className="max-w-[100px] truncate text-sm font-medium">{user.name}</span>
            </button>
        </Dropdown>
    );
}
