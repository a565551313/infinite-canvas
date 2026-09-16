import { Alert, Button, Card, Descriptions, Input, Table, Tag } from "antd";
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
        <div className="mx-auto max-w-6xl p-6">
            <div className="mb-6">
                <h1 className="text-xl font-semibold">{t("account.title")}</h1>
                <p className="mt-1 text-sm text-stone-500">{t("account.description")}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card title={t("account.profile")}>
                    <Descriptions column={1} size="small">
                        <Descriptions.Item label={t("account.email")}>{user?.email ?? "—"}</Descriptions.Item>
                        <Descriptions.Item label={t("account.role")}>
                            <Tag color={isAdmin ? "gold" : "default"}>{isAdmin ? t("account.roleAdmin") : t("account.roleUser")}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t("account.joinedAt")}>{user?.createdAt ? formatDate(user.createdAt) : "—"}</Descriptions.Item>
                    </Descriptions>
                </Card>

                <Card title={t("account.credits")}>
                    <div className="text-3xl font-semibold tabular-nums">{balance.toLocaleString()}</div>
                    <div className="mt-4 flex gap-2">
                        <Input placeholder={t("account.redeemPlaceholder")} value={redeem} onChange={(e) => setRedeem(e.target.value)} />
                        <Button type="primary" onClick={handleRedeem} loading={redeeming}>
                            {t("account.redeemSubmit")}
                        </Button>
                    </div>
                    {redeemMsg ? <div className="mt-2 text-sm text-green-600">{redeemMsg}</div> : null}
                </Card>

                <Card title={t("account.subscription")}>
                    <div className="flex items-center gap-2">
                        <Tag color="blue">{mockLedger.length ? t("account.vipActive") : t("account.roleUser")}</Tag>
                        <span className="text-sm text-stone-600">{t("account.vipUntil", { date: "2026-12-31" })}</span>
                    </div>
                    <div className="mt-4">
                        <Button disabled>{t("account.upgrade")}</Button>
                    </div>
                </Card>
            </div>

            <Card title={t("account.ledger")} className="mt-6">
                <Table
                    dataSource={ledger}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: t("account.ledgerEmpty") }}
                    columns={[
                        {
                            title: t("account.columns.at"),
                            dataIndex: "at",
                            key: "at",
                            render: (v: string) => formatDate(v),
                        },
                        {
                            title: t("account.columns.type"),
                            dataIndex: "type",
                            key: "type",
                            render: (v: string) => <Tag color={typeColor(v)}>{t(`account.types.${v}`)}</Tag>,
                        },
                        {
                            title: t("account.columns.delta"),
                            dataIndex: "delta",
                            key: "delta",
                            render: (v: number) => (
                                <span className={v >= 0 ? "text-green-600" : "text-red-600"}>{v > 0 ? `+${v}` : `${v}`}</span>
                            ),
                        },
                        { title: t("account.columns.balance"), dataIndex: "balance", key: "balance" },
                        { title: t("account.columns.reason"), dataIndex: "reason", key: "reason" },
                    ]}
                />
            </Card>

            {false ? <Alert /> : null}
        </div>
    );
}
