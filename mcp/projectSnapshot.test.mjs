import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { readProjectSnapshot } from './projectSnapshot.mjs'

test('只读取允许的 XTApp 文本文件并为内容生成稳定版本', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xtapp-snapshot-'))
  try {
    await mkdir(join(root, 'domain'))
    await mkdir(join(root, 'assets'))
    await writeFile(join(root, 'manifest.json'), '{"entry":"index.lua"}\n')
    await writeFile(join(root, 'index.lua'), 'function on_draw() end\n')
    await writeFile(join(root, 'domain', 'state.lua'), 'return {}\n')
    await writeFile(join(root, 'assets', 'hero.xic'), 'binary')
    const first = await readProjectSnapshot(root)
    assert.deepEqual(Object.keys(first.files).sort(), ['domain/state.lua', 'index.lua', 'manifest.json'])
    assert.equal(first.manifest.entry, 'index.lua')
    assert.equal(first.assetCount, 1)
    assert.equal(first.assets[0].key, 'hero')
    assert.equal(first.assets[0].mime, 'application/x-xic')
    assert.equal(first.assets[0].base64, Buffer.from('binary').toString('base64'))
    assert.equal(first.warnings.length, 0)
    await writeFile(join(root, 'index.lua'), 'function on_draw(ctx, g) g:clear(0) end\n')
    const second = await readProjectSnapshot(root)
    assert.notEqual(second.revision, first.revision)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('拒绝相对项目路径', async () => {
  await assert.rejects(() => readProjectSnapshot('./project'), /绝对路径/)
})
