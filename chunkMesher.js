// chunkMesher.js — model-aware greedy meshing

import * as THREE from 'three';
import { CHUNK_SIZE, WORLD_HEIGHT } from './config.js';
import { getBlockModelFaces } from './blockMeshFromState.js';

export async function meshChunk(world, chunk) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    let indexOffset = 0;

    // For each axis (X, Y, Z)
    for (let axis = 0; axis < 3; axis++) {
        const u = (axis + 1) % 3;
        const v = (axis + 2) % 3;

        const dims = [CHUNK_SIZE, WORLD_HEIGHT, CHUNK_SIZE];

        const mask = new Array(dims[u] * dims[v]);

        const du = [0, 0, 0];
        const dv = [0, 0, 0];
        du[u] = 1;
        dv[v] = 1;

        for (let d = -1; d < dims[axis]; d++) {
            let n = 0;

            for (let j = 0; j < dims[v]; j++) {
                for (let i = 0; i < dims[u]; i++) {

                    const a = getVoxel(world, chunk, axis, d, i, j);
                    const b = getVoxel(world, chunk, axis, d + 1, i, j);

                    if (shouldMerge(a, b)) {
                        mask[n++] = null;
                    } else {
                        mask[n++] = a;
                    }
                }
            }

            n = 0;

            for (let j = 0; j < dims[v]; j++) {
                for (let i = 0; i < dims[u];) {

                    const voxel = mask[n];
                    if (!voxel) {
                        i++;
                        n++;
                        continue;
                    }

                    let width = 1;
                    while (i + width < dims[u] && mask[n + width] && canMerge(voxel, mask[n + width])) {
                        width++;
                    }

                    let height = 1;
                    outer: for (; j + height < dims[v]; height++) {
                        for (let k = 0; k < width; k++) {
                            const idx = n + k + height * dims[u];
                            if (!mask[idx] || !canMerge(voxel, mask[idx])) {
                                break outer;
                            }
                        }
                    }

                    addQuad(voxel, axis, d, i, j, width, height);

                    for (let h = 0; h < height; h++) {
                        for (let w = 0; w < width; w++) {
                            mask[n + w + h * dims[u]] = null;
                        }
                    }

                    i += width;
                    n += width;
                }
            }
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    const mesh = new THREE.Mesh(geometry, world.material);
    chunk.mesh = mesh;
    chunk.needsRemesh = false;
    return mesh;

    // Helpers

    function addQuad(voxel, axis, d, i, j, width, height) {
        const { face } = voxel;

        const x = [0, 0, 0];
        x[axis] = d + 1;
        x[(axis + 1) % 3] = i;
        x[(axis + 2) % 3] = j;

        const duv = [0, 0, 0];
        duv[(axis + 1) % 3] = width;

        const dvv = [0, 0, 0];
        dvv[(axis + 2) % 3] = height;

        const verts = [
            [x[0], x[1], x[2]],
            [x[0] + duv[0], x[1] + duv[1], x[2] + duv[2]],
            [x[0] + duv[0] + dvv[0], x[1] + duv[1] + dvv[1], x[2] + duv[2] + dvv[2]],
            [x[0] + dvv[0], x[1] + dvv[1], x[2] + dvv[2]]
        ];

        const base = positions.length / 3;

        for (const v of verts) positions.push(...v);

        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);

        const { texture } = face;
        uvs.push(...texture.uv00, ...texture.uv10, ...texture.uv11, ...texture.uv01);
    }

    function shouldMerge(a, b) {
        if (!a || !b) return false;
        return a.block === b.block && a.state === b.state && a.faceKey === b.faceKey;
    }

    function canMerge(a, b) {
        return shouldMerge(a, b);
    }
}

function getVoxel(world, chunk, axis, d, i, j) {
    const dims = [CHUNK_SIZE, WORLD_HEIGHT, CHUNK_SIZE];

    const x = [0, 0, 0];
    x[axis] = d;
    x[(axis + 1) % 3] = i;
    x[(axis + 2) % 3] = j;

    const lx = x[0], y = x[1], lz = x[2];

    if (y < 0 || y >= WORLD_HEIGHT) return null;

    const index = lx + CHUNK_SIZE * (lz + CHUNK_SIZE * y);

    const block = chunk.blocks[index];
    if (block === 0) return null;

    const state = chunk.blockStates[index];

    return {
        block,
        state,
        face: null, // filled later
        faceKey: `${block}|${state}`
    };
}
