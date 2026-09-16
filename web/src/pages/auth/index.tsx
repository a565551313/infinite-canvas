import { Alert, Button, Card, Checkbox, Form, Input, Tabs } from "antd";
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
        // Need to read updated user synchronously; derive role from asAdmin for navigation
        const isAdmin = Boolean(values.asAdmin);
        setLoading(false);
        const target = isAdmin && from === "/" ? "/admin" : from;
        navigate(target, { replace: true });
    };

    return (
        <div className="flex min-h-dvh items-center justify-center bg-stone-50 px-4 py-10 dark:bg-stone-950">
            <div className="w-full max-w-[420px]">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">{t("auth.title")}</h1>
                    <p className="mt-2 text-sm text-stone-500">{t("auth.subtitle")}</p>
                </div>

                <Card className="shadow-sm">
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
                    >
                        <Form.Item
                            name="email"
                            label={t("auth.email")}
                            rules={[
                                { required: true, message: t("auth.invalidEmail") },
                                { type: "email", message: t("auth.invalidEmail") },
                            ]}
                        >
                            <Input placeholder={t("auth.emailPlaceholder")} autoComplete="email" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={t("auth.password")}
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
                                label={t("auth.confirmPassword")}
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

                        <Form.Item name="asAdmin" valuePropName="checked" className="mb-2">
                            <Checkbox>{t("auth.demoAdmin")}</Checkbox>
                        </Form.Item>

                        <Form.Item className="mb-0">
                            <Button type="primary" htmlType="submit" block loading={loading}>
                                {activeKey === "login" ? t("auth.submitLogin") : t("auth.submitRegister")}
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>

                <Alert className="mt-4" type="info" showIcon message={t("auth.demoNotice")} />
            </div>
        </div>
    );
}
