# XTApp Codex Plugin

[English](README.md) · 中文

这是 XTApp Codex 插件的轻量分发仓库，面向 agent 安装。当前支持的宿主是 Codex Desktop / Codex CLI。

## 把这个仓库交给 agent

把下面这段话发给 Codex：

> 阅读
> [`AGENTS.md`](AGENTS.md)
> 并按 Install 车道把 XTApp 插件装进 Codex。保留已有配置，使用插件自带的
> `xtapp_studio` MCP，并报告 XTApp Studio 是否还缺前提。

详细入口是 [`AGENTS.md`](AGENTS.md)；可复用提示词在 [`AGENT_PROMPT.md`](AGENT_PROMPT.md)。

中文安装说明：[docs/INSTALL_CODEX.zh-CN.md](docs/INSTALL_CODEX.zh-CN.md)

## 架构

插件是 Codex 入口。它打包 skills、本地 stdio MCP 和状态 Widget。它不执行 Lua，也不是设备模拟器：

```text
Codex 插件
  -> 自带 xtapp_studio MCP
  -> XTApp Studio 预览页
  -> Lua Worker / X4 Classic / X4 Pro 模拟器
```

用户在本地写代码，打开一个官网预览页看效果。调用 `run_xtapp_preview` 并带上
当前 worktree 路径，把返回的 `previewUrl` 原样交给用户（需登录，URL 带
session）。不要只打开 `/studio/preview?preview=1`。如果出现登录页，先登录再
回到同一条地址。`need_login_or_open_page` / `not_connected` 表示预览页连不上
或 session 不一致，不是成功。官网可能已经打开了别的项目；同步会为这个
worktree 新建或复用独立项目，不会覆盖用户其他工程。

## 当前包

- Marketplace：`xtapp-codex-plugin-github`
- Plugin：`xtapp-codex-plugin`
- 显示名：`XTApp Studio`
- 稳定选择器：`xtapp-codex-plugin@xtapp-codex-plugin-github`
- 插件版本：`0.1.3`
- 分发：从 `main` 发布的 Git marketplace
- 宿主：仅 Codex
- MCP：自带 `xtapp_studio` stdio（`node ./mcp/server.bundle.mjs`）
- 运行时：已登录的 XTApp Studio
- 默认预览：以 `get_xtapp_preview_status` 返回的 `previewUrl` 为准
- Skills：`xtapp-contracts`、`xtapp-open-preview`
- 公开知识：`knowledge/index.json`（schema 2，22 条）
- 公开目录：`catalog/index.json`（107 个审核过的文本模板）
- Widget：`widget/index.html` 显示预览状态，不是模拟器画面
- GitHub ZIP / 仓库压缩包：用下面的 marketplace 命令安装，不要把手动复制进 Codex 目录

## 直接安装

```bash
codex plugin marketplace add linchuanXu/xtapp-codex-plugin --ref main --json
codex plugin add xtapp-codex-plugin@xtapp-codex-plugin-github --json
```

插件已经带有 `.mcp.json`。不要编造远程 MCP 地址或 Studio 源码路径。验证：

```bash
codex plugin list --json
```

已经装过插件时，用市场升级，不要自己写更新器：

```bash
codex plugin marketplace upgrade xtapp-codex-plugin-github --json
codex plugin add xtapp-codex-plugin@xtapp-codex-plugin-github --json
```

Codex 也可能在插件启动时自动升级这个 Git 市场。安装或升级后新开一个
Codex 任务，才会加载新的 MCP。

如果预览页没有打开，把 `previewUrl` 原样给用户。出现登录页就先登录，再回到
同一条地址，并保持打开。然后再让 Codex 预览当前 worktree。

隔离验证和卸载见 [docs/INSTALL_CODEX.zh-CN.md](docs/INSTALL_CODEX.zh-CN.md)。
包身份在 [`release-manifest.json`](release-manifest.json)。

## 源码与发布边界

这个仓库只放可分发的 Codex 包、marketplace 元数据、公开知识、公开模板和安装
文档。Lua 执行、素材管线和设备模拟器留在 XTApp Studio 里。

`/preview/*` 契约背后的产品更新不会自动改这个仓库。知识和模板只能从维护者
本机源刷新，并且不能把那些源位置写进本仓库。

这一版把 Codex 包放在仓库根目录。除非已经有第二个经过验证的宿主包，否则不要
把它嵌到 `plugins/codex/` 下面。
