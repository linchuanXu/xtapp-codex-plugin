# Agent installation prompt

Use this instruction in Codex Desktop or Codex CLI:

> Read
> `https://github.com/linchuanXu/xtapp-codex-plugin/blob/main/AGENTS.md`.
> Install the XTApp plugin into Codex using the **Install into Codex** lane.
> Preserve unrelated plugins, marketplaces, MCP servers, and auth state.
> Keep the bundled `xtapp_studio` MCP from this plugin. If XTApp Studio is
> not running, ask the user to start their installed Studio; do not invent
> a download URL, clone path, or install script. Open
> `http://127.0.0.1:5173/studio/preview?preview=1` in the Codex in-app
> browser and keep it open.
> Never invent a remote MCP URL, a fixed localhost path, or a source
> checkout path. Do not edit source, publish, or push. Report the installed
> plugin version, Studio reachability, and any remaining prerequisite.

After installation, start a new Codex task and send:

> Open the XTApp Studio preview for this project. I want a todo list XTApp
> that can add, complete, and delete tasks. Classic uses d-pad and OK.
> Pro also supports touch. Ask only the necessary questions, then give me
> a minimum runnable version.
