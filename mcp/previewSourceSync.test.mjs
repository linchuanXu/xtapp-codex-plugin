import assert from 'node:assert/strict'
import test from 'node:test'
import { snapshotRevision } from './projectSnapshot.mjs'
import { pushProjectSnapshot, sourcePushBodies, splitAssetBatches } from './previewSourceSync.mjs'

function asset(index, bytes = 10) {
  return {
    path: `assets/n${index}.xic`,
    key: `n${index}`,
    mime: 'application/x-xic',
    bytes,
    sha256: `hash-${index}`,
    base64: 'WElDAA==',
  }
}

test('素材按 80 个和体积切批，单张超大也独占一批', () => {
  const many = Array.from({ length: 81 }, (_, index) => asset(index))
  const [first, second] = splitAssetBatches(many)
  assert.equal(first.length, 80)
  assert.equal(second.length, 1)
  assert.equal(second[0].key, 'n80')

  const heavy = [asset(1, 5 * 1024 * 1024), asset(2, 10)]
  const batches = splitAssetBatches(heavy)
  assert.equal(batches.length, 2)
  assert.deepEqual(batches[0].map((item) => item.key), ['n1'])
  assert.deepEqual(batches[1].map((item) => item.key), ['n2'])
})

test('首包 POST 全量文件，后续 PATCH 只补素材并带完整 assetKeys', () => {
  const files = { 'manifest.json': '{}', 'index.lua': 'function on_draw() end' }
  const assets = Array.from({ length: 81 }, (_, index) => asset(index))
  const bodies = sourcePushBodies({
    files,
    assets,
    fileCount: 2,
    assetCount: 81,
    warnings: [],
    projectDir: '/tmp/demo',
  })
  assert.equal(bodies.length, 2)
  assert.deepEqual(Object.keys(bodies[0].files).sort(), ['index.lua', 'manifest.json'])
  assert.equal(bodies[0].assets.length, 80)
  assert.equal(bodies[0].assetKeys.length, 81)
  assert.equal(bodies[0].revision, snapshotRevision(files, bodies[0].assets))
  assert.deepEqual(bodies[1].files, {})
  assert.equal(bodies[1].assets.length, 1)
  assert.deepEqual(bodies[1].assetKeys, bodies[0].assetKeys)
})

test('pushProjectSnapshot 先覆盖再按 revision 合并，不把 80 当成工程上限', async () => {
  const files = { 'index.lua': 'ok' }
  const assets = Array.from({ length: 81 }, (_, index) => asset(index))
  const calls = []
  const result = await pushProjectSnapshot({
    files,
    assets,
    fileCount: 1,
    assetCount: 81,
    assetBytes: 810,
    warnings: ['note'],
    projectDir: '/tmp/demo',
  }, async (path, body) => {
    calls.push({ path, body })
    if (path === '/preview/source') return { status: 'queued', revision: 'rev-1', assetCount: body.assets.length }
    return { status: 'queued', revision: 'rev-2', assetCount: 81, warnings: [] }
  })
  assert.equal(calls[0].path, '/preview/source')
  assert.equal(calls[1].path, '/preview/source/patch')
  assert.equal(calls[1].body.baseRevision, 'rev-1')
  assert.equal(calls[1].body.assets[0].key, 'n80')
  assert.equal(result.revision, 'rev-2')
  assert.equal(result.assetCount, 81)
  assert.equal(result.projectDir, '/tmp/demo')
  assert.deepEqual(result.warnings, ['note'])
})
