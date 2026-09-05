---
name: xtapp-contracts
description: Use the public XTApp Lua contract and public app templates while working in Codex.
---

Before answering or changing XTApp code, classify the request as `input`, `graphics`, `runtime`, `manifest`, `network`, `assets`, `studio-preview`, or `overview`. Then call `search_xtapp_knowledge` with the matching topic/API terms and use the returned `topic`, `api`, `version`, `source`, `content`, and `example` fields in the answer or implementation. If the search returns no authoritative match, say that the behavior is unknown and request verification; never invent an API from memory.

For a runtime problem such as “on_input 不生效”, query the contract first, then call `inspect_xtapp_preview_context` to inspect the active project's relevant Lua/Manifest snippets and recent Studio logs. Separate contract facts, project observations, and hypotheses in the response.

Use `list_xtapp_store_apps` to discover public apps, then `get_xtapp_store_template` to inspect a template before adapting it. The public contract is authoritative; do not infer private firmware or editor behavior. After edits, run validation and preview using the available Studio tools.

When the user explicitly asks to bring a public app into the current project, call `copy_xtapp_store_template` with a new destination directory. Never overwrite an existing destination.
