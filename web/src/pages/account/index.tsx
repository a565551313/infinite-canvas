import { Button, Input, Table, Tag } from "antd";
import { Coins, Crown, User } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { mockLedger } from "@/services/cloud/mock-data";
import { useAuthStore } from "@/stores/use-auth-store";

export default function AccountPage() {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const [redeem, setRedeem] = useState("");
    const [redeeming, setRedeeming] = useState(false);
    const [redeemMsg, setRedeemMsg] = useState<string | null>(null);

    const ledger = mockLedger;
    const balance = useMemo(() => ledger[ledger.length - 1]?.balance ?? 0, [ledger]);
    const isAdmin = user?.role === "admin";

    const handleRedeem = async () => {
        if (!redeem.trim()) return;
        setRedeeming(true);
        await new Promise((r) => setTimeout(r, 300));
        setRedeeming(false);
        setRedeemMsg(t("admin.credits.copied"));
        setTimeout(() => setRedeemMsg(null), 1500);
        setRedeem("");
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return iso;
        }
    };

    const typeColor = (type: string) => {
        if (type === "consume") return "red";
        if (type === "refund") return "orange";
        return "green";
    };

    return (
        <main className="h-full overflow-y-auto bg-background">
            <div className="mx-auto max-w-4xl px-6 py-6">
                <div className="mb-5">
                    <h1 className="text-xl font-semibold text-stone-950 dark:text-stone-100">{t("account.title")}</h1>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t("account.description")}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                        <div className="flex items-center gap-2 text-sm font-semibold text-stone-950 dark:text-stone-100">
                            <User className="size-4" />
                            {t("account.profile")}
                        </div>
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-stone-500 dark:text-stone-400">{t("account.email")}</span>
                                <span className="text-sm text-stone-950 dark:text-stone-100">{user?.email ?? "—"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-stone-500 dark:text-stone-400">{t("account.role")}</span>
                                <Tag color={isAdmin ? "gold" : "default"} className="m-0">
                                    {isAdmin ? t("account.roleAdmin") : t("account.roleUser")}
                                </Tag>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-stone-500 dark:text-stone-400">{t("account.joinedAt")}</span>
                                <span className="text-sm text-stone-500 dark:text-stone-400">{user?.createdAt ? formatDate(user.createdAt) : "—"}</span>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                        <div className="flex items-center gap-2 text-sm font-semibold text-stone-950 dark:text-stone-100">
                            <Coins className="size-4" />
                            {t("account.credits")}
                        </div>
                        <div className="mt-4 text-3xl font-semibold tabular-nums text-stone-950 dark:text-stone-100">{balance.toLocaleString()}</div>
                        <div className="mt-4 flex gap-2">
                            <Input size="middle" placeholder={t("account.redeemPlaceholder")} value={redeem} onChange={(e) => setRedeem(e.target.value)} />
                            <Button type="primary" onClick={handleRedeem} loading={redeeming}>
                                {t("account.redeemSubmit")}
                            </Button>
                        </div>
                        {redeemMsg ? <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">{redeemMsg}</div> : null}
                    </section>

                    <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                        <div className="flex items-center gap-2 text-sm font-semibold text-stone-950 dark:text-stone-100">
                            <Crown className="size-4" />
                            {t("account.subscription")}
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Tag color="gold">{t("account.vipActive")}</Tag>
                            <span className="text-xs text-stone-500 dark:text-stone-400">{t("account.vipUntil", { date: "2026-12-31" })}</span>
                        </div>
                        <div className="mt-4">
                            <Button disabled block>
                                {t("account.upgrade")}
                            </Button>
                        </div>
                    </section>
                </div>

                <section className="mt-4 rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                    <div className="text-sm font-semibold text-stone-950 dark:text-stone-100">{t("account.ledger")}</div>
                    <div className="mt-4">
                        <Table
                            dataSource={ledger}
                            rowKey="id"
                            pagination={false}
                            size="middle"
                            locale={{ emptyText: <span className="text-sm text-stone-400 dark:text-stone-500">{t("account.ledgerEmpty")}</span> }}
                            columns={[
                                {
                                    title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("account.columns.at")}</span>,
                                    dataIndex: "at",
                                    key: "at",
                                    render: (v: string) => <span className="text-sm text-stone-500 dark:text-stone-400">{formatDate(v)}</span>,
                                },
                                {
                                    title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("account.columns.type")}</span>,
                                    dataIndex: "type",
                                    key: "type",
                                    render: (v: string) => <Tag color={typeColor(v)}>{t(`account.types.${v}`)}</Tag>,
                                },
                                {
                                    title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("account.columns.delta")}</span>,
                                    dataIndex: "delta",
                                    key: "delta",
                                    render: (v: number) => (
                                        <span className={`text-sm ${v >= 0 ? "text-green-600" : "text-red-600"}`}>{v > 0 ? `+${v}` : `${v}`}</span>
                                    ),
                                },
                                {
                                    title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("account.columns.balance")}</span>,
                                    dataIndex: "balance",
                                    key: "balance",
                                    render: (v: number) => <span className="text-sm text-stone-950 dark:text-stone-100">{v}</span>,
                                },
                                {
                                    title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("account.columns.reason")}</span>,
                                    dataIndex: "reason",
                                    key: "reason",
                                    render: (v: string) => <span className="text-sm text-stone-500 dark:text-stone-400">{v}</span>,
                                },
                            ]}
                        />
                    </div>
                </section>
            </div>
        </main>
    );
}
