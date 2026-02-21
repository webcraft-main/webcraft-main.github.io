// chunkMesher.js — model-aware greedy meshing + neighbor-aware culling + terrain shader

const THREE = window.THREE;

import {
    CHUNK_SIZE_X,
    CHUNK_SIZE_Y,
    CHUNK_SIZE_Z
} from "./config.js";

import { getBlockModelFaces } from "./blockRenderer.js";
import { loadShader } from "./shaderLoader.js";
import { BlockAtlasUV } from "./textureAtlas.js";

let terrainVertexShader = null;
let terrainFragmentShader = null;
let terrainMaterial = null;

async function ensureTerrainMaterial(world) {
    if (!terrainVertexShader) {
        terrainVertexShader = await loadShader(
            "assets/sixsevencraft/shaders/core/terrain.vsh"
        );
    }
    if (!terrainFragmentShader) {
        terrainFragmentShader = await loadShader(
            "assets/sixsevencraft/shaders/core/terrain.fsh"
        );
    }
    if (!terrainMaterial) {
        terrainMaterial = new THREE.ShaderMaterial({
            vertexShader: terrainVertexShader,
            fragmentShader: terrainFragmentShader,
            uniforms: {
                Sampler0: { value: world.textureAtlas || null },
            }
        });
    } else {
        terrainMaterial.uniforms.Sampler0.value = world.textureAtlas || null;
    }
    return terrainMaterial;
}

// -----------------------------------------------------
// MAIN MESH FUNCTION
// -----------------------------------------------------

