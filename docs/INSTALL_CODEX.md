# Install in Codex

English · [中文](INSTALL_CODEX.zh-CN.md)

## Supported environment

- Codex Desktop or Codex CLI with `codex plugin marketplace`
- Signed-in XTApp Studio
- Plugin selector `xtapp-codex-plugin@xtapp-codex-plugin-github`
- Bundled MCP identity `xtapp_studio`
- Preview page from `get_xtapp_preview_status.previewUrl` (login required,
  includes session)
- Keep that official preview page open

## Normal Git marketplace install

```bash
codex plugin marketplace add linchuanXu/xtapp-codex-plugin --ref main --json
codex plugin add xtapp-codex-plugin@xtapp-codex-plugin-github --json
```

If the preview is not open, ask the user to sign in and open the
`previewUrl` from `get_xtapp_preview_status`. Do not invent a download
URL, clone path, or install script.

The plugin has a local `.mcp.json` and no remote MCP endpoint.

```bash
codex plugin list --json
```

Expected plugin identity:

- Selector: `xtapp-codex-plugin@xtapp-codex-plugin-github`
- Marketplace: `xtapp-codex-plugin-github`
- Version: the value in `release-manifest.json`
- MCP: bundled `xtapp_studio` stdio, command `node ./mcp/server.bundle.mjs`

Start a new Codex task after installation so it loads the new plugin
snapshot. Then call `get_xtapp_preview_status` and open the returned
`previewUrl` (login required). Keep that page open.

## Published Git marketplace smoke

An isolated `CODEX_HOME` can verify package installation without touching
normal Codex state:

```bash
XTAPP_CODEX_PLUGIN_TEST_HOME="$(mktemp -d /tmp/xtapp-plugin-codex-home.XXXXXX)"
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin marketplace add \
  linchuanXu/xtapp-codex-plugin --ref main --json
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin add \
  xtapp-codex-plugin@xtapp-codex-plugin-github --json
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin list --json
```

Plugin installation alone does not open the preview. For a full smoke,
sign in and open the `previewUrl` from `get_xtapp_preview_status` (it
includes the session), then use the plugin tools against that page.
`get_xtapp_preview_status` must be read as written. An unauthenticated,
closed, or mismatched-session preview must stay `not_connected`, not
switch to a guessed host.

Delete only the exact temporary roots created by the smoke.

## Unpublished candidate smoke

Maintainers may substitute the current repository root for the Git source:

```bash
XTAPP_AGENT_PLUGIN_REPO="$(git rev-parse --show-toplevel)"
XTAPP_CODEX_PLUGIN_TEST_HOME="$(mktemp -d /tmp/xtapp-plugin-candidate-home.XXXXXX)"
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin marketplace add \
  "$XTAPP_AGENT_PLUGIN_REPO" --json
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin add \
  xtapp-codex-plugin@xtapp-codex-plugin-github --json
CODEX_HOME="$XTAPP_CODEX_PLUGIN_TEST_HOME" codex plugin list --json
```

This local source is test evidence only, never the normal user
installation route.

## Agent completion report

Report all of:

- whether the marketplace/plugin was newly installed or already present;
- installed plugin id and version;
- whether bundled `xtapp_studio` MCP is present;
- whether the Studio preview page was reached;
- whether a preview run was completed or remains pending;
- the new-task requirement.

## Preview contract

Do not claim a run succeeded unless the bridge result is `complete`.
`queued` and `queued_timeout` mean Studio accepted a command but has not
returned an execution result. `not_connected` means the preview page is
not reachable or the URL session does not match.

Source sync reads only the current worktree paths the user passed in.
It stays on the local machine. Binary assets outside the bounded `.xic`
snapshot remain in Studio's asset pipeline.

## Uninstall

```bash
codex plugin remove xtapp-codex-plugin@xtapp-codex-plugin-github --json
codex plugin marketplace remove xtapp-codex-plugin-github --json
```

Removing the plugin does not remove XTApp Studio, IndexedDB preview
state, or the user's App project. Remove those only on a separate
explicit request.
