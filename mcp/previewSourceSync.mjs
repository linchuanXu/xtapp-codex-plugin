import { snapshotRevision } from './projectSnapshot.mjs'

export const SOURCE_ASSET_BATCH = 80
export const SOURCE_ASSET_BATCH_BYTES = 4 * 1024 * 1024

export function splitAssetBatches(assets = [], {
  maxCount = SOURCE_ASSET_BATCH,
  maxBytes = SOURCE_ASSET_BATCH_BYTES,
} = {}) {
  const batches = []
  let current = []
  let bytes = 0
  for (const asset of assets) {
    const size = Number(asset?.bytes) || 0
    if (current.length && (current.length >= maxCount || bytes + size > maxBytes)) {
      batches.push(current)
      current = []
      bytes = 0
    }
    current.push(asset)
    bytes += size
  }
  if (current.length || !batches.length) batches.push(current)
  return batches
}

export function sourcePushBodies(snapshot = {}) {
  const files = snapshot.files && typeof snapshot.files === 'object' ? snapshot.files : {}
  const assets = Array.isArray(snapshot.assets) ? snapshot.assets : []
  const assetKeys = assets.map((item) => item.key).filter(Boolean)
  const batches = splitAssetBatches(assets)
  return batches.map((batch, index) => {
    const body = {
      projectDir: snapshot.projectDir,
      projectName: snapshot.projectName,
      pluginVersion: snapshot.pluginVersion,
      manifest: snapshot.manifest,
      files: index === 0 ? files : {},
      assets: batch,
      assetKeys,
      warnings: snapshot.warnings || [],
      fileCount: snapshot.fileCount,
      assetCount: snapshot.assetCount,
      capturedAt: snapshot.capturedAt,
    }
    if (index === 0) body.revision = snapshotRevision(files, batch)
    return body
  })
}

export async function pushProjectSnapshot(snapshot, request) {
  const bodies = sourcePushBodies(snapshot)
  const first = bodies[0]
  let result = await request('/preview/source', first)
  if (!result?.revision) {
    return {
      ...result,
      projectDir: snapshot.projectDir,
      warnings: snapshot.warnings,
      fileCount: snapshot.fileCount,
      assetCount: snapshot.assetCount,
      assetBytes: snapshot.assetBytes,
    }
  }
  for (const body of bodies.slice(1)) {
    result = await request('/preview/source/patch', {
      baseRevision: result.revision,
      files: body.files,
      assets: body.assets,
      assetKeys: body.assetKeys,
      warnings: body.warnings,
    })
    if (!result?.revision) break
  }
  return {
    ...result,
    projectDir: snapshot.projectDir,
    warnings: [...new Set([...(snapshot.warnings || []), ...(result.warnings || [])])],
    fileCount: snapshot.fileCount,
    assetCount: snapshot.assetCount,
    assetBytes: snapshot.assetBytes,
  }
}
