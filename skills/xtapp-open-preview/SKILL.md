---
name: xtapp-open-preview
description: Open the official XTApp Studio preview in Codex and keep it synchronized with the active project.
---

When the user asks to see or run the XTApp project, call `render_xtapp_studio_widget` once for Codex status, then call `get_xtapp_preview_status` and open or reuse the Codex in-app browser at the returned `previewUrl` (login required). That URL already includes the plugin session; do not open the bare `/studio/preview?preview=1` page. The widget only reports status. The simulator lives on that official page.

Use `run_xtapp_preview` with the absolute current worktree path in `projectDir`. That call reads the local worktree (Lua, Manifest, data, language files, and bounded `assets/*.xic`) and overwrites the official Studio project. It also starts one worktree watcher. If the preview status is `stopped` or `error`, the tool sends `restart` instead of `run`. Report the returned status (`complete`, `queued_timeout`, `error`, or `not_connected`) instead of claiming success.

Use `watch_xtapp_preview` only to explicitly stop or restart the automatic watcher. Use `sync_xtapp_preview_source` for a one-off source refresh, `get_xtapp_preview_status` for follow-up state, `get_xtapp_preview_targets` to read Lua-declared semantic targets and `frameRevision`, `tap_xtapp_preview_target` only when those targets exist, `send_xtapp_preview_touch` for logical touch coordinates, `send_xtapp_preview_input` for semantic keys, `capture_xtapp_preview` for the current PNG, `restart_xtapp_preview` after a manual retry, and `stop_xtapp_preview` when asked to stop. For diagnosis, call `inspect_xtapp_preview_context` and combine its project snippets and logs with a contract search. Do not start a second preview server. If the bridge reports `not_connected`, ask the user to sign in and keep the same `previewUrl` open.
