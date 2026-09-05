# Studio 预览桥

## 作用

Studio 是项目和 Lua Worker 的运行 authority。Codex 插件通过官网 `/preview/*` 排队命令。模拟器画面在官网预览页，不在右侧 widget。

`run_xtapp_preview` / `sync_xtapp_preview_source` 会读取用户传入的本机 worktree（Lua、Manifest、data、lang，以及有上限的 `assets/*.xic`），并覆盖官网当前工程。不要说插件不读文件系统。

## 启动

1. 调用 `get_xtapp_preview_status`，打开返回的 `previewUrl`（需登录）。
2. 该地址必须带插件 session。不要只打开 `https://xtapp-ai-dev.xteink.cn/studio/preview?preview=1`。
3. 保持这个页面打开。MCP 重启后 session 会复用本机 `~/.xtapp/codex-preview-session`，同一 URL 仍然有效。

`not_connected` 表示预览页没开、没登录，或打开的 URL 不是插件返回的那条。

## 能力

- `run_xtapp_preview`：同步 worktree 后启动预览。若当前状态是 `stopped` 或 `error`，会改走 `restart`，避免假成功。
- `restart_xtapp_preview`：强制重新拉起 Lua Worker。
- `sync_xtapp_preview_source`：只同步源码，不启动。
- `input`：模拟 `up/down/left/right/ok/back`。
- `tap_xtapp_preview_target`：只在 Lua 声明了 `__testing_interactions` 时有效；默认模板通常没有。坐标点击用 `send_xtapp_preview_touch`，或让用户点画布。
- `stop`：停止当前 Worker。
- `capture_xtapp_preview`：截当前模拟器 PNG。
- `/preview/context`：回传受限 Manifest、Lua 片段和最近日志。

右侧 widget 只报状态，不是模拟器。

## 诊断

按键不生效时，先查 `topic=input`，再调用 `inspect_xtapp_preview_context`。不要把 `queued` / `queued_timeout` / `not_connected` 报成运行成功。装完插件后需要新开一个 Codex 任务才会加载 MCP。
