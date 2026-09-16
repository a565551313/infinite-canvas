import { Alert, Avatar, Button, Descriptions, Drawer, Input, InputNumber, Modal, Table, Tag } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { mockLedger, mockUsers, type MockUser } from "@/services/cloud/mock-data";

export default function AdminUsersPage() {
    const { t } = useTranslation();
    const [rows, setRows] = useState<MockUser[]>(mockUsers);
    const [search, setSearch] = useState("");
    const [detailUser, setDetailUser] = useState<MockUser | null>(null);
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [adjustTarget, setAdjustTarget] = useState<MockUser | null>(null);
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

    const openAdjust = (user: MockUser) => {
        setAdjustTarget(user);
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
        // 仅关闭，不落地
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
        <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold">{t("admin.menu.users")}</h1>
                    <p className="text-sm text-stone-500">{t("admin.description")}</p>
                </div>
                <Input
                    placeholder={t("admin.users.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    allowClear
                    className="max-w-[280px]"
                />
            </div>

            <Table
                dataSource={filtered}
                rowKey="id"
                pagination={false}
                scroll={{ x: 900 }}
                columns={[
                    {
                        title: t("admin.users.columns.user"),
                        key: "user",
                        render: (_: unknown, record: MockUser) => (
                            <div className="flex items-center gap-2">
                                <Avatar size={28}>{record.name[0]?.toUpperCase()}</Avatar>
                                <div>
                                    <div className="text-sm font-medium">{record.name}</div>
                                    <div className="text-xs text-stone-500">{record.email}</div>
                                </div>
                            </div>
                        ),
                    },
                    {
                        title: t("admin.users.columns.role"),
                        dataIndex: "role",
                        key: "role",
                        render: (v: string) => <Tag color={v === "admin" ? "gold" : "default"}>{v}</Tag>,
                    },
                    { title: t("admin.users.columns.credits"), dataIndex: "credits", key: "credits" },
                    {
                        title: t("admin.users.columns.vip"),
                        dataIndex: "vipUntil",
                        key: "vipUntil",
                        render: (v: string | null) => (v ? <Tag color="blue">{new Date(v).toLocaleDateString()}</Tag> : <span className="text-stone-400">—</span>),
                    },
                    {
                        title: t("admin.users.columns.status"),
                        dataIndex: "status",
                        key: "status",
                        render: (v: string) => <Tag color={v === "active" ? "green" : "red"}>{v === "active" ? t("admin.users.statusActive") : t("admin.users.statusBanned")}</Tag>,
                    },
                    { title: t("admin.users.columns.calls"), dataIndex: "calls30d", key: "calls30d" },
                    {
                        title: t("admin.users.columns.lastActive"),
                        dataIndex: "lastActiveAt",
                        key: "lastActiveAt",
                        render: (v: string) => formatDate(v),
                    },
                    {
                        title: "操作",
                        key: "actions",
                        render: (_: unknown, record: MockUser) => (
                            <div className="flex gap-2">
                                <Button size="small" onClick={() => setDetailUser(record)}>
                                    {t("admin.users.actions.detail")}
                                </Button>
                                <Button size="small" onClick={() => openAdjust(record)}>
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

            <Drawer
                title={t("admin.users.detailTitle")}
                open={!!detailUser}
                onClose={() => setDetailUser(null)}
                width={420}
                extra={
                    detailUser ? (
                        <Button type="primary" onClick={() => openAdjust(detailUser)}>
                            {t("admin.users.actions.adjust")}
                        </Button>
                    ) : null
                }
            >
                {detailUser ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Avatar size={48}>{detailUser.name[0]?.toUpperCase()}</Avatar>
                            <div>
                                <div className="font-medium">{detailUser.name}</div>
                                <div className="text-sm text-stone-500">{detailUser.email}</div>
                            </div>
                        </div>
                        <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label={t("admin.users.columns.role")}>{detailUser.role}</Descriptions.Item>
                            <Descriptions.Item label={t("admin.users.columns.credits")}>{detailUser.credits}</Descriptions.Item>
                            <Descriptions.Item label={t("admin.users.columns.status")}>
                                <Tag color={detailUser.status === "active" ? "green" : "red"}>
                                    {detailUser.status === "active" ? t("admin.users.statusActive") : t("admin.users.statusBanned")}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={t("admin.users.columns.vip")}>{detailUser.vipUntil ? new Date(detailUser.vipUntil).toLocaleDateString() : "—"}</Descriptions.Item>
                            <Descriptions.Item label={t("admin.users.columns.lastActive")}>{formatDate(detailUser.lastActiveAt)}</Descriptions.Item>
                        </Descriptions>

                        <div>
                            <div className="mb-2 text-sm font-medium">最近流水</div>
                            <Table
                                dataSource={mockLedger.slice(0, 4)}
                                rowKey="id"
                                pagination={false}
                                size="small"
                                columns={[
                                    { title: t("account.columns.at"), dataIndex: "at", key: "at", render: (v: string) => new Date(v).toLocaleDateString() },
                                    { title: t("account.columns.delta"), dataIndex: "delta", key: "delta", render: (v: number) => (v > 0 ? `+${v}` : `${v}`) },
                                    { title: t("account.columns.reason"), dataIndex: "reason", key: "reason" },
                                ]}
                            />
                        </div>

                        <Button block onClick={() => openAdjust(detailUser)}>
                            {t("admin.users.actions.adjust")}
                        </Button>
                    </div>
                ) : null}
            </Drawer>

            <Modal
                title={t("admin.users.adjustTitle")}
                open={adjustOpen}
                onCancel={() => setAdjustOpen(false)}
                onOk={handleAdjustOk}
                okText={t("admin.users.adjustSubmit")}
            >
                <div className="space-y-3">
                    <div>
                        <div className="mb-1 text-sm font-medium">{t("admin.users.adjustDelta")}</div>
                        <InputNumber
                            className="w-full"
                            value={delta}
                            onChange={(v) => setDelta(v as number | null)}
                            placeholder="e.g. 500 / -200"
                        />
                        <div className="mt-1 text-xs text-stone-500">{t("admin.users.adjustPositive")}</div>
                        {deltaError ? <div className="mt-1 text-xs text-red-500">{deltaError}</div> : null}
                    </div>
                    <div>
                        <div className="mb-1 text-sm font-medium">{t("admin.users.adjustReason")}</div>
                        <Input.TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("admin.users.adjustReasonPlaceholder")} rows={3} />
                        {reasonError ? <div className="mt-1 text-xs text-red-500">{reasonError}</div> : null}
                    </div>
                    <Alert type="warning" showIcon message={t("admin.users.auditHint")} />
                </div>
            </Modal>
        </div>
    );
}
