/** Validate the delivered GLB structure and station picking metadata. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bytes = fs.readFileSync(path.join(root, 'public/models/academy/quest-isles.glb'));
assert.equal(bytes.readUInt32LE(0), 0x46546c67, 'Valid GLB signature');
assert.equal(bytes.readUInt32LE(4), 2, 'GLB version 2');
assert.equal(bytes.readUInt32LE(8), bytes.length, 'GLB declared size');
const jsonSize = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonSize).toString('utf8'));
assert.equal(gltf.asset.version, '2.0');
assert(gltf.meshes.length > 5, 'Distinct real station meshes');
const stationIds = new Set(gltf.nodes.map((node) => node.extras?.stationId).filter(Boolean));
for (const id of ['learn', 'play', 'build', 'recall', 'boss']) {
  assert(stationIds.has(id), `Station ${id} has raycast metadata`);
}
let triangles = 0;
let vertices = 0;
for (const mesh of gltf.meshes) {
  for (const primitive of mesh.primitives) {
    assert.equal(primitive.mode ?? 4, 4, 'Triangle geometry');
    const positions = gltf.accessors[primitive.attributes.POSITION];
    assert(positions.count > 0, 'Nonempty station geometry');
    assert(positions.min.every(Number.isFinite) && positions.max.every(Number.isFinite), 'Finite mesh bounds');
    vertices += positions.count;
    triangles += gltf.accessors[primitive.indices].count / 3;
  }
}
assert(triangles < 30000, 'Runtime triangle budget');
assert(bytes.length < 2 * 1024 * 1024, 'Runtime delivery budget');
assert(fs.existsSync(path.join(root, 'assets/academy/quest-isles.blend')), 'Editable Blender source');
assert(fs.existsSync(path.join(root, 'public/models/academy/quest-isles-preview.png')), 'Fallback preview');
console.log(JSON.stringify({ bytes: bytes.length, triangles, vertices, meshes: gltf.meshes.length, stations: [...stationIds] }));
