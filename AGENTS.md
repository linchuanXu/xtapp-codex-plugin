# XTApp plugin distribution — agent entrypoint

This repository is designed to be operated by an agent. Codex is the
marketplace host. Cursor consumes the **same** bundled `xtapp_studio`
MCP and opens the official preview page in its built-in browser.

Canonical distribution repository:
`https://github.com/linchuanXu/xtapp-codex-plugin`.

## First decide the operation

Choose exactly one lane:

1. **Install into Codex** — Codex Desktop / Codex CLI with
   `codex plugin marketplace`.
2. **Install into Cursor** — register the same stdio MCP; preview uses
   Cursor's built-in browser. No marketplace, no `hosts/cursor` payload.
3. **Inspect or explain** — read `README.md`, `release-manifest.json`,
   the marketplace manifest, and the plugin manifest. Do not change
   configuration.
4. **Uninstall** — Codex: `docs/INSTALL_CODEX.md#uninstall`. Cursor:
   `docs/INSTALL_CURSOR.md#uninstall`.
5. **Refresh or release** — follow "Maintainer lane" below.

If the user names a host, use that lane. Otherwise: Codex when
`codex plugin marketplace list --json` works; Cursor when this session
is Cursor.

Do not scan private product sources unless the selected lane explicitly
requires a maintainer refresh.

## Architecture to preserve

The plugin bundles a local stdio MCP. It does not replace XTApp Studio:

```text
Codex: plugin marketplace + user opens previewUrl
Cursor: same xtapp_studio MCP + built-in browser opens previewUrl
  -> official Studio preview page (EventSource)
  -> Lua Worker / device simulator
```

Shared payload: `mcp/`, `skills/`, `knowledge/`, `catalog/`, `widget/`.
The MCP Apps widget is Codex-only. The simulator is always the official
preview page.

Call `run_xtapp_preview` with the absolute current worktree `projectDir`.
Use the exact `previewUrl`. Cursor must open that URL with the host
browser MCP (`browser_tabs` / `browser_navigate`) and keep the tab there.
Codex gives the URL to the user. If a login page appears, stop and let
the user sign in; do not fill credentials. Then return to the same URL.
Do not click the simulator DOM; use `send_xtapp_preview_input` and
`send_xtapp_preview_touch`. `need_login_or_open_page` / `not_connected`
is not success. After code changes, call `run_xtapp_preview` again.
Official Studio may already have another project open; sync creates or
reuses a plugin-owned project for this worktree and must not overwrite
the user's other apps. Nested `domain/` Lua is synced. Inspect templates
with `get_xtapp_store_template`, then copy with `copy_xtapp_store_template`.

## Install into Codex

An explicit request to install or set up authorizes changes to the user's
Codex plugin configuration. It does not authorize source edits, Git pushes,
silent Studio installation, deployment, publication, or deleting unrelated
configuration.

### 1. Preflight

```bash
XTAPP_AGENT_PLUGIN_SOURCE="linchuanXu/xtapp-codex-plugin"
codex --version
git ls-remote https://github.com/linchuanXu/xtapp-codex-plugin.git main
```

Require a Codex build that supports `codex plugin marketplace`. If
`codex plugin marketplace list --json` fails, stop and report that the host
is too old. If the preview page is not open, ask the user to sign in and
open the `previewUrl` from `get_xtapp_preview_status`. Do not invent a
download URL, clone path, or install script. Do not substitute a remote
MCP URL.

### 2. Inspect before mutating

```bash
codex plugin marketplace list --json
codex plugin list --json
```

If the user asks to update the XTApp plugin, or says「升级 XTApp 插件」,
follow this upgrade path. Do not invent a download URL.

If marketplace `xtapp-codex-plugin-github` points at a different source,
stop and report the name collision. Never remove or overwrite unrelated
marketplaces, plugins, MCP servers, or auth state.

Codex may auto-upgrade this Git marketplace on plugin startup. Do not
build a custom updater. If the marketplace is already configured, refresh
it first, then install or refresh the plugin:

```bash
codex plugin marketplace upgrade xtapp-codex-plugin-github --json
codex plugin add xtapp-codex-plugin@xtapp-codex-plugin-github --json
```

If the marketplace is not configured yet, add it, then add the plugin.

### 3. Install or refresh the plugin

```bash
codex plugin marketplace add "$XTAPP_AGENT_PLUGIN_SOURCE" --ref main --json
codex plugin marketplace upgrade xtapp-codex-plugin-github --json
codex plugin add xtapp-codex-plugin@xtapp-codex-plugin-github --json
```

`alreadyAdded: true` is success. After a marketplace upgrade, still run
`plugin add` so the installed cache matches `release-manifest.json`.
Do not hand-edit Codex configuration or copy plugin files into a Codex
home. Start a new Codex task after install or upgrade so MCP reloads.

### 4. Open the official preview page

The plugin registers MCP `xtapp_studio` from `.mcp.json`. Do not run
`codex mcp login`. Do not invent a Studio source path or start a second
preview server.

