# 在 Codex 中安装

[English](INSTALL_CODEX.md) · 中文

返回 [中文首页](../README.zh-CN.md)

## 支持的环境

- 带 `codex plugin marketplace` 的 Codex Desktop 或 Codex CLI
- 已登录的 XTApp Studio
- 插件选择器 `xtapp-codex-plugin@xtapp-codex-plugin-github`
- 自带 MCP 名称 `xtapp_studio`
- 预览页 `https://xtapp-ai-dev.xteink.cn/studio/preview?preview=1`（需登录）
- 保持官网预览页打开

## 常规 Git marketplace 安装

```bash
codex plugin marketplace add linchuanXu/xtapp-codex-plugin --ref main --json
codex plugin add xtapp-codex-plugin@xtapp-codex-plugin-github --json
```

如果预览页没有打开，请用户登录后打开
`https://xtapp-ai-dev.xteink.cn/studio/preview?preview=1`。不要编造下载地址、
clone 路径或安装脚本。

插件带有本地 `.mcp.json`，没有远程 MCP。

```bash
codex plugin list --json
```

期望的插件身份：

- 选择器：`xtapp-codex-plugin@xtapp-codex-plugin-github`
- Marketplace：`xtapp-codex-plugin-github`
- 版本：`release-manifest.json` 中的值
- MCP：自带 `xtapp_studio` stdio，命令 `node ./mcp/server.bundle.mjs`

安装后新开一个 Codex 任务，才会加载新的插件快照。然后调用
`get_xtapp_preview_status`，打开返回的 `previewUrl`（需登录），并保持打开。

## 已发布 Git marketplace 冒烟

可用隔离的 `CODEX_HOME` 验证包装，不碰日常 Codex 状态：

```bash
XTAPP_CODEX_PLUGIN_TEST_HOME="$(mktemp -d /tmp/xtapp-plugin-codex-home.XXXXXX)"
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin marketplace add \
  linchuanXu/xtapp-codex-plugin --ref main --json
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin add \
  xtapp-codex-plugin@xtapp-codex-plugin-github --json
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin list --json
```

只安装插件不会打开预览。完整冒烟需要先登录，打开
`https://xtapp-ai-dev.xteink.cn/studio/preview?preview=1`，再对这个页面调用
插件工具。`get_xtapp_preview_status` 按返回值原样阅读。未登录或连不上时必须
保持 `not_connected`，不能改去猜另一个主机。

只删除这次冒烟创建的临时目录。

## 未发布候选冒烟

维护者可以把当前仓库根目录当作 Git 源：

```bash
XTAPP_AGENT_PLUGIN_REPO="$(git rev-parse --show-toplevel)"
XTAPP_CODEX_PLUGIN_TEST_HOME="$(mktemp -d /tmp/xtapp-plugin-candidate-home.XXXXXX)"
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin marketplace add \
  "$XTAPP_AGENT_PLUGIN_REPO" --json
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin add \
  xtapp-codex-plugin@xtapp-codex-plugin-github --json
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin list --json
```

这条本地源只用于测试证据，不是普通用户的安装路径。

## Agent 完成报告

必须报告：

- marketplace / 插件是新装的还是已经存在；
- 已安装的插件 id 和版本；
- 自带的 `xtapp_studio` MCP 是否在；
- 是否到达 Studio 预览页；
- 预览运行是做完了还是仍在等待；
- 需要新开任务。

## 预览约定

只有桥接结果是 `complete` 才能说运行成功。`queued` 和 `queued_timeout` 表示
Studio 已接收命令，但还没返回执行结果。`not_connected` 表示预览页连不上。

源码同步只读取用户传入的当前工作区路径，留在本机。快照范围以外的二进制素材
仍由 Studio 的素材管线管理。

## 卸载

```bash
codex plugin remove xtapp-codex-plugin@xtapp-codex-plugin-github --json
codex plugin marketplace remove xtapp-codex-plugin-github --json
```

卸载插件不会删除 XTApp Studio、IndexedDB 预览状态或用户的 App 项目。那些只在
用户另外明确要求时才删除。
