export type ReleaseInfo = {
    version: string;
    date: string;
    items: { type: string; content: string }[];
};

/** 解析 `v0.18.0-custom.3` 形式的定制版本号，返回上游基线三元组与定制序号。 */
export function parseCustomVersion(version: string) {
    const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-custom\.(\d+))?/i);
    if (!match) return null;
    return { base: [Number(match[1]), Number(match[2]), Number(match[3])], custom: Number(match[4] || 0) };
}

/** 比较两个定制版本号：先比上游基线，基线相同再比定制序号。 */
export function isNewerCustomVersion(latestVersion: string, currentVersion: string) {
    const latest = parseCustomVersion(latestVersion);
    const current = parseCustomVersion(currentVersion);
    if (!latest || !current) return false;
    for (let index = 0; index < latest.base.length; index += 1) {
        if (latest.base[index] !== current.base[index]) return latest.base[index] > current.base[index];
    }
    return latest.custom > current.custom;
}

/** 从定制版本号中取出上游基线，例如 `v0.18.0-custom.3` -> `v0.18.0`。 */
export function customVersionBaseline(version: string) {
    const match = version.trim().match(/^v?\d+\.\d+\.\d+/);
    return match ? match[0] : "";
}

export function parseChangelog(content: string): ReleaseInfo[] {
    return content
        .split(/^## /m)
        .slice(1)
        .map((block) => {
            const [title = "", ...lines] = block.trim().split("\n");
            const [, version = title.trim(), date = ""] = title.match(/^(.+?)(?:\s+-\s+(.+))?$/) || [];
            return {
                version: version.trim(),
                date: date.trim(),
                items: lines
                    .map((line) => line.trim().match(/^\+\s+\[(.+?)\]\s+(.+)$/))
                    .filter((match): match is RegExpMatchArray => Boolean(match))
                    .map((match) => ({ type: match[1], content: match[2] })),
            };
        })
        .filter((release) => release.items.length);
}
