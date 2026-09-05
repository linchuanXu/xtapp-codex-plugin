# XTApp Codex Plugin

English · [中文文档](README.zh-CN.md)

This is an agent-first, lightweight distribution repository for the
XTApp Codex plugin. Codex Desktop / Codex CLI is the first supported host.

## Give this repository to an agent

Give Codex this instruction:

> Read
> `https://github.com/linchuanXu/xtapp-codex-plugin/blob/main/AGENTS.md`
> and install the XTApp plugin into Codex. Follow the Install lane, preserve
> existing configuration, keep the bundled `xtapp_studio` MCP, and report any
> XTApp Studio prerequisite.

The detailed entrypoint is [`AGENTS.md`](AGENTS.md); a reusable prompt is in
[`AGENT_PROMPT.md`](AGENT_PROMPT.md).

## Architecture

The plugin is the Codex entry. It bundles skills, a local stdio MCP, and a
status widget. It does not execute Lua and it is not the device simulator:

```text
Codex plugin
  -> bundled xtapp_studio MCP
  -> local XTApp Studio preview bridge
  -> Lua Worker / X4 Classic / X4 Pro simulator
```

Users install this plugin and keep XTApp Studio running. The MCP talks to
`http://127.0.0.1:5173/preview/*` on loopback only. There is no remote MCP
dependency and no Codex-side Studio credential. A preview status of
`not_connected` means Studio is not reachable; it is not success.

## Current package

- Marketplace: `xtapp-codex-plugin-github`
- Plugin: `xtapp-codex-plugin`
- Display name: `XTApp Studio`
- Stable plugin selector: `xtapp-codex-plugin@xtapp-codex-plugin-github`
- Plugin version: `0.1.0`
- Distribution: published Git marketplace from `main`
- Host: Codex only
- MCP: bundled `xtapp_studio` stdio (`node ./mcp/server.bundle.mjs`)
- Local runtime: installed XTApp Studio
- Default control URL: `http://127.0.0.1:5173`
- Default preview: `http://127.0.0.1:5173/studio/preview?preview=1`
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

If XTApp Studio is not running, ask the user to start their installed
Studio. Do not invent a download URL, clone command, or install script.
Open the preview page in the Codex in-app browser and keep it open. Start
a new Codex task after plugin installation, then ask Codex to run the
current XTApp project.

See [docs/INSTALL_CODEX.md](docs/INSTALL_CODEX.md) for isolated validation
and uninstall, or the [Chinese install guide](docs/INSTALL_CODEX.zh-CN.md).
Identity fields live in [`release-manifest.json`](release-manifest.json).

## Source and release boundary

This repository contains the portable Codex payload, marketplace metadata,
bundled public knowledge, bundled public templates, and installation
documentation. Lua execution, asset pipelines, and the device simulator
stay in the user's installed XTApp Studio.

Product updates behind the stable `/preview/*` contract do not
automatically change this repository. Refresh the knowledge index and
catalog only from maintainer-local sources, and never publish those
source locations.

This revision ships the Codex payload at the repository root. Do not nest
it under `plugins/codex/` unless a second validated host package exists.
