import { GithubOutlined } from "@ant-design/icons";
import { Button, Form, Select } from "antd";
import { BookOpen, History, Info, Languages, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { APP_VERSION, DOCS_URL } from "@/constant/env";
import { GITHUB_URL } from "@/components/layout/github-link";
import { VersionReleaseNotesModal } from "@/components/layout/version-release-modal";
import { useVersionCheck } from "@/hooks/use-version-check";
import { changeAppLocale, type AppLocale } from "@/i18n";
import type { ThemeName } from "@/stores/use-theme-store";
import { useThemeStore } from "@/stores/use-theme-store";

export function ConfigAbout() {
    const { i18n, t } = useTranslation();
    const locale = i18n.resolvedLanguage as AppLocale;
    const theme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const version = useVersionCheck();

    return (
        <div className="space-y-3">
            <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Languages className="size-4" />
                    {t("config.about.appearance")}
                </div>
                <div className="mt-1 text-xs text-stone-500">{t("config.about.appearanceDescription")}</div>
                <Form layout="vertical" requiredMark={false}>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <Form.Item label={t("config.about.language")} className="mb-0">
                            <Select
                                value={locale}
                                options={[
                                    { value: "zh-CN", label: t("locale.zhCN") },
                                    { value: "en-US", label: t("locale.enUS") },
                                ]}
                                onChange={(value) => void changeAppLocale(value as AppLocale)}
                            />
                        </Form.Item>
                        <Form.Item label={t("config.about.theme")} className="mb-0">
                            <Select
                                value={theme}
                                options={[
                                    { value: "light", label: t("config.about.themeLight") },
                                    { value: "dark", label: t("config.about.themeDark") },
                                ]}
                                onChange={(value) => setTheme(value as ThemeName)}
                            />
                        </Form.Item>
                    </div>
                </Form>
            </section>
            <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Info className="size-4" />
                            {t("config.about.version")}
                        </div>
                        <div className="mt-1 text-xs text-stone-500">{t("config.about.versionDescription")}</div>
                    </div>
                    <Button icon={<RefreshCw className="size-4" />} loading={version.checking} onClick={() => void version.checkLatestRelease(true)}>
                        {t(version.checking ? "version.checking" : "version.checkUpdates")}
                    </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-stone-200 p-3 dark:border-stone-800">
                        <div className="text-xs text-stone-500 dark:text-stone-400">{t("version.currentVersion")}</div>
                        <div className="mt-1 text-base font-semibold text-stone-950 dark:text-stone-100">{APP_VERSION}</div>
                    </div>
                    <div className="rounded-lg border border-stone-200 p-3 dark:border-stone-800">
                        <div className="text-xs text-stone-500 dark:text-stone-400">{t("version.latestVersion")}</div>
                        <div className="mt-1 text-base font-semibold text-stone-950 dark:text-stone-100">{version.latestVersion}</div>
                    </div>
                </div>
                <div className="mt-4">
                    <Button icon={<History className="size-4" />} onClick={version.openReleaseModal}>
                        {t("config.about.viewChangelog")}
                    </Button>
                </div>
            </section>
            <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <BookOpen className="size-4" />
                    {t("config.about.resources")}
                </div>
                <div className="mt-1 text-xs text-stone-500">{t("config.about.resourcesDescription")}</div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Button icon={<BookOpen className="size-4" />} href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                        {t("config.about.docs")}
                    </Button>
                    <Button icon={<GithubOutlined />} href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                        {t("config.about.github")}
                    </Button>
                </div>
            </section>
            <VersionReleaseNotesModal {...version} />
        </div>
    );
}
