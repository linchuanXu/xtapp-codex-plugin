import { cp, readFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { readProjectSnapshot } from './projectSnapshot.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CONTRACT_DIR = process.env.XTAPP_CONTRACT_DIR ? resolve(process.env.XTAPP_CONTRACT_DIR) : null
const STORE_DIR = process.env.XTAPP_CATALOG_SOURCE_DIR ? resolve(process.env.XTAPP_CATALOG_SOURCE_DIR) : join(ROOT, 'catalog', 'templates')
const CATALOG_INDEX = join(ROOT, 'catalog', 'index.json')
const KNOWLEDGE_INDEX = join(ROOT, 'knowledge', 'index.json')
const WIDGET_URI = 'ui://widget/xtapp/studio.html'
const sourceWatchers = new Map()

const server = new McpServer({ name: 'xtapp-studio', version: '0.1.0' }, {
  instructions: 'Use XTApp public contract knowledge before guessing APIs. Use the preview tool after project changes. Public store tools inspect and copy only the checked-in standard app templates.'
})

function textResult(text, details = {}) {
  return { content: [{ type: 'text', text }], structuredContent: details }
}

function safeAppId(value) {
  const id = String(value || '').trim()
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('非法 XTApp 模板 id')
  return id
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function publicApps() {
  if (!process.env.XTAPP_CATALOG_SOURCE_DIR && existsSync(CATALOG_INDEX)) return readJson(CATALOG_INDEX)
  if (!existsSync(STORE_DIR)) return []
  const entries = await readdir(STORE_DIR, { withFileTypes: true })
  const result = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dir = join(STORE_DIR, entry.name)
    const manifestPath = join(dir, 'manifest.json')
    if (!existsSync(manifestPath)) continue
    try {
      const manifest = await readJson(manifestPath)
      const readmePath = join(dir, 'README.md')
      result.push({
        id: entry.name,
        appId: manifest.app_id || entry.name,
        name: manifest.display_name || manifest.name || entry.name,
        version: manifest.version || null,
        description: existsSync(readmePath) ? (await readFile(readmePath, 'utf8')).split('\n').find(Boolean) || '' : '',
      })
    } catch { /* Ignore incomplete catalog entries. */ }
  }
  return result.sort((a, b) => a.id.localeCompare(b.id))
}

async function templateFiles(id) {
  const dir = join(STORE_DIR, safeAppId(id))
  const info = await stat(dir).catch(() => null)
  if (!info?.isDirectory()) throw new Error(`公开模板不存在：${id}`)
  const files = {}
  const walk = async (current, prefix = '') => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const relative = join(prefix, entry.name)
      if (entry.name === 'assets' || entry.name === 'raw' || entry.name.endsWith('.xic')) continue
      if (entry.isDirectory()) await walk(join(current, entry.name), relative)
      else if (/\.(lua|json|md|txt|tsv)$/i.test(entry.name)) files[relative] = await readFile(join(current, entry.name), 'utf8')
    }
  }
  await walk(dir)
  return { dir, files }
}

function contractCandidates() {
  if (!CONTRACT_DIR) return []
  return [
    join(CONTRACT_DIR, 'SPEC.md'),
    join(CONTRACT_DIR, 'README.md'),
    join(CONTRACT_DIR, 'api', 'runtime.md'),
    join(CONTRACT_DIR, 'api', 'input.md'),
    join(CONTRACT_DIR, 'api', 'graphics.md'),
    join(CONTRACT_DIR, 'api', 'ui-components.md'),
    join(CONTRACT_DIR, 'api', 'manifest.md'),
  ]
}

