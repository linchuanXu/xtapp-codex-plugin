# 在 Codex 中安装

[English](INSTALL_CODEX.md) · 中文

返回 [中文首页](../README.zh-CN.md)

## 支持的环境

- 带 `codex plugin marketplace` 的 Codex Desktop 或 Codex CLI
- 本机已安装并正在运行的 XTApp Studio
- 插件选择器 `xtapp-codex-plugin@xtapp-codex-plugin-github`
- 自带 MCP 名称 `xtapp_studio`
- 预览页 `http://127.0.0.1:5173/studio/preview?preview=1`
- Studio 进程必须保持运行；这一版没有无头伴生服务

## 常规 Git marketplace 安装

```bash
codex plugin marketplace add linchuanXu/xtapp-codex-plugin --ref main --json
codex plugin add xtapp-codex-plugin@xtapp-codex-plugin-github --json
```

如果 XTApp Studio 没有在运行，请用户启动已安装的 Studio。不要编造下载地址、
clone 路径或安装脚本。不要写死端口或源码路径。

插件带有本地 `.mcp.json`，没有远程 MCP。

```bash
codex plugin list --json
```

期望的插件身份：

- 选择器：`xtapp-codex-plugin@xtapp-codex-plugin-github`
- Marketplace：`xtapp-codex-plugin-github`
- 版本：`release-manifest.json` 中的值
- MCP：自带 `xtapp_studio` stdio，命令 `node ./mcp/server.bundle.mjs`

安装后新开一个 Codex 任务，才会加载新的插件快照。然后打开预览页并保持打开。
如果浏览器提供「连接文件夹」，选当前工作区；否则让 Codex 监听工作区。文件夹
同步只是方便路径，不是安装门槛。

Studio 不在默认端口时：

```bash
XTAPP_STUDIO_CONTROL_URL=http://127.0.0.1:5173
```

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

只安装插件不会启动 Studio。完整冒烟需要另外启动 Studio，打开
`/studio/preview?preview=1`，再对这条本机桥调用插件工具。
`get_xtapp_preview_status` 按返回值原样阅读。连不上时必须保持
`not_connected`，不能改去猜另一个主机。

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
Studio 已接收命令，但还没返回执行结果。`not_connected` 表示本机桥断开。

源码同步只读取用户传入的当前工作区路径，留在本机。快照范围以外的二进制素材
仍由 Studio 的素材管线管理。

## 卸载

```bash
codex plugin remove xtapp-codex-plugin@xtapp-codex-plugin-github --json
codex plugin marketplace remove xtapp-codex-plugin-github --json
```

卸载插件不会删除 XTApp Studio、IndexedDB 预览状态或用户的 App 项目。那些只在
用户另外明确要求时才删除。
