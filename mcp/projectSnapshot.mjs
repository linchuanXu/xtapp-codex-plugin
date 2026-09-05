import { createHash } from 'node:crypto'
import { readFile, readdir, realpath, stat } from 'node:fs/promises'
import { basename, join, relative, resolve, sep } from 'node:path'

const MAX_FILES = 400
const MAX_FILE_BYTES = 256 * 1024
const MAX_TOTAL_BYTES = 4 * 1024 * 1024
const MAX_ASSETS = 80
const MAX_ASSET_BYTES = 2 * 1024 * 1024
const MAX_TOTAL_ASSET_BYTES = 8 * 1024 * 1024
const TEXT_FILE = /^(?:manifest\.json|[^/]+\.lua|(?:domain|persistence|scripts)\/[^/]+\.lua|(?:data|lang)\/[^/]+\.(?:tsv|txt|json))$/i
const ASSET_FILE = /^(?:assets|raw)\/[^/]+\.xic$/i
const IGNORED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.vite'])

function assertProjectDir(value) {
  const raw = String(value || '').trim()
  if (!raw) throw new Error('请提供 XTApp 项目的绝对路径')
  const dir = resolve(raw)
  if (!raw.startsWith('/') || !dir.startsWith('/')) throw new Error('项目路径必须是绝对路径')
  return dir
}

function safeRelativePath(value) {
  const path = value.split(sep).join('/')
  if (!path || path.startsWith('/') || path.split('/').some((part) => !part || part === '.' || part === '..')) return null
  return path
}

async function collectFiles(root) {
  const files = {}
  const warnings = []
  let totalBytes = 0
  const assets = []
  let totalAssetBytes = 0
  const walk = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await walk(join(dir, entry.name))
        continue
      }
      const absolute = join(dir, entry.name)
      const path = safeRelativePath(relative(root, absolute))
      if (!path) continue
      if (TEXT_FILE.test(path) && Object.keys(files).length >= MAX_FILES) { warnings.push(`文本文件超过 ${MAX_FILES} 个，已截断`); continue }
      const target = await realpath(absolute).catch(() => null)
      if (!target || (target !== root && !target.startsWith(`${root}/`))) { warnings.push(`${path} 是越界链接，已跳过`); continue }
      const bytes = await readFile(target)
      if (ASSET_FILE.test(path)) {
        if (assets.length >= MAX_ASSETS) { warnings.push(`素材超过 ${MAX_ASSETS} 个，已截断`); continue }
        if (bytes.length > MAX_ASSET_BYTES) { warnings.push(`${path} 超过 ${MAX_ASSET_BYTES} 字节，已跳过`); continue }
        if (totalAssetBytes + bytes.length > MAX_TOTAL_ASSET_BYTES) { warnings.push(`素材快照超过 ${MAX_TOTAL_ASSET_BYTES} 字节，已截断`); continue }
        totalAssetBytes += bytes.length
        assets.push({ path, key: basename(path, '.xic'), mime: 'application/x-xic', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), base64: bytes.toString('base64') })
        continue
      }
      if (!TEXT_FILE.test(path)) continue
      if (bytes.length > MAX_FILE_BYTES) { warnings.push(`${path} 超过 ${MAX_FILE_BYTES} 字节，已跳过`); continue }
      if (totalBytes + bytes.length > MAX_TOTAL_BYTES) { warnings.push(`源码快照超过 ${MAX_TOTAL_BYTES} 字节，已截断`); return }
      totalBytes += bytes.length
      files[path] = bytes.toString('utf8')
    }
  }
  await walk(root)
  return { files, assets, warnings, totalBytes, assetBytes: totalAssetBytes }
}

export async function readProjectSnapshot(projectDir) {
  const root = await realpath(assertProjectDir(projectDir))
  const info = await stat(root).catch(() => null)
  if (!info?.isDirectory()) throw new Error(`项目目录不存在：${root}`)
  const { files, assets, warnings, totalBytes, assetBytes } = await collectFiles(root)
  let manifest = null
  if (typeof files['manifest.json'] === 'string') {
    try { manifest = JSON.parse(files['manifest.json']) } catch { warnings.push('manifest.json 不是有效 JSON，预览会显示校验错误') }
  } else warnings.push('未找到 manifest.json')
  const digest = createHash('sha256')
    .update(JSON.stringify(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))))
    .update(JSON.stringify(assets.map(({ path, sha256, bytes }) => ({ path, sha256, bytes })).sort((a, b) => a.path.localeCompare(b.path))))
    .digest('hex')
  return {
    projectDir: root,
    projectName: basename(root),
    revision: digest,
    manifest,
    files,
    assets,
    warnings,
    fileCount: Object.keys(files).length,
    totalBytes,
    assetBytes,
    assetCount: assets.length,
    capturedAt: Date.now(),
  }
}
