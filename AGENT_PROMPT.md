# Agent installation prompt

## Any MCP agent

Use this instruction in any host that can run a local stdio MCP:

> Read
> `https://github.com/linchuanXu/xtapp-codex-plugin/blob/main/AGENTS.md`.
> Install XTApp using the **Install as MCP** lane. From a checkout of
> this repository, run `node scripts/cursor-mcp-config.mjs` and merge only
> `mcpServers.xtapp_studio` into this host's MCP config without deleting
> other servers. If the host supports Agent Skills, symlink
> `skills/xtapp-contracts` and `skills/xtapp-open-preview`. Reload MCP,
> then start a new agent session. Call `run_xtapp_preview` with the
> current worktree path. Open the exact `previewUrl`: use a host browser
> MCP if one exists, otherwise give me the URL. If a login page appears,
> stop and let me sign in; do not fill credentials. Do not click the
> simulator DOM; use `send_xtapp_preview_touch` and
> `send_xtapp_preview_input`. Do not invent a remote MCP URL, a second
> preview server, or a host plugin directory. Do not edit source, publish,
> or push unless I asked. Report MCP registration, whether the preview
> URL was opened, and any remaining prerequisite.

After MCP reload, start a new session and send:

> Open the XTApp Studio preview for this project. I want a todo list XTApp
> that can add, complete, and delete tasks. Classic uses d-pad and OK.
> Pro also supports touch. Ask only the necessary questions, then give me
> a minimum runnable version.

## Codex plugin

Use this instruction in Codex Desktop or Codex CLI. Codex can install the
same MCP as a marketplace plugin:

> Read
> `https://github.com/linchuanXu/xtapp-codex-plugin/blob/main/AGENTS.md`.
> Install the XTApp plugin into Codex using the **Install into Codex** lane.
> Preserve unrelated plugins, marketplaces, MCP servers, and auth state.
> Keep the bundled `xtapp_studio` MCP from this plugin. Call
> `run_xtapp_preview` with the current worktree path, give the user the
> exact `previewUrl`, and ask them to open it. If a login page appears,
> they log in and return to that URL. Keep it open. Do not invent a
> download URL, clone path, or install script.
> Never invent a remote MCP URL, a fixed localhost path, or a source
> checkout path. Do not edit source, publish, or push. Report the installed
> plugin version, Studio reachability, and any remaining prerequisite.

After installation, start a new Codex task and send the same todo-list
preview prompt as above.

## Cursor (MCP client with a browser)

Cursor has no plugin marketplace. It is the MCP lane plus a built-in
browser:

> Read
> `https://github.com/linchuanXu/xtapp-codex-plugin/blob/main/AGENTS.md`.
> Install XTApp using the **Install as MCP** lane. Run
> `node scripts/cursor-mcp-config.mjs --write-user` from a checkout of
> this repository so `~/.cursor/mcp.json` gets `xtapp_studio` without
> deleting other servers. Symlink `skills/xtapp-contracts` and
> `skills/xtapp-open-preview` into `~/.cursor/skills/` or this project's
> `.cursor/skills/`. Reload MCP, then start a new Agent chat. Call
> `run_xtapp_preview` with the current worktree path, then open the exact
> `previewUrl` in Cursor's built-in browser and keep that tab open. If a
> login page appears, stop and let me sign in in that tab; do not fill
> credentials. Do not click the simulator DOM; use
> `send_xtapp_preview_touch` and `send_xtapp_preview_input`. Do not invent
> a remote MCP URL or a second preview server. Do not edit source, publish,
> or push unless I asked. Report MCP registration, whether the built-in
> browser opened the preview URL, and any remaining prerequisite.

After MCP reload, start a new Agent chat and send the same todo-list
preview prompt as above.
