// world.js — Infinite world chunk storage

import { CHUNK_SIZE, WORLD_HEIGHT } from './config.js';
import { createEmptyChunk } from './storage.js';

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
            this.chunks.set(key, createEmptyChunk(cx, cz));
        }
        return this.chunks.get(key);
    }

    // Convert world coords → chunk coords + local coords
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

    // Neighbor chunk access for meshing
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
}




