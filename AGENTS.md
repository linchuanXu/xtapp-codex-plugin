# XTApp plugin distribution — agent entrypoint

This repository is designed to be operated by an agent. Codex is the only
supported host in this revision.

Canonical distribution repository:
`https://github.com/linchuanXu/xtapp-codex-plugin`.

## First decide the operation

Choose exactly one lane:

1. **Install or set up** — follow "Install into Codex" below.
2. **Inspect or explain** — read `README.md`, `release-manifest.json`, the
   marketplace manifest, and the plugin manifest. Do not change configuration.
3. **Uninstall** — follow `docs/INSTALL_CODEX.md#uninstall`.
4. **Refresh or release** — follow "Maintainer lane" below.

Do not scan private product sources unless the selected lane explicitly
requires a maintainer refresh.

## Architecture to preserve

The plugin bundles its MCP. It does not replace XTApp Studio:

```text
Codex plugin
  -> bundled xtapp_studio MCP
  -> XTApp Studio preview page
  -> Lua Worker / device simulator
```

The user must be signed in to XTApp Studio. Call
`get_xtapp_preview_status` and open its `previewUrl` in the Codex in-app
browser (login required). That URL includes the session the plugin will
command. Keep the page open. `not_connected` means the preview page is
not reachable or the session does not match, not a successful run.

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

If `xtapp-codex-plugin@xtapp-codex-plugin-github` is already at the version
declared in `release-manifest.json`, do not reinstall it. If marketplace
`xtapp-codex-plugin-github` points at a different source, stop and report
the name collision. Never remove or overwrite unrelated marketplaces,
plugins, MCP servers, or auth state.

### 3. Install the plugin

```bash
codex plugin marketplace add "$XTAPP_AGENT_PLUGIN_SOURCE" --ref main --json
codex plugin add xtapp-codex-plugin@xtapp-codex-plugin-github --json
```

`alreadyAdded: true` is success. Do not hand-edit Codex configuration or
copy plugin files into a Codex home.

### 4. Open the official preview page

The plugin registers MCP `xtapp_studio` from `.mcp.json`. Do not run
`codex mcp login`. Do not invent a Studio source path or start a second
preview server.

Ask the user to sign in and open or reuse the Codex in-app browser at
the `previewUrl` from `get_xtapp_preview_status`. Keep that page open.
Do not invent a localhost control URL.

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

## Safety boundaries

- Lua execution, asset pipelines, and device simulation belong in
  XTApp Studio.
- Treat `.codex-plugin/plugin.json` and
  `.agents/plugins/marketplace.json` as distribution payloads.
- Never expose or commit credentials, Codex auth state, plugin caches,
  logs, `.env`, or smoke-test artifacts.
- There is no remote MCP dependency or fallback.
- Do not change Git remotes, push, publish, create a PR, or create an
  issue without explicit authorization.

## Maintainer lane

Enter only when the user asks to refresh, validate, or release:

1. Read `README.md`, `release-manifest.json`, and
   `docs/INSTALL_CODEX.md#unpublished-candidate-smoke`.
2. Refresh only the reviewed public payload files when the user provides
   maintainer-local source directories through environment variables.
3. Run `npm run check` and `npm run build:mcp` when MCP sources change.
4. Keep changes unpushed unless publication was explicitly authorized.
5. Never write private source names, clone URLs, or checkout paths into
   this repository.

## Host directory convention

This revision ships one Codex payload at the repository root:

- `.codex-plugin/plugin.json`
- `.mcp.json`
- `skills/`
- `mcp/`
- `widget/`

Add a second host directory only when a validated host-specific package
exists. A host with no reviewed payload is refused rather than packaged
with guessed conventions.
