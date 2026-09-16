# 定制版本发布指南

本文件属于 fork 私有文档，上游没有同名文件，合并上游时不会冲突。
同理，**不要修改上游的 `VERSION` 和 `CHANGELOG.md`**，定制信息一律写入 `CUSTOM_VERSION` 和 `CUSTOM_CHANGELOG.md`。

## 分支职责

| 分支 | 职责 | 定制文件 |
| --- | --- | --- |
| `main` | 只跟上游同步，保持干净 | 无（前端自动隐藏定制区块） |
| `dev` | 上游 + 自己的定制，日常部署用这个 | 有 |

前端「检查定制更新」读取的是 **`dev` 分支的 raw 文件**，所以定制发布不需要重新构建或部署 Vercel。

## 版本号规则

```
v<上游基线>-custom.<定制序号>

v0.18.0-custom.1   基于上游 v0.18.0 的第 1 次定制
v0.18.0-custom.2   第 2 次定制
v0.19.0-custom.1   合并上游 v0.19.0 后，基线跟随上游，序号重置为 1
```

这样版本号本身就说明了「基于哪个上游 + 在其上改了几轮」，比另起一套独立编号信息量大。

## 发布流程

### 方式一：脚本（推荐）

```bash
# 先看看会发生什么，不写文件
node scripts/release-custom.mjs --dry-run

# 递增定制序号，并直接写入日志条目
node scripts/release-custom.mjs \
  --entry "[新增] 支持批量导出画布" \
  --entry "[修复] 暗色主题下标签颜色错误"

# 提交后打标签留档并推送
node scripts/release-custom.mjs --entry "[新增] xxx" --tag --push
```

脚本会自动：算出下一个版本号 → 在 `CUSTOM_CHANGELOG.md` 顶部插入带日期的新段 → 更新 `CUSTOM_VERSION` → `git add` + `commit`。加上 `--tag` 会打同名标签，`--push` 会推送当前分支和标签。

检测到上游基线变化（即你刚合并了新的上游版本）时，定制序号自动重置为 1。

### 方式二：手工

```bash
# 1. 编辑 CUSTOM_CHANGELOG.md，在第一个 `## ` 之前插入新段
#    ## v0.18.0-custom.2 - 2026-09-16
#
#    + [新增] xxx
#    + [修复] yyy

# 2. 编辑 CUSTOM_VERSION，改成 v0.18.0-custom.2

# 3. 提交推送
git add CUSTOM_VERSION CUSTOM_CHANGELOG.md
git commit -m "release: v0.18.0-custom.2"
git push origin dev

# 4. 打标签留档（可选，但建议）
git tag v0.18.0-custom.2
git push origin v0.18.0-custom.2
```

推送完成后，刷新页面点「检查定制更新」就能看到新版本，**不需要重新部署**。

## 日志格式要求

前端用 `web/src/lib/release.ts` 里的 `parseChangelog` 解析，正则比较严格，格式不对会静默丢失条目：

```markdown
## v0.18.0-custom.2 - 2026-09-16

+ [新增] 条目内容
+ [修复] 条目内容
```

- 版本段必须是行首 `## `，版本号与日期之间用 ` - ` 分隔
- 条目必须是行首 `+ [类型] 内容`，加号后有一个空格
- 可用类型：`新增` / `修复` / `调整` / `优化` / `文档`，其它类型会原样显示且没有配色
- 整段没有任何合法条目时，该版本不会出现在列表里

## 标签的作用

打 tag **不是**前端读取新版本的手段（那是 dev 分支 raw URL 干的活），它的价值是：

1. **留档快照** —— 知道某个定制版本对应哪个 commit
2. **可回滚** —— 定制搞砸了能直接 checkout 回去
3. **将来发 GitHub Release 的前提** —— 如果以后想把日志同时发布成 Release

所以每次定制发布顺手打一个即可，不影响前端行为。

## 前端实现位置

| 文件 | 作用 |
| --- | --- |
| `CUSTOM_VERSION` | 当前定制版本号 |
| `CUSTOM_CHANGELOG.md` | 定制日志，格式同上游 |
| `web/vite.config.ts` | 构建时读取上述两文件，注入 `__CUSTOM_VERSION__` / `__CUSTOM_RELEASES__` |
| `web/src/lib/release.ts` | `parseCustomVersion` / `isNewerCustomVersion` 版本号解析与比较 |
| `web/src/hooks/use-version-check.ts` | 远程拉取 dev 分支的定制版本与日志 |
| `web/src/components/layout/config-about.tsx` | 配置页「关于」的版本区 |
| `web/src/components/layout/version-release-modal.tsx` | 日志弹窗，定制日志 / 上游日志两个页签 |

`CUSTOM_VERSION` 缺失时（例如 `main` 分支的纯上游构建），`customEnabled` 为 `false`，界面自动退回上游原本的两卡片布局。

## 换仓库地址

定制 raw 地址默认指向 `a565551313/infinite-canvas` 的 `dev` 分支。如果换了 fork 或分支，改 `web/src/hooks/use-version-check.ts` 里的 `customRawBase`，或者构建时设置环境变量：

```bash
VITE_CUSTOM_RAW_BASE="https://raw.githubusercontent.com/<owner>/<repo>/<branch>" npm run build
```

> 注意：仓库必须是 public。private 仓库的 raw 文件匿名访问会 404，「检查定制更新」将不可用。
