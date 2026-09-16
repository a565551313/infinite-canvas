#!/usr/bin/env node
/**
 * 定制版本发布脚本。
 *
 * 用法：
 *   node scripts/release-custom.mjs                          递增定制序号并写入日志骨架
 *   node scripts/release-custom.mjs --entry "[新增] xxx"     直接带上日志条目（可重复）
 *   node scripts/release-custom.mjs --set v0.19.0-custom.1   手动指定版本号
 *   node scripts/release-custom.mjs --tag --push             顺便打 tag 并推送 dev 与 tag
 *   node scripts/release-custom.mjs --dry-run                只打印将要发生的变化
 *
 * 版本号规则：v<上游基线>-custom.<定制序号>
 *   - 上游基线取自根目录 VERSION，与上游合并后会自动跟随
 *   - 基线变化时定制序号重置为 1，否则在原有基础上 +1
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const versionFile = resolve(rootDir, "VERSION");
const customVersionFile = resolve(rootDir, "CUSTOM_VERSION");
const customChangelogFile = resolve(rootDir, "CUSTOM_CHANGELOG.md");

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--") && !arg.includes("=")));
const readOption = (name) => {
    const inline = args.find((arg) => arg.startsWith(`--${name}=`));
    if (inline) return inline.slice(name.length + 3);
    const index = args.indexOf(`--${name}`);
    return index >= 0 ? args[index + 1] : "";
};
const entryList = [];
for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--entry" && args[index + 1]) entryList.push(args[index + 1]);
}

const dryRun = flags.has("--dry-run");
const withTag = flags.has("--tag");
const withPush = flags.has("--push");
const explicitVersion = readOption("set");

function read(file, fallback = "") {
    try {
        return readFileSync(file, "utf8");
    } catch {
        return fallback;
    }
}

const baseline = read(versionFile).trim().replace(/^v/, "") || "0.0.0";
const currentCustom = read(customVersionFile).trim();
const parsed = currentCustom.match(/^v?(\d+\.\d+\.\d+)-custom\.(\d+)$/i);
const currentBaseline = parsed ? parsed[1] : "";
const currentSequence = parsed ? Number(parsed[2]) : 0;

// 上游基线变化（合并了新的上游版本）时，定制序号从 1 重新开始。
const baselineChanged = currentBaseline !== baseline;
const nextVersion = explicitVersion || `v${baseline}-custom.${baselineChanged ? 1 : currentSequence + 1}`;

const today = new Date().toISOString().slice(0, 10);
const sectionLines = [`## ${nextVersion} - ${today}`, ""];
if (entryList.length) entryList.forEach((entry) => sectionLines.push(entry.startsWith("+ ") ? entry : `+ ${entry}`));
else sectionLines.push("+ [新增] 待补充本次定制改动。");
sectionLines.push("");

const changelog = read(customChangelogFile);
if (!changelog.trim()) {
    console.error("找不到 CUSTOM_CHANGELOG.md，请先创建该文件。");
    process.exit(1);
}

// 在第一个 `## ` 版本段之前插入新段，保留文件顶部的说明文字。
const firstSection = changelog.search(/^## /m);
if (firstSection < 0) {
    console.error("CUSTOM_CHANGELOG.md 中找不到任何 `## ` 版本段，无法确定插入位置。");
    process.exit(1);
}
const nextChangelog = `${changelog.slice(0, firstSection)}${sectionLines.join("\n")}\n${changelog.slice(firstSection)}`;

console.log(`定制版本：${currentCustom || "(无)"} -> ${nextVersion}`);
console.log(`上游基线：v${baseline}${baselineChanged ? "（已变化，定制序号重置为 1）" : ""}`);
console.log(`日志条目：${entryList.length} 条${entryList.length ? "" : "（骨架，请手动补充）"}`);

if (dryRun) {
    console.log("\n--- dry-run，将要写入的日志段 ---");
    console.log(sectionLines.join("\n"));
    process.exit(0);
}

writeFileSync(customVersionFile, `${nextVersion}\n`, "utf8");
writeFileSync(customChangelogFile, nextChangelog, "utf8");
console.log("已更新 CUSTOM_VERSION 与 CUSTOM_CHANGELOG.md");

function git(...command) {
    return execFileSync("git", command, { cwd: rootDir, encoding: "utf8" }).trim();
}

git("add", "CUSTOM_VERSION", "CUSTOM_CHANGELOG.md");
git("commit", "-m", `release: ${nextVersion}`);
console.log(`已提交 release: ${nextVersion}`);

if (withTag) {
    git("tag", nextVersion);
    console.log(`已打标签 ${nextVersion}`);
}

if (withPush) {
    const branch = git("rev-parse", "--abbrev-ref", "HEAD");
    git("push", "origin", branch);
    console.log(`已推送到 origin/${branch}`);
    if (withTag) {
        git("push", "origin", nextVersion);
        console.log(`已推送标签 ${nextVersion}`);
    }
    console.log("\n发布完成：前端「检查定制更新」现在就能读到新版本，无需重新构建或部署。");
} else {
    console.log("\n未推送。确认无误后执行：");
    console.log(`  git push origin dev${withTag ? ` && git push origin ${nextVersion}` : ""}`);
}
