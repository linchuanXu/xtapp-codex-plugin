---
name: xtapp-open-preview
description: Open the official XTApp Studio preview for the current local worktree and keep it synchronized.
---

The user writes XTApp code locally. They open one official webpage to preview it. After local edits, that page updates. The right-side widget is status only. The simulator is on the official page.

## Every preview request

1. Call `run_xtapp_preview` with the **absolute current worktree** in `projectDir`. Never omit it. Never preview whatever leftover project is already open on the official page.
2. Give the user the exact returned `previewUrl`. Ask them to open it. If a login page appears, they should log in and return to that same URL. Keep it open.
3. If the tool returns `need_login_or_open_page` / `not_connected`, do not claim success. After the user says they opened it, call `get_xtapp_preview_status`. If it is still disconnected, stop and give them the **same** URL again.
4. After code changes, call `run_xtapp_preview` again with the same `projectDir`. Do not assume the file watcher is still alive after an MCP or process restart.

Official Studio may already have another project open (for example 斗地主). Sync creates or reuses a Codex-owned project for **this** worktree. It must not overwrite the user's other Studio projects.

Human statuses:

- `need_login_or_open_page`: give the URL; wait for the user.
- `running`: the official page is showing this worktree.
- `timeout`: the page accepted the command but the run did not finish; confirm the same URL is still open, then retry.
- `page_open`: the page is connected but this worktree is not running yet; call `run_xtapp_preview`.

After plugin install, start a **new Codex task** before preview.

## Other tools

Use `get_xtapp_preview_status` to refresh the widget and confirm the page. Use `watch_xtapp_preview` only to stop or restart the watcher. Use `sync_xtapp_preview_source` for a one-off source push, `send_xtapp_preview_input` for keys, `send_xtapp_preview_touch` for coordinates, `tap_xtapp_preview_target` only when Lua published `__testing_interactions`, `capture_xtapp_preview` for a PNG, `restart_xtapp_preview` for a manual retry, and `stop_xtapp_preview` to stop. Diagnose with `inspect_xtapp_preview_context` plus a contract search. Do not start a second preview server.
