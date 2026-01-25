// world.js — unified world system + chunk storage + terrain

import { CHUNK_SIZE, WORLD_HEIGHT } from './config.js';
import { BlockstateDB } from './blockRenderer.js';

// -----------------------------------------------------
// BLOCK DISCOVERY (from auto-generated manifest)
// -----------------------------------------------------

export async function loadBlockNames() {
    const res = await fetch("assets/sixsevencraft/blockstates/blocklist.json");
    if (!res.ok) {
        console.error("Failed to load blocklist.json", res.status, res.statusText);
        return [];
    }
    return await res.json();
}

// ----------------///
// BIOME CREATION  ///
// ----------------///
export async function loadBiomes() {
    const biomeNames = [
        "Ice Plains",
        "Grassy Plains",
        "Oak Forest",
        "Volcanic",
        "The End"
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
// CHUNK CREATION / STORAGE HELPERS
// -----------------------------------------------------

const CHUNK_VOLUME = CHUNK_SIZE * CHUNK_SIZE * WORLD_HEIGHT;

function createEmptyChunk(cx, cz) {
    return {
        cx, cz,
        blocks: new Uint16Array(CHUNK_VOLUME),
        blockStates: new Uint16Array(CHUNK_VOLUME),
        mesh: null,
        needsRemesh: true
    };
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
// TERRAIN GENERATION
// -----------------------------------------------------

export function generateChunk(chunk) {
    const { blocks, blockStates } = chunk;

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {

            const worldX = chunk.cx * CHUNK_SIZE + x;
            const worldZ = chunk.cz * CHUNK_SIZE + z;

            const height = 64 + Math.floor(
                8 * Math.sin(worldX * 0.05) +
                8 * Math.cos(worldZ * 0.05)
            );

            for (let y = 0; y < WORLD_HEIGHT; y++) {
                const index = x + CHUNK_SIZE * (z + CHUNK_SIZE * y);

                if (y > height) {
                    blocks[index] = 0;
                    blockStates[index] = 0;
                } else if (y === height) {
                    blocks[index] = BlockstateDB.byName.get("grass_block")?.id || 0;
                } else if (y > height - 4) {
                    blocks[index] = BlockstateDB.byName.get("dirt")?.id || 0;
                } else {
                    blocks[index] = BlockstateDB.byName.get("stone")?.id || 0;
                }
            }
        }
    }

    chunk.needsRemesh = true;
}

// -----------------------------------------------------
// WORLD CLASS
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

    worldToChunk(x, y, z) {
        const cx = Math.floor(x / CHUNK_SIZE);
        const cz = Math.floor(z / CHUNK_SIZE);
        const lx = x - cx * CHUNK_SIZE;
        const lz = z - cz * CHUNK_SIZE;
        return { cx, cz, lx, y, lz };
    }

    getBlock(x, y, z) {
        if (y < 0 || y >= WORLD_HEIGHT) return 0;
        const { cx, cz, lx, lz } = this.worldToChunk(x, y, z);
        const chunk = this.getChunk(cx, cz);
        if (!chunk) return 0;
        const index = lx + CHUNK_SIZE * (lz + CHUNK_SIZE * y);
        return chunk.blocks[index];
    }

    getBlockStateID(x, y, z) {
        if (y < 0 || y >= WORLD_HEIGHT) return 0;
        const { cx, cz, lx, lz } = this.worldToChunk(x, y, z);
        const chunk = this.getChunk(cx, cz);
        if (!chunk) return 0;
        const index = lx + CHUNK_SIZE * (lz + CHUNK_SIZE * y);
        return chunk.blockStates[index];
    }

    setBlock(x, y, z, blockId, stateId = 0) {
        if (y < 0 || y >= WORLD_HEIGHT) return;
        const { cx, cz, lx, lz } = this.worldToChunk(x, y, z);
        const chunk = this.ensureChunk(cx, cz);
        const index = lx + CHUNK_SIZE * (lz + CHUNK_SIZE * y);
        chunk.blocks[index] = blockId;
        chunk.blockStates[index] = stateId;
        chunk.needsRemesh = true;
    }

    loadRemoteChunk(data) {
        const chunk = this.ensureChunk(data.cx, data.cz);
        chunk.blocks = new Uint16Array(data.blocks);
        chunk.blockStates = new Uint16Array(data.blockStates);
        chunk.needsRemesh = true;
    }
}

// -----------------------------------------------------
// EXPORT WORLD INSTANCE
// -----------------------------------------------------

export const world = new World();

window.world = world;