async function contractSearch(query, limit = 6, topicFilter = '') {
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return []
  const terms = [...new Set(needle.split(/[^\p{L}\p{N}_.:]+/u).filter((term) => term.length >= 2))]
  const rows = []
  for (const path of contractCandidates()) {
    if (!existsSync(path)) continue
    const content = await readFile(path, 'utf8')
    const lines = content.split('\n')
    lines.forEach((line, index) => {
      const lower = line.toLowerCase()
      const score = needle.includes(' ') ? terms.reduce((total, term) => total + (lower.includes(term) ? 1 : 0), 0) : (lower.includes(needle) ? 1 : 0)
      if (score > 0) rows.push({ score, topic: topicForPath(path), api: apiForLine(line, topicForPath(path)), version: versionForPath(path, content), source: sourceForPath(path), sourcePath: path, line: index + 1, excerpt: line.trim().slice(0, 500) })
    })
  }
  if (!rows.length && existsSync(KNOWLEDGE_INDEX)) {
    const knowledge = await readJson(KNOWLEDGE_INDEX)
    for (const entry of knowledge.entries || []) {
      const content = String(entry.content || '')
      const lower = content.toLowerCase()
      const index = lower.indexOf(needle)
      const score = index >= 0 ? terms.length + 1 : terms.reduce((total, term) => total + (lower.includes(term) ? 1 : 0), 0)
      if (score > 0) {
        const firstTermIndex = index >= 0 ? index : Math.max(0, terms.map((term) => lower.indexOf(term)).filter((value) => value >= 0).sort((a, b) => a - b)[0] || 0)
        rows.push({ score, topic: entry.topic || 'overview', api: entry.api || null, version: entry.version || 'unknown', source: entry.source || 'unknown', sourcePath: entry.sourcePath || entry.source, line: entry.lineStart || 1, excerpt: content.slice(Math.max(0, firstTermIndex - 160), firstTermIndex + 340).replaceAll('\n', ' ') })
      }
    }
  }
  const filtered = topicFilter ? rows.filter((row) => row.topic === topicFilter) : rows
  return filtered.sort((a, b) => (b.score || 0) - (a.score || 0) || a.sourcePath.localeCompare(b.sourcePath) || a.line - b.line)
    .slice(0, Math.max(1, Math.min(10, limit))).map(({ score, ...row }) => row)
}

function topicForPath(path) {
  const value = String(path).toLowerCase()
  if (value.includes('/input')) return 'input'
  if (value.includes('/graphics')) return 'graphics'
  if (value.includes('/runtime')) return 'runtime'
  if (value.includes('/manifest')) return 'manifest'
  if (value.includes('ui-components')) return 'ui'
  if (value.includes('/network')) return 'network'
  return 'overview'
}

function apiForLine(line, topic) {
  const patterns = {
    input: /\b(on_input|ctx\.input(?:\.caps)?)\b/i,
    graphics: /\b(g:(?:clear|line|rect|circle|text|image|layer|size))\b/i,
    runtime: /\b(ctx\.(?:state|screen|sys|longtask|perf)|on_(?:load|enter|tick|draw|leave|unload))\b/i,
    manifest: /\b(manifest(?:\.json)?|app_id|display\.orientation)\b/i,
    network: /\b(ctx\.net:(?:get|post|poll|cancel))\b/i,
  }
  return patterns[topic]?.exec(line)?.[1] || null
}

function versionForPath(path, content) {
  const match = String(content).match(/(?:契约版本|contract version|API version|apiVersion|version)\D{0,20}(\d+\.\d+)/i)
  return match?.[1] || (String(path).includes('/contract/') ? '1.0' : 'unknown')
}

function sourceForPath(path) {
  return String(path).includes('/contract/') ? 'public-contract' : 'xtapp-studio'
}

registerAppResource(server, 'xtapp-studio-widget', WIDGET_URI, {
  title: 'XTApp Studio Preview',
  description: 'Live XTApp project preview and contract/store status.',
  _meta: {
    ui: { prefersBorder: true, csp: { connectDomains: [], resourceDomains: ['data:'] } },
    'openai/widgetDescription': 'Shows the current XTApp preview and its contract/store context.',
    'openai/widgetPrefersBorder': true,
    'openai/widgetCSP': { connect_domains: [], resource_domains: ['data:'] },
  },
}, async () => ({ contents: [{ uri: WIDGET_URI, mimeType: RESOURCE_MIME_TYPE, text: await readFile(join(ROOT, 'widget', 'index.html'), 'utf8') }] }))