Give the user the exact `previewUrl` from `run_xtapp_preview` or
`get_xtapp_preview_status`. Ask them to open it; if login appears, log
in and return to that URL. Keep the page open. After they confirm, poll
status. If it is still disconnected, stop and give the same URL again.
Do not invent a localhost control URL. Start a new Codex task after
plugin install before preview.

### 5. Verify

```bash
codex plugin list --json
```

Required evidence:

- plugin id `xtapp-codex-plugin@xtapp-codex-plugin-github`;
- installed version equals `release-manifest.json`;
- marketplace name is `xtapp-codex-plugin-github`;
- no bearer token, API key, or `.env` value is embedded.

If the official preview page is open, a runtime smoke may additionally
call `get_xtapp_preview_status`. `not_connected` means the preview is not
reachable. Never report that a project is running when the status is
`not_connected`, `queued`, or `queued_timeout`.

### 6. Hand back

Report:

- whether installation was new or already present;
- installed plugin id and version;
- that MCP `xtapp_studio` is bundled by the plugin;
- whether the official Studio preview page was reached;
- that a new Codex task is needed to load the plugin snapshot;
- whether a preview run was tested or remains pending login/preview;
- that project files stay on the local machine.

Never report "preview works" when only package installation was verified.

## Install into Cursor

Cursor has no `codex plugin marketplace` and no second plugin payload
directory. An explicit request to install authorizes merging
`xtapp_studio` into Cursor MCP config and linking the two skills. It does
not authorize source edits, Git pushes, or deleting unrelated MCP
servers.

### 1. Preflight

Need Node.js on PATH, a checkout that contains `mcp/server.bundle.mjs`,
and Cursor's built-in browser. Do not invent a remote MCP URL. Do not
start a second preview server. Do not run Codex marketplace commands.

### 2. Register the bundled MCP

From this repository root, upsert only `mcpServers.xtapp_studio` into
the user Cursor config:

```bash
node scripts/cursor-mcp-config.mjs --write-user
```

That writes an absolute `node …/mcp/server.bundle.mjs` into
`~/.cursor/mcp.json` and leaves other servers untouched.

If this plugin is a subdirectory of a larger workspace, point args at
`<plugin-dir>/mcp/server.bundle.mjs` instead of using `--write-user`.

Reload MCP in Cursor Settings. Start a **new Agent chat**.

### 3. Skills

Symlink `skills/xtapp-contracts` and `skills/xtapp-open-preview` into
`~/.cursor/skills/` or the project's `.cursor/skills/`. Do not rewrite
the skill bodies.

### 4. Open the official preview page

Call `run_xtapp_preview` with the absolute current worktree. Open the
exact `previewUrl` with Cursor's built-in browser (`browser_navigate`)
and keep that tab on that URL. If a login page appears, stop and ask the
user to sign in in that tab; do not fill credentials. Then return to the
same URL. Confirm with `get_xtapp_preview_status`. Do not click the
simulator DOM. The Codex widget will not appear; that is expected.

### 5. Verify

Cursor Settings → MCP lists enabled `xtapp_studio`. After a new Agent
chat, a smoke is: `run_xtapp_preview` → built-in browser opens
`previewUrl` → `get_xtapp_preview_status` is not `not_connected`.

### 6. Hand back

Report:

- whether `~/.cursor/mcp.json` was upserted;
- that only `xtapp_studio` was changed;
- whether skills were linked;
- whether the built-in browser opened the official preview URL;
- whether login is still pending;
- that a new Agent chat is needed after MCP reload.

Never report "preview works" when only MCP registration was verified.

## Safety boundaries

- Lua execution, asset pipelines, and device simulation belong in
  XTApp Studio.
- Treat `.codex-plugin/plugin.json` and
  `.agents/plugins/marketplace.json` as Codex distribution payloads.
- Cursor is a consumer of the same MCP plus the host browser, not a
  second host directory.
- Never expose or commit credentials, Codex auth state, plugin caches,
  logs, `.env`, or smoke-test artifacts.
- There is no remote MCP dependency or fallback.
- Do not change Git remotes, push, publish, create a PR, or create an
  issue without explicit authorization.

## Maintainer lane

Enter only when the user asks to refresh, validate, or release:

1. Read `README.md`, `release-manifest.json`,
   `docs/INSTALL_CODEX.md#unpublished-candidate-smoke`, and
   `docs/INSTALL_CURSOR.md`.
2. Refresh only the reviewed public payload files when the user provides
   maintainer-local source directories through environment variables.
3. Run `npm run check` and `npm run build:mcp` when MCP sources change.
4. Keep changes unpushed unless publication was explicitly authorized.
5. Never write private source names, clone URLs, or checkout paths into
   this repository.

## Host directory convention

Codex marketplace payload stays at the repository root:

- `.codex-plugin/plugin.json`
- `.mcp.json`
- `skills/`
- `mcp/`
- `widget/`

Do not nest that payload under `plugins/codex/`. Do not add
`hosts/cursor/` or treat `.cursor/mcp.json` as a Cursor plugin. Cursor
install is MCP registration plus the portable skills; preview opens in
the built-in browser.

Add another host directory only when a validated host-specific package
exists. A host with no reviewed payload is refused rather than packaged
with guessed conventions.
