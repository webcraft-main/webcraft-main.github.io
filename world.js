// world.js — unified world system + block discovery + debug UI

import { CHUNK_SIZE, WORLD_HEIGHT } from './config.js';
import {
    registerBlock,
    loadAllBlockstates,
    buildStatesFromBlockstates,
    BlockstateDB,
    getStateDef
} from './blockRenderer.js';

// -----------------------------------------------------
// BLOCK DISCOVERY (auto from blockstates folder)
// -----------------------------------------------------

export async function loadBlockNames() {
    const url = "assets/sixsevencraft/blockstates/";
    const res = await fetch(url);
    const text = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const names = [];

    doc.querySelectorAll("a").forEach(a => {
        const href = a.getAttribute("href");
        if (href && href.endsWith(".json")) {
            const name = href.replace(".json", "");
            names.push(name);
        }
    });

    return names;
}

// -----------------------------------------------------
// BLOCK REGISTRATION (terrain uses these)
// -----------------------------------------------------

export const GRASS_BLOCK = registerBlock("grass_block");
export const DIRT = registerBlock("dirt");
export const STONE = registerBlock("stone");

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
                    blocks[index] = GRASS_BLOCK;
                } else if (y > height - 4) {
                    blocks[index] = DIRT;
                } else {
                    blocks[index] = STONE;
                }
            }
        }
    }

    chunk.needsRemesh = true;
}

// -----------------------------------------------------
// WORLD CLASS (chunk storage + access + remote load)
// -----------------------------------------------------

export class World {
    constructor() {
        this.chunks = new Map(); // key: "cx,cz" → chunk object
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

    getNeighborBlock(cx, cz, lx, y, lz, dx, dz) {
        let nx = lx + dx;
        let nz = lz + dz;
        let ncx = cx;
        let ncz = cz;

        if (nx < 0) { nx += CHUNK_SIZE; ncx--; }
        if (nx >= CHUNK_SIZE) { nx -= CHUNK_SIZE; ncx++; }
        if (nz < 0) { nz += CHUNK_SIZE; ncz--; }
        if (nz >= CHUNK_SIZE) { nz -= CHUNK_SIZE; ncz++; }

        const chunk = this.getChunk(ncx, ncz);
        if (!chunk) return { block: 0, state: 0 };

        const index = nx + CHUNK_SIZE * (nz + CHUNK_SIZE * y);
        return {
            block: chunk.blocks[index],
            state: chunk.blockStates[index]
        };
    }

    loadRemoteChunk(data) {
        const chunk = this.ensureChunk(data.cx, data.cz);
        chunk.blocks = new Uint16Array(data.blocks);
        chunk.blockStates = new Uint16Array(data.blockStates);
        chunk.needsRemesh = true;
    }
}

// -----------------------------------------------------
// DEBUG UI (optional dev overlay)
// -----------------------------------------------------

export function initDebugBlockstateUI() {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.right = "0";
    container.style.maxHeight = "100vh";
    container.style.overflow = "auto";
    container.style.background = "rgba(0,0,0,0.8)";
    container.style.color = "#fff";
    container.style.fontFamily = "monospace";
    container.style.fontSize = "11px";
    container.style.padding = "8px";
    container.style.zIndex = "9999";

    const title = document.createElement("div");
    title.textContent = "Blockstate Debug";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "4px";
    container.appendChild(title);

    for (const [name, entry] of BlockstateDB.byName.entries()) {
        const blockDiv = document.createElement("div");
        blockDiv.style.borderBottom = "1px solid #444";
        blockDiv.style.marginBottom = "4px";
        blockDiv.style.paddingBottom = "4px";

        const header = document.createElement("div");
        header.textContent = name;
        header.style.color = "#0ff";
        blockDiv.appendChild(header);


