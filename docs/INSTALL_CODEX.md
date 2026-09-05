# Install in Codex

English · [中文](INSTALL_CODEX.zh-CN.md)

## Supported environment

- Codex Desktop or Codex CLI with `codex plugin marketplace`
- Installed XTApp Studio, already running on this machine
- Plugin selector `xtapp-codex-plugin@xtapp-codex-plugin-github`
- Bundled MCP identity `xtapp_studio`
- Preview page `http://127.0.0.1:5173/studio/preview?preview=1`
- The Studio process must stay running; this revision has no headless
  companion service

## Normal Git marketplace install

```bash
codex plugin marketplace add linchuanXu/xtapp-codex-plugin --ref main --json
codex plugin add xtapp-codex-plugin@xtapp-codex-plugin-github --json
```

If XTApp Studio is not running, ask the user to start their installed
Studio. Do not invent a download URL, clone path, or install script. Do
not hard-code a port or source path.

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
snapshot. Then open the preview page and keep it open. If the browser
offers 「连接文件夹」, choose the current worktree; otherwise ask Codex to
watch the worktree. Folder sync is a convenience path, not the install
gate.

Non-default Studio ports:

```bash
XTAPP_STUDIO_CONTROL_URL=http://127.0.0.1:5173
```

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

Plugin installation alone does not start Studio. For a full smoke, start
Studio separately, open `/studio/preview?preview=1`, then use the plugin
tools against that loopback bridge. `get_xtapp_preview_status` must be
read as written. An unauthenticated or unreachable bridge must stay
`not_connected`, not switch to a guessed host.

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
returned an execution result. `not_connected` means the loopback bridge
is down.

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