registerAppTool(server, 'render_xtapp_studio_widget', {
  title: 'Render XTApp Studio Preview',
  description: 'Open or refresh the native right-side XTApp Studio preview widget for the active project.',
  inputSchema: { projectDir: z.string().trim().optional() },
  _meta: { ui: { resourceUri: WIDGET_URI, visibility: ['model', 'app'] }, 'openai/outputTemplate': WIDGET_URI, 'openai/widgetAccessible': true },
}, async (input = {}) => textResult('XTApp Studio preview widget ready.', { projectDir: input.projectDir ? resolve(input.projectDir) : null, widget: WIDGET_URI }))

server.registerTool('search_xtapp_knowledge', { description: 'Search the public XTApp Lua contract and API guides. Classify the question first and optionally filter by topic.', inputSchema: { query: z.string().min(1), topic: z.enum(['input', 'graphics', 'runtime', 'manifest', 'network', 'assets', 'ui', 'studio-preview', 'overview']).optional(), limit: z.number().int().min(1).max(10).optional() } }, async ({ query, topic, limit }) => {
  const results = await contractSearch(query, limit, topic)
  return textResult(JSON.stringify(results, null, 2), { query, topic: topic || null, count: results.length })
})

server.registerTool('list_xtapp_store_apps', { description: 'List public XTApp apps available as checked-in templates.', inputSchema: { query: z.string().optional() } }, async ({ query = '' }) => {
  const apps = await publicApps()
  const filtered = query ? apps.filter((app) => JSON.stringify(app).toLowerCase().includes(query.toLowerCase())) : apps
  return textResult(JSON.stringify(filtered, null, 2), { count: filtered.length, catalogIndexPresent: existsSync(CATALOG_INDEX), templateDirPresent: existsSync(STORE_DIR) })
})

server.registerTool('get_xtapp_store_template', { description: 'Read a public XTApp app template source bundled in this plugin. Binary assets are intentionally excluded from the source bundle.', inputSchema: { id: z.string().min(1) } }, async ({ id }) => {
  const template = await templateFiles(id)
  return textResult(JSON.stringify({ id, files: template.files }, null, 2), { id, fileCount: Object.keys(template.files).length, sourceDir: template.dir })
})

server.registerTool('copy_xtapp_store_template', { description: 'Copy a bundled public XTApp app source into a new directory inside the explicitly selected project. The destination must not already exist.', inputSchema: { id: z.string().min(1), projectDir: z.string().trim(), destination: z.string().trim().optional() } }, async ({ id, projectDir, destination }) => {
  const template = await templateFiles(id)
  const base = resolve(projectDir)
  const relativeDestination = String(destination || `templates/${safeAppId(id)}`).trim()
  if (!relativeDestination || relativeDestination.startsWith('/') || relativeDestination.includes('..')) throw new Error('模板目标必须是当前项目内的相对路径，且不能包含 ..')
  const target = resolve(base, relativeDestination)
  if (!target.startsWith(`${base}/`)) throw new Error('模板目标越过了项目目录边界')
  if (existsSync(target)) throw new Error(`模板目标已存在，为避免覆盖请换一个目录：${relativeDestination}`)
  await cp(template.dir, target, { recursive: true, force: false, errorOnExist: true })
  return textResult(`已复制公开模板 ${id} 到 ${relativeDestination}`, { id, destination: target, sourceDir: template.dir })
})

