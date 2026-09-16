import { Alert, Avatar, Button, Descriptions, Drawer, Input, InputNumber, Modal, Table, Tag } from "antd";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { mockLedger, mockUsers, type MockUser } from "@/services/cloud/mock-data";

export default function AdminUsersPage() {
    const { t } = useTranslation();
    const [rows, setRows] = useState<MockUser[]>(mockUsers);
    const [search, setSearch] = useState("");
    const [detailUser, setDetailUser] = useState<MockUser | null>(null);
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [delta, setDelta] = useState<number | null>(null);
    const [reason, setReason] = useState("");
    const [deltaError, setDeltaError] = useState<string | null>(null);
    const [reasonError, setReasonError] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((u) => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
    }, [rows, search]);

    const handleBanToggle = (user: MockUser) => {
        setRows((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: u.status === "active" ? "banned" : "active" } : u)));
        if (detailUser?.id === user.id) {
            setDetailUser((d) => (d ? { ...d, status: d.status === "active" ? "banned" : "active" } : d));
        }
    };

    const openAdjust = () => {
        setDelta(null);
        setReason("");
        setDeltaError(null);
        setReasonError(null);
        setAdjustOpen(true);
    };

    const handleAdjustOk = () => {
        let ok = true;
        if (delta === null || delta === undefined) {
            setDeltaError(t("admin.users.adjustDelta"));
            ok = false;
        } else {
            setDeltaError(null);
        }
        if (!reason.trim()) {
            setReasonError(t("admin.users.adjustReason"));
            ok = false;
        } else {
            setReasonError(null);
        }
        if (!ok) return;
        setAdjustOpen(false);
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return iso;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-stone-950 dark:text-stone-100">{t("admin.menu.users")}</h1>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t("admin.description")}</p>
                </div>
                <Input
                    placeholder={t("admin.users.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    allowClear
                    prefix={<Search className="size-4 text-stone-400" />}
                    className="max-w-[280px]"
                />
            </div>

            <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                <Table
                    dataSource={filtered}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                    scroll={{ x: 900 }}
                    columns={[
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.user")}</span>,
                            key: "user",
                            render: (_: unknown, record: MockUser) => (
                                <div className="flex items-center gap-2">
                                    <Avatar size={28} className="!bg-stone-200 !text-stone-700 dark:!bg-stone-800 dark:!text-stone-200">
                                        {record.name[0]?.toUpperCase()}
                                    </Avatar>
                                    <div>
                                        <div className="text-sm font-medium text-stone-950 dark:text-stone-100">{record.name}</div>
                                        <div className="text-xs text-stone-500 dark:text-stone-400">{record.email}</div>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.role")}</span>,
                            dataIndex: "role",
                            key: "role",
                            render: (v: string) => <Tag color={v === "admin" ? "gold" : "default"}>{v}</Tag>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.credits")}</span>,
                            dataIndex: "credits",
                            key: "credits",
                            render: (v: number) => <span className="text-sm text-stone-950 dark:text-stone-100">{v}</span>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.vip")}</span>,
                            dataIndex: "vipUntil",
                            key: "vipUntil",
                            render: (v: string | null) =>
                                v ? <Tag color="gold">{new Date(v).toLocaleDateString()}</Tag> : <span className="text-sm text-stone-400 dark:text-stone-500">—</span>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.status")}</span>,
                            dataIndex: "status",
                            key: "status",
                            render: (v: string) => <Tag color={v === "active" ? "green" : "red"}>{v === "active" ? t("admin.users.statusActive") : t("admin.users.statusBanned")}</Tag>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.calls")}</span>,
                            dataIndex: "calls30d",
                            key: "calls30d",
                            render: (v: number) => <span className="text-sm text-stone-950 dark:text-stone-100">{v}</span>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.lastActive")}</span>,
                            dataIndex: "lastActiveAt",
                            key: "lastActiveAt",
                            render: (v: string) => <span className="text-sm text-stone-500 dark:text-stone-400">{formatDate(v)}</span>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">操作</span>,
                            key: "actions",
                            render: (_: unknown, record: MockUser) => (
                                <div className="flex gap-2">
                                    <Button size="small" onClick={() => setDetailUser(record)}>
                                        {t("admin.users.actions.detail")}
                                    </Button>
                                    <Button size="small" onClick={openAdjust}>
                                        {t("admin.users.actions.adjust")}
                                    </Button>
                                    <Button size="small" danger={record.status === "active"} onClick={() => handleBanToggle(record)}>
                                        {record.status === "active" ? t("admin.users.actions.ban") : t("admin.users.actions.unban")}
                                    </Button>
                                </div>
                            ),
                        },
                    ]}
                />
            </section>

            <Drawer
                title={<span className="text-sm font-semibold text-stone-950 dark:text-stone-100">{t("admin.users.detailTitle")}</span>}
                open={!!detailUser}
                onClose={() => setDetailUser(null)}
                width={420}
                extra={
                    detailUser ? (
                        <Button type="primary" onClick={openAdjust}>
                            {t("admin.users.actions.adjust")}
                        </Button>
                    ) : null
                }
            >
                {detailUser ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Avatar size={48} className="!bg-stone-200 !text-stone-700 dark:!bg-stone-800 dark:!text-stone-200">
                                {detailUser.name[0]?.toUpperCase()}
                            </Avatar>
                            <div>
                                <div className="text-sm font-semibold text-stone-950 dark:text-stone-100">{detailUser.name}</div>
                                <div className="text-sm text-stone-500 dark:text-stone-400">{detailUser.email}</div>
                            </div>
                        </div>
                        <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label={<span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.role")}</span>}>
                                <span className="text-sm text-stone-950 dark:text-stone-100">{detailUser.role}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label={<span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.credits")}</span>}>
                                <span className="text-sm text-stone-950 dark:text-stone-100">{detailUser.credits}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label={<span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.status")}</span>}>
                                <Tag color={detailUser.status === "active" ? "green" : "red"}>
                                    {detailUser.status === "active" ? t("admin.users.statusActive") : t("admin.users.statusBanned")}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={<span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.vip")}</span>}>
                                <span className="text-sm text-stone-500 dark:text-stone-400">{detailUser.vipUntil ? new Date(detailUser.vipUntil).toLocaleDateString() : "—"}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label={<span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.users.columns.lastActive")}</span>}>
                                <span className="text-sm text-stone-500 dark:text-stone-400">{formatDate(detailUser.lastActiveAt)}</span>
                            </Descriptions.Item>
                        </Descriptions>

                        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-900">
                            <div className="text-sm font-semibold text-stone-950 dark:text-stone-100">最近流水</div>
                            <div className="mt-3">
                                <Table
                                    dataSource={mockLedger.slice(0, 4)}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                    columns={[
                                        { title: <span className="text-xs text-stone-500">{t("account.columns.at")}</span>, dataIndex: "at", key: "at", render: (v: string) => <span className="text-sm text-stone-500">{new Date(v).toLocaleDateString()}</span> },
                                        { title: <span className="text-xs text-stone-500">{t("account.columns.delta")}</span>, dataIndex: "delta", key: "delta", render: (v: number) => <span className={`text-sm ${v > 0 ? "text-green-600" : "text-red-600"}`}>{v > 0 ? `+${v}` : `${v}`}</span> },
                                        { title: <span className="text-xs text-stone-500">{t("account.columns.reason")}</span>, dataIndex: "reason", key: "reason", render: (v: string) => <span className="text-sm text-stone-500">{v}</span> },
                                    ]}
                                />
                            </div>
                        </div>

                        <Button block onClick={openAdjust}>
                            {t("admin.users.actions.adjust")}
                        </Button>
                    </div>
                ) : null}
            </Drawer>

            <Modal
                title={<span className="text-sm font-semibold text-stone-950 dark:text-stone-100">{t("admin.users.adjustTitle")}</span>}
                open={adjustOpen}
                onCancel={() => setAdjustOpen(false)}
                onOk={handleAdjustOk}
                okText={t("admin.users.adjustSubmit")}
            >
                <div className="space-y-3">
                    <div>
                        <div className="mb-1 text-sm font-medium text-stone-950 dark:text-stone-100">{t("admin.users.adjustDelta")}</div>
                        <InputNumber className="w-full" value={delta} onChange={(v) => setDelta(v as number | null)} placeholder="e.g. 500 / -200" />
                        <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">{t("admin.users.adjustPositive")}</div>
                        {deltaError ? <div className="mt-1 text-xs text-red-600">{deltaError}</div> : null}
                    </div>
                    <div>
                        <div className="mb-1 text-sm font-medium text-stone-950 dark:text-stone-100">{t("admin.users.adjustReason")}</div>
                        <Input.TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("admin.users.adjustReasonPlaceholder")} rows={3} />
                        {reasonError ? <div className="mt-1 text-xs text-red-600">{reasonError}</div> : null}
                    </div>
                    <Alert type="warning" showIcon message={<span className="text-sm text-stone-500 dark:text-stone-400">{t("admin.users.auditHint")}</span>} />
                </div>
            </Modal>
        </div>
    );
}
