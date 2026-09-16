import { Alert, Button, Card, InputNumber, Modal, Table, Tag, Form, Input, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { mockRedeemCodes, type MockRedeemCode } from "@/services/cloud/mock-data";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 去掉 0/O/1/I/L

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
            const now = new Date().toISOString();
            void now;
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
            // fallback via copy lib not needed; silently ignore
        }
        messageApi.success(t("admin.credits.copied"));
    };

    const statusTag = (s: string) => {
        if (s === "active") return <Tag color="green">{t("admin.credits.statusActive")}</Tag>;
        if (s === "usedUp") return <Tag color="default">{t("admin.credits.statusUsedUp")}</Tag>;
        return <Tag color="red">{t("admin.credits.statusExpired")}</Tag>;
    };

    return (
        <div>
            {contextHolder}
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-lg font-semibold">{t("admin.menu.credits")}</h1>
                    <p className="text-sm text-stone-500">{t("admin.credits.genHint")}</p>
                </div>
                <Button type="primary" onClick={() => setOpen(true)}>
                    {t("admin.credits.generate")}
                </Button>
            </div>

            {generated.length ? (
                <Card className="mb-4 border-green-300 bg-green-50 dark:bg-green-950/20" title={t("admin.credits.generatedTitle", { count: generated.length })}>
                    <div className="flex flex-wrap gap-2">
                        {generated.map((g) => (
                            <Tag
                                key={g.code}
                                color="green"
                                className="cursor-pointer !px-3 !py-1 font-mono text-sm"
                                onClick={() => copy(g.code)}
                            >
                                {g.code}
                            </Tag>
                        ))}
                    </div>
                </Card>
            ) : null}

            <Table
                dataSource={rows}
                rowKey="code"
                pagination={false}
                scroll={{ x: 700 }}
                columns={[
                    {
                        title: t("admin.credits.columns.code"),
                        dataIndex: "code",
                        key: "code",
                        render: (v: string) => (
                            <span className="inline-flex items-center gap-2 font-mono text-sm">
                                {v}
                                <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copy(v)} />
                            </span>
                        ),
                    },
                    { title: t("admin.credits.columns.credits"), dataIndex: "credits", key: "credits" },
                    {
                        title: t("admin.credits.columns.usage"),
                        key: "usage",
                        render: (_: unknown, r: MockRedeemCode) => `${r.usedCount}/${r.maxUses}`,
                    },
                    {
                        title: t("admin.credits.columns.expires"),
                        dataIndex: "expiresAt",
                        key: "expiresAt",
                        render: (v: string) => new Date(v).toLocaleDateString(),
                    },
                    { title: t("admin.credits.columns.createdBy"), dataIndex: "createdBy", key: "createdBy" },
                    {
                        title: t("admin.credits.columns.status"),
                        dataIndex: "status",
                        key: "status",
                        render: (v: string) => statusTag(v),
                    },
                ]}
            />

            <Modal title={t("admin.credits.generate")} open={open} onCancel={() => setOpen(false)} onOk={handleGenerate} okText={t("admin.credits.genSubmit")}>
                <Form form={form} layout="vertical" initialValues={{ count: 5, credits: 500, maxUses: 1, expiryDays: 30 }}>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="count" label={t("admin.credits.genCount")} rules={[{ required: true }]}>
                            <InputNumber min={1} max={100} className="w-full" />
                        </Form.Item>
                        <Form.Item name="credits" label={t("admin.credits.genValue")} rules={[{ required: true }]}>
                            <InputNumber min={1} className="w-full" />
                        </Form.Item>
                        <Form.Item name="maxUses" label={t("admin.credits.genMaxUses")} rules={[{ required: true }]}>
                            <InputNumber min={1} className="w-full" />
                        </Form.Item>
                        <Form.Item name="expiryDays" label={t("admin.credits.genExpiryDays")} rules={[{ required: true }]}>
                            <InputNumber min={1} className="w-full" />
                        </Form.Item>
                    </div>
                    <Alert type="info" showIcon message={t("admin.credits.genHint")} />
                </Form>
            </Modal>
        </div>
    );
}
