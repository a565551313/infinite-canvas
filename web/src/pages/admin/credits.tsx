import { Alert, Button, Form, Input, InputNumber, Modal, Table, Tag, message } from "antd";
import { Copy, Ticket } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { mockRedeemCodes, type MockRedeemCode } from "@/services/cloud/mock-data";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
    const pick = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];
    const seg = () => Array.from({ length: 4 }, pick).join("");
    return `IC-${seg()}-${seg()}`;
}

export default function AdminCreditsPage() {
    const { t } = useTranslation();
    const [rows, setRows] = useState<MockRedeemCode[]>(mockRedeemCodes);
    const [open, setOpen] = useState(false);
    const [generated, setGenerated] = useState<MockRedeemCode[]>([]);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const handleGenerate = async () => {
        try {
            const values = await form.validateFields();
            const count = values.count as number;
            const credits = values.credits as number;
            const maxUses = values.maxUses as number;
            const expiryDays = values.expiryDays as number;
            const expiresAt = new Date(Date.now() + expiryDays * 86400000).toISOString();
            const newCodes: MockRedeemCode[] = Array.from({ length: count }, () => ({
                code: randomCode(),
                credits,
                maxUses,
                usedCount: 0,
                expiresAt,
                createdBy: "admin",
                status: "active" as const,
            }));
            setRows((prev) => [...newCodes, ...prev]);
            setGenerated(newCodes);
            setOpen(false);
        } catch {
            // validation failed
        }
    };

    const copy = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
        } catch {
            // ignore
        }
        messageApi.success(t("admin.credits.copied"));
    };

    const statusTag = (s: string) => {
        if (s === "active") return <Tag color="green">{t("admin.credits.statusActive")}</Tag>;
        if (s === "usedUp") return <Tag color="default">{t("admin.credits.statusUsedUp")}</Tag>;
        return <Tag color="red">{t("admin.credits.statusExpired")}</Tag>;
    };

    return (
        <div className="space-y-4">
            {contextHolder}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-stone-950 dark:text-stone-100">{t("admin.menu.credits")}</h1>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t("admin.credits.genHint")}</p>
                </div>
                <Button type="primary" icon={<Ticket className="size-4" />} onClick={() => setOpen(true)}>
                    {t("admin.credits.generate")}
                </Button>
            </div>

            {generated.length ? (
                <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                    <div className="text-sm font-semibold text-stone-950 dark:text-stone-100">{t("admin.credits.generatedTitle", { count: generated.length })}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {generated.map((g) => (
                            <button
                                key={g.code}
                                type="button"
                                onClick={() => copy(g.code)}
                                className="rounded border border-stone-200 bg-stone-50 px-3 py-1 font-mono text-sm text-stone-950 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800"
                            >
                                {g.code}
                            </button>
                        ))}
                    </div>
                </section>
            ) : null}

            <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                <Table
                    dataSource={rows}
                    rowKey="code"
                    pagination={false}
                    size="middle"
                    scroll={{ x: 700 }}
                    columns={[
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.credits.columns.code")}</span>,
                            dataIndex: "code",
                            key: "code",
                            render: (v: string) => (
                                <span className="inline-flex items-center gap-2 font-mono text-sm text-stone-950 dark:text-stone-100">
                                    {v}
                                    <Button size="small" type="text" icon={<Copy className="size-4" />} onClick={() => copy(v)} aria-label={t("common.copy")} />
                                </span>
                            ),
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.credits.columns.credits")}</span>,
                            dataIndex: "credits",
                            key: "credits",
                            render: (v: number) => <span className="text-sm text-stone-950 dark:text-stone-100">{v}</span>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.credits.columns.usage")}</span>,
                            key: "usage",
                            render: (_: unknown, r: MockRedeemCode) => <span className="text-sm text-stone-500 dark:text-stone-400">{`${r.usedCount}/${r.maxUses}`}</span>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.credits.columns.expires")}</span>,
                            dataIndex: "expiresAt",
                            key: "expiresAt",
                            render: (v: string) => <span className="text-sm text-stone-500 dark:text-stone-400">{new Date(v).toLocaleDateString()}</span>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.credits.columns.createdBy")}</span>,
                            dataIndex: "createdBy",
                            key: "createdBy",
                            render: (v: string) => <span className="text-sm text-stone-500 dark:text-stone-400">{v}</span>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.credits.columns.status")}</span>,
                            dataIndex: "status",
                            key: "status",
                            render: (v: string) => statusTag(v),
                        },
                    ]}
                />
            </section>

            <Modal title={<span className="text-sm font-semibold text-stone-950 dark:text-stone-100">{t("admin.credits.generate")}</span>} open={open} onCancel={() => setOpen(false)} onOk={handleGenerate} okText={t("admin.credits.genSubmit")}>
                <Form form={form} layout="vertical" requiredMark={false} initialValues={{ count: 5, credits: 500, maxUses: 1, expiryDays: 30 }}>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="count" label={<span className="text-sm text-stone-950 dark:text-stone-100">{t("admin.credits.genCount")}</span>} rules={[{ required: true }]}>
                            <InputNumber min={1} max={100} className="w-full" />
                        </Form.Item>
                        <Form.Item name="credits" label={<span className="text-sm text-stone-950 dark:text-stone-100">{t("admin.credits.genValue")}</span>} rules={[{ required: true }]}>
                            <InputNumber min={1} className="w-full" />
                        </Form.Item>
                        <Form.Item name="maxUses" label={<span className="text-sm text-stone-950 dark:text-stone-100">{t("admin.credits.genMaxUses")}</span>} rules={[{ required: true }]}>
                            <InputNumber min={1} className="w-full" />
                        </Form.Item>
                        <Form.Item name="expiryDays" label={<span className="text-sm text-stone-950 dark:text-stone-100">{t("admin.credits.genExpiryDays")}</span>} rules={[{ required: true }]}>
                            <InputNumber min={1} className="w-full" />
                        </Form.Item>
                    </div>
                    <Alert type="info" showIcon message={<span className="text-sm text-stone-500 dark:text-stone-400">{t("admin.credits.genHint")}</span>} />
                </Form>
            </Modal>
        </div>
    );
}
