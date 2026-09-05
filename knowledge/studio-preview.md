# Studio 本地预览桥

## 作用

Studio 是本地项目和 Lua Worker 的运行 authority。Codex 插件只通过本机 `/preview/*` 接口排队命令，不读取用户的文件系统，也不执行 shell。

## 启动

启动已安装的 XTApp Studio，打开 `/studio/preview`（普通 `/studio` 页面也会连接桥）。默认控制地址是 `http://127.0.0.1:5173`，非默认端口通过 `XTAPP_STUDIO_CONTROL_URL` 配置。

## 能力

- `run` / `restart`：使用当前 IndexedDB 工程启动或重启 Lua Worker。
- `input`：模拟 `up/down/left/right/ok/back`；触摸仍由页面中的 Pro 设备画布处理。
- `stop`：停止当前 Worker。
- `/preview/events`：Studio 页面通过 SSE 接收命令，并通过 `/preview/state` 回传状态。
- `/preview/context`：回传受限的当前 Manifest、Lua 片段和最近运行日志，用于 Codex 联合分析。

## 诊断流程

遇到“按键不生效”时，先查 `topic=input` 的契约，再调用 `inspect_xtapp_preview_context` 查看当前入口的 `on_input`、Manifest、设备能力和最近日志。若契约没有明确说明，必须标记为未知并请求真实设备验证。

## 边界

Vite middleware 只适用于本地开发服务器。桌面发行版应把同一组接口迁移到随 Studio 启动的 loopback companion 服务；桥接服务必须只监听 `127.0.0.1`，校验输入枚举并限制上下文大小。