async function bridgeRequest(path, body = {}, method = 'POST') {
  const base = process.env.XTAPP_STUDIO_CONTROL_URL || 'http://127.0.0.1:5173'
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}${path}`, { method, headers: { 'content-type': 'application/json' }, signal: controller.signal, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) })
    if (!response.ok) throw new Error(`Studio preview bridge failed: HTTP ${response.status}`)
    return response.json()
  } catch (error) {
    if (error?.name === 'AbortError') return { status: 'not_connected', message: `Studio 响应超时：${base}` }
    if (error?.cause?.code === 'ECONNREFUSED' || error?.code === 'ECONNREFUSED' || error?.cause?.code === 'ECONNRESET') {
      return { status: 'not_connected', message: `无法连接本地 Studio：${base}` }
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function syncProjectSource(projectDir) {
  const snapshot = await readProjectSnapshot(projectDir)
  const result = await bridgeRequest('/preview/source', snapshot)
  return { ...result, projectDir: snapshot.projectDir, revision: snapshot.revision, warnings: snapshot.warnings, fileCount: snapshot.fileCount, assetCount: snapshot.assetCount, assetBytes: snapshot.assetBytes }
}

async function awaitCommand(path, body = {}) {
  const queued = await bridgeRequest(path, body)
  if (!queued?.commandId || queued.status === 'not_connected') return queued
  const query = `/preview/result?sessionId=${encodeURIComponent(queued.sessionId || '')}&commandId=${encodeURIComponent(queued.commandId)}`
  const deadline = Date.now() + 4000
  while (Date.now() < deadline) {
    const result = await bridgeRequest(query, {}, 'GET')
    if (result?.status === 'complete') return result
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return { ...queued, status: 'queued_timeout', message: 'Studio 已接收命令，但尚未回传执行结果' }
}

function stopSourceWatcher(projectDir) {
  const watcher = sourceWatchers.get(projectDir)
  if (!watcher) return false
  watcher.stopped = true
  clearInterval(watcher.timer)
  sourceWatchers.delete(projectDir)
  return true
}

function startSourceWatcher(projectDir) {
  stopSourceWatcher(projectDir)
  const watcher = { stopped: false, timer: null, lastRevision: '' }
  watcher.timer = setInterval(async () => {
    if (watcher.stopped || watcher.busy) return
    watcher.busy = true
    try {
      const snapshot = await readProjectSnapshot(projectDir)
      if (snapshot.revision === watcher.lastRevision) return
      watcher.lastRevision = snapshot.revision
      await bridgeRequest('/preview/source', snapshot)
    } catch { /* The next polling cycle retries transient edits or bridge restarts. */ } finally {
      watcher.busy = false
    }
  }, 1000)
  watcher.timer.unref?.()
  sourceWatchers.set(projectDir, watcher)
  return watcher
}

server.registerTool('run_xtapp_preview', { description: 'Request a preview run and automatically keep the selected worktree synchronized with the local Studio.', inputSchema: { projectDir: z.string().trim().optional(), device: z.enum(['x4_classic', 'x4_pro']).optional() } }, async ({ projectDir, device = 'x4_pro' }) => {
  const source = projectDir ? await syncProjectSource(projectDir) : null
  if (projectDir) startSourceWatcher(resolve(projectDir))
  const result = await awaitCommand('/preview/run', { projectDir: source?.projectDir || null, revision: source?.revision || null, device })
  return textResult(JSON.stringify(result), { ...result, device, watching: Boolean(projectDir) })
})

server.registerTool('sync_xtapp_preview_source', { description: 'Read the current Codex worktree source and make it available to the local Studio preview.', inputSchema: { projectDir: z.string().trim() } }, async ({ projectDir }) => {
  const result = await syncProjectSource(projectDir)
  return textResult(JSON.stringify(result, null, 2), result)
})

server.registerTool('watch_xtapp_preview', { description: 'Watch a Codex worktree and automatically synchronize source changes to the local Studio preview.', inputSchema: { projectDir: z.string().trim(), enabled: z.boolean().optional() } }, async ({ projectDir, enabled = true }) => {
  const root = resolve(projectDir)
  if (!enabled) return textResult(JSON.stringify({ status: stopSourceWatcher(root) ? 'stopped' : 'not_watching', projectDir: root }), { status: 'stopped', projectDir: root })
  await syncProjectSource(root)
  startSourceWatcher(root)
  return textResult(`已开始监听 ${root}；Codex 保存 Lua/Manifest 后，Studio 会自动同步源码并刷新预览。`, { status: 'watching', projectDir: root, intervalMs: 1000 })
})

server.registerTool('get_xtapp_preview_status', { description: 'Read the connection and runtime status of the local Studio preview.', inputSchema: {} }, async () => {
  const result = await bridgeRequest('/preview/status', {}, 'GET')
  return textResult(JSON.stringify(result), result)
})

server.registerTool('inspect_xtapp_preview_context', { description: 'Inspect the active Studio project manifest, Lua entry snippets and recent runtime logs for joint diagnosis.', inputSchema: { query: z.string().trim().optional() } }, async ({ query = '' }) => {
  const context = await bridgeRequest('/preview/context', {}, 'GET')
  if (context.status === 'not_connected') return textResult(JSON.stringify(context), context)
  const needle = String(query).toLowerCase()
  const files = Object.fromEntries(Object.entries(context.files || {}).filter(([path, content]) => !needle || path.toLowerCase().includes(needle) || String(content).toLowerCase().includes(needle)))
  const result = { projectId: context.projectId || null, manifest: context.manifest || null, files, logs: context.logs || [], updatedAt: context.updatedAt || null }
  return textResult(JSON.stringify(result, null, 2), { ...result, fileCount: Object.keys(files).length })
})

server.registerTool('send_xtapp_preview_input', { description: 'Send an X4 device key to the active Studio preview.', inputSchema: { key: z.enum(['up', 'down', 'left', 'right', 'ok', 'back']) } }, async ({ key }) => {
  const result = await awaitCommand('/preview/input', { key })
  return textResult(JSON.stringify(result), result)
})

server.registerTool('get_xtapp_preview_targets', { description: 'Read semantic interactive targets and the current frame revision from the active Studio preview.', inputSchema: {} }, async () => {
  const result = await bridgeRequest('/preview/targets', {}, 'GET')
  return textResult(JSON.stringify(result, null, 2), result)
})

server.registerTool('tap_xtapp_preview_target', { description: 'Tap a semantic interactive target exposed by XTApp Lua; no screen coordinates are required.', inputSchema: { targetId: z.string().min(1).max(120), gesture: z.enum(['tap', 'double_tap', 'long', 'swipe_left', 'swipe_right', 'swipe_up', 'swipe_down']).optional() } }, async ({ targetId, gesture = 'tap' }) => {
  const result = await awaitCommand('/preview/target', { targetId, gesture })
  return textResult(JSON.stringify(result, null, 2), result)
})

server.registerTool('send_xtapp_preview_touch', { description: 'Send a touch gesture to the active Studio preview using logical device coordinates.', inputSchema: { x: z.number().finite(), y: z.number().finite(), gesture: z.enum(['tap', 'double_tap', 'long', 'swipe_left', 'swipe_right', 'swipe_up', 'swipe_down']).optional() } }, async ({ x, y, gesture = 'tap' }) => {
  const result = await awaitCommand('/preview/touch', { x, y, gesture })
  return textResult(JSON.stringify(result, null, 2), result)
})

server.registerTool('capture_xtapp_preview', { description: 'Capture the current Studio preview PNG and frame revision.', inputSchema: {} }, async () => {
  const command = await awaitCommand('/preview/capture', {})
  const screenshot = await bridgeRequest(`/preview/screenshot${command?.sessionId ? `?sessionId=${encodeURIComponent(command.sessionId)}` : ''}`, {}, 'GET')
  const result = { ...command, screenshot }
  return textResult(JSON.stringify(result), result)
})

server.registerTool('stop_xtapp_preview', { description: 'Stop the active Studio preview runtime.', inputSchema: {} }, async () => {
  const result = await awaitCommand('/preview/stop')
  return textResult(JSON.stringify(result), result)
})

server.registerTool('restart_xtapp_preview', { description: 'Restart the active Studio preview runtime with the latest project files.', inputSchema: {} }, async () => {
  const result = await awaitCommand('/preview/restart')
  return textResult(JSON.stringify(result), result)
})

await server.connect(new StdioServerTransport())
