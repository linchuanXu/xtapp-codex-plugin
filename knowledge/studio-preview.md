# Studio 预览桥

## 作用

用户在本地写 XTApp，打开一个官网预览页看效果，改本地代码后页面更新。Studio 是项目和 Lua Worker 的运行 authority。Codex 插件通过官网 `/preview/*` 排队命令。模拟器画面在官网预览页，不在右侧 widget。

`run_xtapp_preview` 必须带当前 worktree 的绝对路径 `projectDir`。它会读取本机 Lua、Manifest、data、lang，以及有上限的 `assets/*.xic`。官网会为这个 worktree **新建或复用独立项目**，不会覆盖用户正在写的其他工程（例如斗地主）。不要说插件不读文件系统。不要省略 `projectDir` 去跑官网里已经打开的项目。

## 启动

1. 调用 `run_xtapp_preview`，把返回的 `previewUrl` 原样交给用户。
2. 请用户打开这条链接。如果出现登录页，先登录，再回到同一条地址，并保持打开。
3. 该地址必须带插件 session。不要只打开 `https://xtapp-ai-dev.xteink.cn/studio/preview?preview=1`。
4. 用户说打开后，再调 `get_xtapp_preview_status`。仍是 `need_login_or_open_page` 时，停下来，把同一条 URL 再给一次。
5. MCP 重启后 session 复用本机 `~/.xtapp/codex-preview-session`，同一 URL 仍然有效。文件监听不会跨进程存活，每次预览都要再走一遍就绪检查。

`not_connected` / `need_login_or_open_page` 表示预览页没开、没登录，或打开的 URL 不是插件返回的那条。不要报成功。

人读状态：`need_login_or_open_page`、`running`、`timeout`、`page_open`。

## 能力

- `run_xtapp_preview`：检查连接 → 同步当前 worktree → 启动或刷新。页没开时只返回 URL。若状态是 `stopped` 或 `error`，改走 `restart`。每次调用会重新挂上 1 秒文件监听。
- `restart_xtapp_preview`：强制重新拉起 Lua Worker。
- `sync_xtapp_preview_source`：只同步源码，不启动。
- `input`：模拟 `up/down/left/right/ok/back`。
- `tap_xtapp_preview_target`：只在 Lua 声明了 `__testing_interactions` 时有效；默认模板通常没有。坐标点击用 `send_xtapp_preview_touch`，或让用户点画布。
- `stop`：停止当前 Worker。
- `capture_xtapp_preview`：截当前模拟器 PNG。
- `/preview/context`：回传受限 Manifest、Lua 片段和最近日志。

右侧 widget 只报连接、应用名和 previewUrl，不是模拟器。

## 诊断

按键不生效时，先查 `topic=input`，再调用 `inspect_xtapp_preview_context`。不要把 `queued` / `queued_timeout` / `not_connected` / `need_login_or_open_page` 报成运行成功。装完插件后需要新开一个 Codex 任务才会加载 MCP。