export async function meshChunk(world, chunk, neighbors) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    const dims = [CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z];

    // -------------------------------------------------
    // 1) Precompute faces for all (blockId,stateId)
    // -------------------------------------------------
    const faceCache = new Map();

    for (let y = 0; y < CHUNK_SIZE_Y; y++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
            for (let x = 0; x < CHUNK_SIZE_X; x++) {
                const idx = x + CHUNK_SIZE_X * (z + CHUNK_SIZE_Z * y);
                const blockId = chunk.blocks[idx];
                const stateId = chunk.blockStates[idx];
                if (!blockId) continue;

                const key = `${blockId}:${stateId}`;
                if (faceCache.has(key)) continue;

                const faces = await getBlockModelFaces(blockId, stateId);
                if (faces && faces.length) {
                    faceCache.set(key, faces);
                }
            }
        }
    }

    // -------------------------------------------------
    // 2) Greedy meshing (3 axes)
    // -------------------------------------------------
    for (let axis = 0; axis < 3; axis++) {
        const u = (axis + 1) % 3;
        const v = (axis + 2) % 3;

        const mask = new Array(dims[u] * dims[v]);

        const du = [0, 0, 0];
        const dv = [0, 0, 0];
        du[u] = 1;
        dv[v] = 1;

        for (let d = -1; d < dims[axis]; d++) {
            let n = 0;

            // Build mask with neighbor-aware visibility
            for (let j = 0; j < dims[v]; j++) {
                for (let i = 0; i < dims[u]; i++) {
                    const a = getVoxel(chunk, neighbors, axis, d, i, j, faceCache);
                    const b = getVoxel(chunk, neighbors, axis, d + 1, i, j, faceCache);

                    if (shouldMerge(a, b)) {
                        mask[n++] = null;
                    } else {
                        mask[n++] = a
                            ? { ...a, side: +1 }
                            : b
                            ? { ...b, side: -1 }
                            : null;
                    }
                }
            }

            n = 0;

            // Greedy merge
            for (let j = 0; j < dims[v]; j++) {
                for (let i = 0; i < dims[u];) {
                    const voxel = mask[n];
                    if (!voxel) {
                        i++;
                        n++;
                        continue;
                    }

                    const faceIndex = pickFace(axis, voxel.side);
                    voxel.face = voxel.faces[faceIndex];
                    if (!voxel.face) {
                        i++;
                        n++;
                        continue;
                    }

                    let width = 1;
                    while (
                        i + width < dims[u] &&
                        mask[n + width] &&
                        canMerge(voxel, mask[n + width], faceIndex)
                    ) {
                        width++;
                    }

                    let height = 1;
                    outer: for (; j + height < dims[v]; height++) {
                        for (let k = 0; k < width; k++) {
                            const idx = n + k + height * dims[u];
                            if (!mask[idx] || !canMerge(voxel, mask[idx], faceIndex)) {
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

    // -------------------------------------------------
    // 3) Build geometry
    // -------------------------------------------------

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    const material = await ensureTerrainMaterial(world);
    const mesh = new THREE.Mesh(geometry, material);

    chunk.mesh = mesh;
    chunk.needsRemesh = false;
    return mesh;

    // -------------------------------------------------
    // Helper functions
    // -------------------------------------------------

    function addQuad(voxel, axis, d, i, j, width, height) {
        const face = voxel.face;
        if (!face) return;

        const atlasUV = BlockAtlasUV.get(face.textureName);
        if (!atlasUV) return;

        const x = [0, 0, 0];
        const sideOffset = voxel.side > 0 ? 1 : 0;

        x[axis] = d + sideOffset;
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

        uvs.push(
            atlasUV.u0, atlasUV.v0,
            atlasUV.u1, atlasUV.v0,
            atlasUV.u1, atlasUV.v1,
            atlasUV.u0, atlasUV.v1
        );
    }

    function getVoxel(chunk, neighbors, axis, d, i, j, faceCache) {
        if (d < 0 || d >= dims[axis]) return null;

        let x, y, z;
        if (axis === 0) { x = d; y = i; z = j; }
        else if (axis === 1) { x = i; y = d; z = j; }
        else { x = i; y = j; z = d; }

        // Inside chunk
        if (
            x >= 0 && x < CHUNK_SIZE_X &&
            y >= 0 && y < CHUNK_SIZE_Y &&
            z >= 0 && z < CHUNK_SIZE_Z
        ) {
            const idx = x + CHUNK_SIZE_X * (z + CHUNK_SIZE_Z * y);
            const blockId = chunk.blocks[idx];
            const stateId = chunk.blockStates[idx];
            if (!blockId) return null;

            const key = `${blockId}:${stateId}`;
            return {
                id: blockId,
                state: stateId,
                faces: faceCache.get(key)
            };
        }

        // Neighbor chunks
        const neighbor = resolveNeighbor(neighbors, x, y, z);
        if (!neighbor) return null;

        const idx = neighbor.lx + CHUNK_SIZE_X * (neighbor.lz + CHUNK_SIZE_Z * y);
        const blockId = neighbor.chunk.blocks[idx];
        const stateId = neighbor.chunk.blockStates[idx];

        if (!blockId) return null;

        const key = `${blockId}:${stateId}`;
        return {
            id: blockId,
            state: stateId,
            faces: faceCache.get(key)
        };
    }

    function resolveNeighbor(neighbors, x, y, z) {
        if (x < 0 && neighbors.nx) return { chunk: neighbors.nx, lx: x + CHUNK_SIZE_X, lz: z };
        if (x >= CHUNK_SIZE_X && neighbors.px) return { chunk: neighbors.px, lx: x - CHUNK_SIZE_X, lz: z };
        if (z < 0 && neighbors.nz) return { chunk: neighbors.nz, lx: x, lz: z + CHUNK_SIZE_Z };
        if (z >= CHUNK_SIZE_Z && neighbors.pz) return { chunk: neighbors.pz, lx: x, lz: z - CHUNK_SIZE_Z };
        return null;
    }

    function shouldMerge(a, b) {
        if (!a || !b) return false;
        return a.id === b.id && a.state === b.state;
    }

    function canMerge(a, b, faceIndex) {
        if (!a || !b) return false;
        if (a.id !== b.id) return false;
        if (a.state !== b.state) return false;
        return a.faces[faceIndex] === b.faces[faceIndex];
    }

    function pickFace(axis, side) {
        if (axis === 0) return side > 0 ? 0 : 1;
        if (axis === 1) return side > 0 ? 2 : 3;
        return side > 0 ? 4 : 5;
    }
}
