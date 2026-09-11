# XTApp Codex Plugin

English · [中文文档](README.zh-CN.md)

This is an agent-first, lightweight distribution repository for the
XTApp plugin. Codex Desktop / Codex CLI is the marketplace host. Cursor
uses the same bundled MCP and opens preview in its built-in browser.

## Give this repository to an agent

Give Codex this instruction (Cursor prompt is in [`AGENT_PROMPT.md`](AGENT_PROMPT.md)):

> Read
> `https://github.com/linchuanXu/xtapp-codex-plugin/blob/main/AGENTS.md`
> and install the XTApp plugin into Codex. Follow the Install into Codex
> lane, preserve existing configuration, keep the bundled `xtapp_studio`
> MCP, and report any XTApp Studio prerequisite.

The detailed entrypoint is [`AGENTS.md`](AGENTS.md); a reusable prompt is in
[`AGENT_PROMPT.md`](AGENT_PROMPT.md).

## Architecture

The plugin is the agent entry. It bundles skills, a local stdio MCP, and a
Codex-only status widget. It does not execute Lua and it is not the device
simulator:

```text
Codex: marketplace plugin; user opens previewUrl
Cursor: same xtapp_studio MCP; built-in browser opens previewUrl
  -> XTApp Studio preview page
  -> Lua Worker / X4 Classic / X4 Pro simulator
```

Users write locally, then one official webpage runs the preview. Call
`run_xtapp_preview` with the current worktree path. That `previewUrl`
includes the plugin session. Do not open the bare
`/studio/preview?preview=1` page. Cursor must open the URL in its built-in
browser and keep the tab there. Codex gives the URL to the user. If login
appears, the user signs in and returns to the same URL. Do not click the
simulator DOM; use `send_xtapp_preview_touch` / `send_xtapp_preview_input`.
`need_login_or_open_page` / `not_connected` is not success. The official
page may already have another project open; sync creates or reuses a
plugin-owned project for this worktree instead of overwriting it.

## Current package

- Marketplace: `xtapp-codex-plugin-github`
- Plugin: `xtapp-codex-plugin`
- Display name: `XTApp Studio`
- Stable plugin selector: `xtapp-codex-plugin@xtapp-codex-plugin-github`
- Plugin version: `0.1.5`
- Distribution: published Git marketplace from `main` (Codex)
- Hosts: Codex (marketplace); Cursor (same MCP + built-in browser)
- MCP: bundled `xtapp_studio` stdio (`node ./mcp/server.bundle.mjs`)
- Runtime: signed-in XTApp Studio
- Default preview: official Studio host; always use the `previewUrl` from `get_xtapp_preview_status`
- Skills: `xtapp-contracts`, `xtapp-open-preview`
- Public knowledge: `knowledge/index.json` (schema 2, 22 entries)
- Public catalog: `catalog/index.json` (107 reviewed text templates)
- Widget: `widget/index.html` shows preview status, not the simulator frame
- GitHub ZIP / repository archive: install through the Git marketplace
  commands below. Do not copy files into a Codex home by hand.

## Direct installation

```bash
codex plugin marketplace add linchuanXu/xtapp-codex-plugin --ref main --json
codex plugin add xtapp-codex-plugin@xtapp-codex-plugin-github --json
```

The plugin already ships `.mcp.json`. Do not invent a remote MCP URL or a
Studio source path. Verify:

```bash
codex plugin list --json
```

If the plugin is already installed, refresh the marketplace instead of
building a custom updater:

```bash
codex plugin marketplace upgrade xtapp-codex-plugin-github --json
codex plugin add xtapp-codex-plugin@xtapp-codex-plugin-github --json
```

Codex may also auto-upgrade this Git marketplace on plugin startup. Start
a new Codex task after install or upgrade so the MCP snapshot reloads.

If the preview is not open, give the user the exact `previewUrl` and ask
them to open it. If a login page appears, they should log in and return
to that URL. Keep it open. Then ask Codex to preview the current
worktree.

Cursor has no plugin marketplace. From a checkout of this repository:

```bash
node scripts/cursor-mcp-config.mjs --write-user
```

That upserts `xtapp_studio` into `~/.cursor/mcp.json`. Reload MCP, symlink
the two skills, start a new Agent chat, then let the agent open
`previewUrl` in Cursor's built-in browser. See
[docs/INSTALL_CURSOR.md](docs/INSTALL_CURSOR.md).

See [docs/INSTALL_CODEX.md](docs/INSTALL_CODEX.md) for Codex isolated
validation and uninstall, or the [Chinese install guide](docs/INSTALL_CODEX.zh-CN.md).
Identity fields live in [`release-manifest.json`](release-manifest.json).

## Source and release boundary

This repository contains the portable Codex marketplace payload,
marketplace metadata, bundled public knowledge, bundled public templates,
and installation documentation. Cursor is documented as a consumer of the
same MCP, not a second host directory. Lua execution, asset pipelines, and
the device simulator stay in XTApp Studio.

Product updates behind the stable `/preview/*` contract do not
automatically change this repository. Refresh the knowledge index and
catalog only from maintainer-local sources, and never publish those
source locations.

This revision ships the Codex payload at the repository root. Do not nest
it under `plugins/codex/`. Do not add `hosts/cursor/`.
