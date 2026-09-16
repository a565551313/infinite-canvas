import { Alert, Button, Checkbox, Form, Input, Tabs } from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "@/stores/use-auth-store";

type AuthFormValues = {
    email: string;
    password: string;
    confirmPassword?: string;
    asAdmin?: boolean;
};

export default function AuthPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const signIn = useAuthStore((s) => s.signIn);
    const [activeKey, setActiveKey] = useState<"login" | "register">("login");
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm<AuthFormValues>();

    const from = (location.state as { from?: string } | null)?.from ?? "/";

    const onSubmit = async (values: AuthFormValues) => {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 400));
        signIn({ email: values.email, password: values.password, asAdmin: Boolean(values.asAdmin) });
        const isAdmin = Boolean(values.asAdmin);
        setLoading(false);
        const target = isAdmin && from === "/" ? "/admin" : from;
        navigate(target, { replace: true });
    };

    return (
        <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-10">
            <div className="w-full max-w-[420px] space-y-4">
                <div className="text-center">
                    <h1 className="text-xl font-semibold text-stone-950 dark:text-stone-100">{t("auth.title")}</h1>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t("auth.subtitle")}</p>
                </div>

                <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
                    <Tabs
                        activeKey={activeKey}
                        onChange={(k) => setActiveKey(k as "login" | "register")}
                        centered
                        items={[
                            { key: "login", label: t("auth.login") },
                            { key: "register", label: t("auth.register") },
                        ]}
                    />

                    <Form<AuthFormValues>
                        form={form}
                        layout="vertical"
                        onFinish={onSubmit}
                        requiredMark={false}
                        initialValues={{ asAdmin: false }}
                        className="mt-4"
                    >
                        <Form.Item
                            name="email"
                            label={<span className="text-sm text-stone-950 dark:text-stone-100">{t("auth.email")}</span>}
                            rules={[
                                { required: true, message: t("auth.invalidEmail") },
                                { type: "email", message: t("auth.invalidEmail") },
                            ]}
                        >
                            <Input placeholder={t("auth.emailPlaceholder")} autoComplete="email" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span className="text-sm text-stone-950 dark:text-stone-100">{t("auth.password")}</span>}
                            rules={[
                                { required: true, message: t("auth.passwordTooShort") },
                                { min: 8, message: t("auth.passwordTooShort") },
                            ]}
                        >
                            <Input.Password placeholder={t("auth.passwordPlaceholder")} autoComplete={activeKey === "login" ? "current-password" : "new-password"} />
                        </Form.Item>

                        {activeKey === "register" ? (
                            <Form.Item
                                name="confirmPassword"
                                label={<span className="text-sm text-stone-950 dark:text-stone-100">{t("auth.confirmPassword")}</span>}
                                dependencies={["password"]}
                                rules={[
                                    { required: true, message: t("auth.passwordMismatch") },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue("password") === value) return Promise.resolve();
                                            return Promise.reject(new Error(t("auth.passwordMismatch")));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password placeholder={t("auth.passwordPlaceholder")} autoComplete="new-password" />
                            </Form.Item>
                        ) : null}

                        <Form.Item name="asAdmin" valuePropName="checked" className="mb-3">
                            <Checkbox>
                                <span className="text-sm text-stone-500 dark:text-stone-400">{t("auth.demoAdmin")}</span>
                            </Checkbox>
                        </Form.Item>

                        <Form.Item className="mb-0">
                            <Button type="primary" htmlType="submit" block loading={loading}>
                                {activeKey === "login" ? t("auth.submitLogin") : t("auth.submitRegister")}
                            </Button>
                        </Form.Item>
                    </Form>
                </section>

                <Alert type="info" showIcon message={<span className="text-sm text-stone-500 dark:text-stone-400">{t("auth.demoNotice")}</span>} className="rounded-lg" />
            </div>
        </main>
    );
}
