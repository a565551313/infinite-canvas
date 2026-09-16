import { useCallback, useEffect, useMemo, useState } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";
import { APP_VERSION, CUSTOM_VERSION } from "@/constant/env";
import { isNewerCustomVersion, parseChangelog, type ReleaseInfo } from "@/lib/release";

const latestVersionUrl = "https://raw.githubusercontent.com/basketikun/infinite-canvas/main/VERSION";
const latestChangelogUrl = "https://raw.githubusercontent.com/basketikun/infinite-canvas/main/CHANGELOG.md";

// Fork customization is published on the `dev` branch of this repository, so pushing there is enough to
// release a new custom version: the browser reads these files directly and no redeploy is required.
const customRawBase = import.meta.env.VITE_CUSTOM_RAW_BASE || "https://raw.githubusercontent.com/a565551313/infinite-canvas/dev";
const customVersionUrl = `${customRawBase}/CUSTOM_VERSION`;
const customChangelogUrl = `${customRawBase}/CUSTOM_CHANGELOG.md`;

function readLocalReleases(): ReleaseInfo[] {
    return __APP_RELEASES__ || [];
}

function readLocalCustomReleases(): ReleaseInfo[] {
    return __CUSTOM_RELEASES__ || [];
}

function toVersionParts(version: string) {
    const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
    return match ? match.slice(1).map(Number) : null;
}

function isNewerVersion(latestVersion: string, currentVersion: string) {
    const latest = toVersionParts(latestVersion);
    const current = toVersionParts(currentVersion);
    if (!latest || !current) return false;
    return latest.some((value, index) => value > current[index] && latest.slice(0, index).every((part, prevIndex) => part === current[prevIndex]));
}

/** Reads a raw text file, returning an empty string when it is missing or unreadable. */
async function readRawText(url: string) {
    const response = await fetch(url);
    if (!response.ok) return "";
    return (await response.text()).trim();
}

export function useVersionCheck() {
    const { t } = useTranslation();
    const currentVersion = APP_VERSION;
    const currentCustomVersion = CUSTOM_VERSION;
    const { message } = App.useApp();
    const localReleases = useMemo(readLocalReleases, []);
    const localCustomReleases = useMemo(readLocalCustomReleases, []);
    const [latestVersion, setLatestVersion] = useState(currentVersion);
    const [releases, setReleases] = useState<ReleaseInfo[]>(localReleases);
    const [checking, setChecking] = useState(false);
    const [open, setOpen] = useState(false);
    const hasNewVersion = isNewerVersion(latestVersion, currentVersion);

    // Customization tracking is only meaningful for fork builds; upstream-only builds keep it disabled.
    const customEnabled = Boolean(currentCustomVersion);
    const [latestCustomVersion, setLatestCustomVersion] = useState(currentCustomVersion);
    const [customReleases, setCustomReleases] = useState<ReleaseInfo[]>(localCustomReleases);
    const [checkingCustom, setCheckingCustom] = useState(false);
    const hasNewCustomVersion = customEnabled && isNewerCustomVersion(latestCustomVersion, currentCustomVersion);

    const checkLatestVersion = useCallback(async () => {
        try {
            const response = await fetch(latestVersionUrl);
            if (!response.ok) return false;
            const version = await response.text();
            setLatestVersion(version.trim() || currentVersion);
            return true;
        } catch {
            return false;
        }
    }, [currentVersion]);

    const checkLatestRelease = useCallback(
        async (showMessage = false) => {
            setChecking(true);
            try {
                const [versionResponse, changelogResponse] = await Promise.all([fetch(latestVersionUrl), fetch(latestChangelogUrl)]);
                if (!versionResponse.ok) throw new Error(t("version.readFailed"));
                if (!changelogResponse.ok) throw new Error(t("version.changelogFailed"));
                const [version, changelog] = await Promise.all([versionResponse.text(), changelogResponse.text()]);
                setLatestVersion(version.trim() || currentVersion);
                if (changelog.trim()) setReleases(parseChangelog(changelog));
                if (showMessage) message.success(t("version.updated"));
                return true;
            } catch {
                setLatestVersion(currentVersion);
                setReleases(localReleases);
                if (showMessage) message.error(t("version.updateFailed"));
                return false;
            } finally {
                setChecking(false);
            }
        },
        [currentVersion, localReleases, message, t],
    );

    /** 检查定制更新：拉取本仓库 dev 分支的定制版本号与定制日志。 */
    const checkCustomRelease = useCallback(
        async (showMessage = false) => {
            if (!customEnabled) return false;
            setCheckingCustom(true);
            try {
                const [version, changelog] = await Promise.all([readRawText(customVersionUrl), readRawText(customChangelogUrl)]);
                if (!version) throw new Error(t("version.customReadFailed"));
                setLatestCustomVersion(version);
                if (changelog) setCustomReleases(parseChangelog(changelog));
                if (showMessage) {
                    if (isNewerCustomVersion(version, currentCustomVersion)) message.success(t("version.customNewFound", { version }));
                    else message.info(t("version.customUpToDate"));
                }
                return true;
            } catch {
                setLatestCustomVersion(currentCustomVersion);
                setCustomReleases(localCustomReleases);
                if (showMessage) message.error(t("version.customUpdateFailed"));
                return false;
            } finally {
                setCheckingCustom(false);
            }
        },
        [currentCustomVersion, customEnabled, localCustomReleases, message, t],
    );

    useEffect(() => {
        void checkLatestVersion();
    }, [checkLatestVersion]);

    useEffect(() => {
        if (!customEnabled) return;
        void checkCustomRelease();
    }, [checkCustomRelease, customEnabled]);

    const openReleaseModal = useCallback(() => {
        setOpen(true);
        void checkLatestRelease();
        void checkCustomRelease();
    }, [checkCustomRelease, checkLatestRelease]);

    return {
        open,
        setOpen,
        openReleaseModal,
        latestVersion,
        releases,
        checking,
        hasNewVersion,
        checkLatestRelease,
        customEnabled,
        currentCustomVersion,
        latestCustomVersion,
        customReleases,
        checkingCustom,
        hasNewCustomVersion,
        checkCustomRelease,
    };
}
