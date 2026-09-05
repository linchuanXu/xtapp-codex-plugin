# Studio 预览桥

## 作用

Studio 是项目和 Lua Worker 的运行 authority。Codex 插件只通过 `/preview/*` 接口排队命令，不读取用户的文件系统，也不执行 shell。

## 启动

登录 XTApp Studio，打开官网预览页（需登录）：

`https://xtapp-ai-dev.xteink.cn/studio/preview?preview=1`

保持这个页面打开。本机覆盖通过 `XTAPP_STUDIO_CONTROL_URL` 配置。

## 能力

- `run` / `restart`：使用当前 IndexedDB 工程启动或重启 Lua Worker。
- `input`：模拟 `up/down/left/right/ok/back`；触摸仍由页面中的 Pro 设备画布处理。
- `stop`：停止当前 Worker。
- `/preview/events`：Studio 页面通过 SSE 接收命令，并通过 `/preview/state` 回传状态。
- `/preview/context`：回传受限的当前 Manifest、Lua 片段和最近运行日志，用于 Codex 联合分析。

## 诊断流程

遇到“按键不生效”时，先查 `topic=input` 的契约，再调用 `inspect_xtapp_preview_context` 查看当前入口的 `on_input`、Manifest、设备能力和最近日志。若契约没有明确说明，必须标记为未知并请求真实设备验证。

## 边界

预览页必须保持打开。未登录或页面不可达时状态是 `not_connected`。桥接服务校验输入枚举并限制上下文大小。
