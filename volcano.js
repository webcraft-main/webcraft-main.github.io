import { world } from "./world.js";
import { BlockstateDB } from "./blockRenderer.js";

const COBBLE_ID = BlockstateDB.byName.get("cobblestone")?.id || 0;
const MAGMA_ID = BlockstateDB.byName.get("magma_block")?.id || 0;
const LAVA_ID = BlockstateDB.byName.get("lava")?.id || 0;

export const VolcanoSystem = {
    timers: new Map(), // key: chunkKey, value: timestamp
    pending: new Map(), // key: chunkKey, value: {cobble:bool, snow:bool}

    onBlockThrown(chunk, blockId) {
        const key = `${chunk.cx},${chunk.cz}`;

        if (!this.pending.has(key)) {
            this.pending.set(key, { cobble: false });
        }

        const entry = this.pending.get(key);

        if (blockId === COBBLE_ID) entry.cobble = true;

        // If both items thrown → ignite immediately
        if (entry.cobble) {
            this.ignite(chunk);
        } else {
            // Start 40-minute timer if not already running
            if (!this.timers.has(key)) {
                this.timers.set(key, performance.now());
            }
        }
    },

    update() {
        const now = performance.now();

        for (const [key, start] of this.timers.entries()) {
            if (now - start > 40 * 60 * 1000) { // 40 minutes
                const [cx, cz] = key.split(",").map(Number);
                const chunk = world.getChunk(cx, cz);
                if (chunk) this.ignite(chunk);
                this.timers.delete(key);
            }
        }
    },

    ignite(chunk) {
        const { blocks } = chunk;

        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i] !== 0) {
                blocks[i] = MAGMA_ID;
            }
        }

        // Top layer lava
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const topIndex = x + 16 * (z + 16 * (world.WORLD_HEIGHT - 1));
                blocks[topIndex] = LAVA_ID;
            }
        }

        chunk.needsRemesh = true;
    }
};
