// world.js — unified world system + 3D chunk storage + terrain

import {
    CHUNK_SIZE_X,
    CHUNK_SIZE_Y,
    CHUNK_SIZE_Z,
    CHUNK_RADIUS
} from "./config.js";

import { BlockstateDB } from "./blockRenderer.js";

// -----------------------------------------------------
// BLOCK DISCOVERY
// -----------------------------------------------------

export async function loadBlockNames() {
    const res = await fetch("assets/sixsevencraft/blockstates/blocklist.json");
    if (!res.ok) {
        console.error("Failed to load blocklist.json", res.status, res.statusText);
        return [];
    }
    return await res.json();
}

// -----------------------------------------------------
// BIOME LOADING
// -----------------------------------------------------

export async function loadBiomes() {
    const biomeNames = [
        "icePlains",
        "grassyPlains",
        "oakForest",
        "volcanic",
        "theEnd"
    ];

    for (const name of biomeNames) {
        const res = await fetch(`assets/sixsevencraft/biomes/${name}.json`);
        if (!res.ok) {
            console.error("Failed to load biome", name);
            continue;
        }
        const data = await res.json();
        BiomeDB.byName.set(data.name, data);
        BiomeDB.list.push(data);
    }
}

// -----------------------------------------------------
// CHUNK HELPERS
// -----------------------------------------------------

const CHUNK_VOLUME = CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z;

function createEmptyChunk(cx, cz) {
    return {
        cx, cz,
        blocks: new Uint16Array(CHUNK_VOLUME),
        blockStates: new Uint16Array(CHUNK_VOLUME),
        mesh: null,
        needsRemesh: true
    };
}

function index3D(x, y, z) {
    return x + CHUNK_SIZE_X * (z + CHUNK_SIZE_Z * y);
}

function encodeArray(arr) {
    return btoa(String.fromCharCode(...new Uint8Array(arr.buffer)));
}

function decodeArray(str) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Uint16Array(bytes.buffer);
}

export function saveChunk(chunk) {
    return {
        cx: chunk.cx,
        cz: chunk.cz,
        blocks: encodeArray(chunk.blocks),
        blockStates: encodeArray(chunk.blockStates)
    };
}

export function loadChunk(data) {
    return {
        cx: data.cx,
        cz: data.cz,
        blocks: decodeArray(data.blocks),
        blockStates: decodeArray(data.blockStates),
        mesh: null,
        needsRemesh: true
    };
}

// -----------------------------------------------------
// TERRAIN GENERATION (3D CHUNK VERSION)
// -----------------------------------------------------

export function generateChunk(chunk) {
    const { blocks, blockStates } = chunk;

    for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {

            const worldX = chunk.cx * CHUNK_SIZE_X + x;
            const worldZ = chunk.cz * CHUNK_SIZE_Z + z;

            const height = 64 + Math.floor(
                8 * Math.sin(worldX * 0.05) +
                8 * Math.cos(worldZ * 0.05)
            );

            for (let y = 0; y < CHUNK_SIZE_Y; y++) {
                const idx = index3D(x, y, z);

                if (y > height) {
                    blocks[idx] = 0;
                    blockStates[idx] = 0;
                } else if (y === height) {
                    blocks[idx] = BlockstateDB.byName.get("grass_block")?.id || 0;
                } else if (y > height - 4) {
                    blocks[idx] = BlockstateDB.byName.get("dirt")?.id || 0;
                } else {
                    blocks[idx] = BlockstateDB.byName.get("stone")?.id || 0;
                }
            }
        }
    }

    chunk.needsRemesh = true;
}

// -----------------------------------------------------
// WORLD CLASS (3D CHUNKS)
// -----------------------------------------------------

export class World {
    constructor() {
        this.chunks = new Map();
        this.textureAtlas = null;
    }

    _key(cx, cz) {
        return `${cx},${cz}`;
    }

    hasChunk(cx, cz) {
        return this.chunks.has(this._key(cx, cz));
    }

    getChunk(cx, cz) {
        return this.chunks.get(this._key(cx, cz)) || null;
    }

    ensureChunk(cx, cz) {
        const key = this._key(cx, cz);
        if (!this.chunks.has(key)) {
            const chunk = createEmptyChunk(cx, cz);
            generateChunk(chunk);
            this.chunks.set(key, chunk);
        }
        return this.chunks.get(key);
    }

    worldToChunk(wx, wy, wz) {
        const cx = Math.floor(wx / CHUNK_SIZE_X);
        const cz = Math.floor(wz / CHUNK_SIZE_Z);

        const lx = wx - cx * CHUNK_SIZE_X;
        const lz = wz - cz * CHUNK_SIZE_Z;

        return { cx, cz, lx, ly: wy, lz };
    }

    getBlock(wx, wy, wz) {
        if (wy < 0 || wy >= CHUNK_SIZE_Y) return 0;
        const { cx, cz, lx, ly, lz } = this.worldToChunk(wx, wy, wz);
        const chunk = this.getChunk(cx, cz);
        if (!chunk) return 0;
        return chunk.blocks[index3D(lx, ly, lz)];
    }

    getBlockStateID(wx, wy, wz) {
        if (wy < 0 || wy >= CHUNK_SIZE_Y) return 0;
        const { cx, cz, lx, ly, lz } = this.worldToChunk(wx, wy, wz);
        const chunk = this.getChunk(cx, cz);
        if (!chunk) return 0;
        return chunk.blockStates[index3D(lx, ly, lz)];
    }

    setBlock(wx, wy, wz, blockId, stateId = 0) {
        if (wy < 0 || wy >= CHUNK_SIZE_Y) return;
        const { cx, cz, lx, ly, lz } = this.worldToChunk(wx, wy, wz);
        const chunk = this.ensureChunk(cx, cz);
        const idx = index3D(lx, ly, lz);

        chunk.blocks[idx] = blockId;
        chunk.blockStates[idx] = stateId;
        chunk.needsRemesh = true;

        if (lx === 0) this.mark(cx - 1, cz);
        if (lx === CHUNK_SIZE_X - 1) this.mark(cx + 1, cz);
        if (lz === 0) this.mark(cx, cz - 1);
        if (lz === CHUNK_SIZE_Z - 1) this.mark(cx, cz + 1);
    }

    mark(cx, cz) {
        const c = this.getChunk(cx, cz);
        if (c) c.needsRemesh = true;
    }

    updateLoadedChunks(px, pz) {
        const centerCx = Math.floor(px / CHUNK_SIZE_X);
        const centerCz = Math.floor(pz / CHUNK_SIZE_Z);

        const needed = new Set();

        for (let dx = -CHUNK_RADIUS; dx <= CHUNK_RADIUS; dx++) {
            for (let dz = -CHUNK_RADIUS; dz <= CHUNK_RADIUS; dz++) {
                const cx = centerCx + dx;
                const cz = centerCz + dz;
                needed.add(this._key(cx, cz));
                this.ensureChunk(cx, cz);
            }
        }

        for (const [key, chunk] of this.chunks.entries()) {
            if (!needed.has(key)) {
                this.chunks.delete(key);
            }
        }
    }
}

export function getBiomeAt(x, z) {
    const n = Math.sin(x * 0.004) + Math.cos(z * 0.004);

    if (n > 1.2) return BiomeDB.byName.get("volcanic");
    if (n > 0.4) return BiomeDB.byName.get("oak_forest");
    if (n > -0.2) return BiomeDB.byName.get("grassyplains");
    if (n > -1.0) return BiomeDB.byName.get("iceplains");

    return BiomeDB.byName.get("the_end");
}

export const world = new World();
