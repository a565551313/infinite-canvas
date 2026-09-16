import { Button, Drawer, Form, Input, InputNumber, Select, Switch, Table, Tag, message } from "antd";
import { Plus, Trash2, Waypoints } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { mockChannels, type MockChannel } from "@/services/cloud/mock-data";

type ChannelFormValues = {
    name: string;
    baseUrl: string;
    apiKey?: string;
    models: Array<{ model: string; unit: "token" | "image" | "second"; price: number }>;
};

export default function AdminChannelsPage() {
    const { t } = useTranslation();
    const [rows, setRows] = useState<MockChannel[]>(mockChannels);
    const [editing, setEditing] = useState<MockChannel | null>(null);
    const [open, setOpen] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [form] = Form.useForm<ChannelFormValues>();
    const [messageApi, contextHolder] = message.useMessage();

    const openCreate = () => {
        setIsNew(true);
        setEditing(null);
        form.setFieldsValue({ name: "", baseUrl: "", apiKey: "", models: [{ model: "", unit: "token", price: 0 }] });
        setOpen(true);
    };

    const openEdit = (record: MockChannel) => {
        setIsNew(false);
        setEditing(record);
        form.setFieldsValue({
            name: record.name,
            baseUrl: record.baseUrl,
            apiKey: "",
            models: record.models.map((m) => ({ model: m.model, unit: m.unit, price: m.price })),
        });
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (isNew) {
                const newChannel: MockChannel = {
                    id: `ch-${Date.now()}`,
                    name: values.name,
                    baseUrl: values.baseUrl,
                    apiKeyMasked: "sk-****-new",
                    enabled: true,
                    calls30d: 0,
                    cost30d: 0,
                    models: (values.models || []).filter((m) => m.model).map((m) => ({ model: m.model, unit: m.unit, price: m.price })),
                };
                setRows((prev) => [newChannel, ...prev]);
            } else if (editing) {
                setRows((prev) =>
                    prev.map((r) =>
                        r.id === editing.id
                            ? {
                                  ...r,
                                  name: values.name,
                                  baseUrl: values.baseUrl,
                                  apiKeyMasked: values.apiKey ? "sk-****-updated" : r.apiKeyMasked,
                                  models: (values.models || []).filter((m) => m.model).map((m) => ({ model: m.model, unit: m.unit, price: m.price })),
                              }
                            : r,
                    ),
                );
            }
            setOpen(false);
        } catch {
            // validation error
        }
    };

    const toggleEnabled = (id: string, enabled: boolean) => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
    };

    return (
        <div className="space-y-4">
            {contextHolder}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-stone-950 dark:text-stone-100">{t("admin.menu.channels")}</h1>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t("admin.channels.apiKeyHint")}</p>
                </div>
                <Button type="primary" icon={<Waypoints className="size-4" />} onClick={openCreate}>
                    {t("admin.channels.add")}
                </Button>
            </div>

            <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                <Table
                    dataSource={rows}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                    scroll={{ x: 800 }}
                    columns={[
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.channels.columns.name")}</span>,
                            key: "name",
                            render: (_: unknown, r: MockChannel) => (
                                <div>
                                    <div className="text-sm font-medium text-stone-950 dark:text-stone-100">{r.name}</div>
                                    <div className="font-mono text-xs text-stone-500 dark:text-stone-400">{r.baseUrl}</div>
                                </div>
                            ),
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.channels.columns.models")}</span>,
                            key: "models",
                            render: (_: unknown, r: MockChannel) => (
                                <div className="flex flex-wrap gap-1">
                                    {r.models.map((m) => (
                                        <Tag key={m.model} className="m-0">
                                            {m.model} · {m.price} / {t(`admin.channels.units.${m.unit}`)}
                                        </Tag>
                                    ))}
                                </div>
                            ),
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.channels.columns.enabled")}</span>,
                            dataIndex: "enabled",
                            key: "enabled",
                            render: (v: boolean, record: MockChannel) => <Switch checked={v} onChange={(checked) => toggleEnabled(record.id, checked)} />,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.channels.columns.calls")}</span>,
                            dataIndex: "calls30d",
                            key: "calls30d",
                            render: (v: number) => <span className="text-sm text-stone-950 dark:text-stone-100">{v}</span>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">{t("admin.channels.columns.cost")}</span>,
                            dataIndex: "cost30d",
                            key: "cost30d",
                            render: (v: number) => <span className="text-sm text-stone-950 dark:text-stone-100">{v}</span>,
                        },
                        {
                            title: <span className="text-xs text-stone-500 dark:text-stone-400">操作</span>,
                            key: "actions",
                            render: (_: unknown, r: MockChannel) => (
                                <div className="flex gap-2">
                                    <Button size="small" onClick={() => messageApi.success(t("admin.channels.testOk"))}>
                                        {t("admin.channels.test")}
                                    </Button>
                                    <Button size="small" onClick={() => openEdit(r)}>
                                        {t("admin.channels.edit")}
                                    </Button>
                                </div>
                            ),
                        },
                    ]}
                />
            </section>

            <Drawer
                title={<span className="text-sm font-semibold text-stone-950 dark:text-stone-100">{isNew ? t("admin.channels.add") : t("admin.channels.edit")}</span>}
                open={open}
                onClose={() => setOpen(false)}
                width={520}
                extra={
                    <Button type="primary" onClick={handleSave}>
                        {t("common.save")}
                    </Button>
                }
            >
                <Form<ChannelFormValues> form={form} layout="vertical" requiredMark={false}>
                    <Form.Item name="name" label={<span className="text-sm text-stone-950 dark:text-stone-100">{t("admin.channels.fields.name")}</span>} rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="baseUrl" label={<span className="text-sm text-stone-950 dark:text-stone-100">{t("admin.channels.fields.baseUrl")}</span>} rules={[{ required: true }]}>
                        <Input className="font-mono" placeholder="https://api.example.com" />
                    </Form.Item>
                    <Form.Item
                        name="apiKey"
                        label={<span className="text-sm text-stone-950 dark:text-stone-100">{t("admin.channels.fields.apiKey")}</span>}
                        extra={
                            !isNew && editing ? (
                                <span className="text-xs text-stone-500 dark:text-stone-400">
                                    {t("admin.channels.fields.current")}: <span className="font-mono">{editing.apiKeyMasked}</span> · {t("admin.channels.fields.apiKeyKeep")}
                                </span>
                            ) : undefined
                        }
                    >
                        <Input.Password placeholder={isNew ? "sk-..." : t("admin.channels.fields.apiKeyKeep")} />
                    </Form.Item>

                    <div className="mb-2 text-sm font-semibold text-stone-950 dark:text-stone-100">{t("admin.channels.fields.models")}</div>
                    <Form.List name="models">
                        {(fields, { add, remove }) => (
                            <div className="space-y-3">
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} className="flex gap-2">
                                        <Form.Item {...restField} name={[name, "model"]} rules={[{ required: true }]} className="mb-0 flex-1">
                                            <Input placeholder={t("admin.channels.modelColumns.model")} />
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, "unit"]} className="mb-0 w-[120px]">
                                            <Select
                                                options={[
                                                    { value: "token", label: t("admin.channels.units.token") },
                                                    { value: "image", label: t("admin.channels.units.image") },
                                                    { value: "second", label: t("admin.channels.units.second") },
                                                ]}
                                            />
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, "price"]} className="mb-0 w-[100px]">
                                            <InputNumber placeholder={t("admin.channels.modelColumns.price")} className="w-full" min={0} />
                                        </Form.Item>
                                        <Button type="text" icon={<Trash2 className="size-4" />} onClick={() => remove(name)} aria-label="remove" />
                                    </div>
                                ))}
                                <Button type="dashed" block icon={<Plus className="size-4" />} onClick={() => add({ model: "", unit: "token", price: 0 })}>
                                    {t("admin.channels.fields.addModel")}
                                </Button>
                            </div>
                        )}
                    </Form.List>
                </Form>
            </Drawer>
        </div>
    );
}
