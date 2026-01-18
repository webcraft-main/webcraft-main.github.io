// terrain.js — simple infinite terrain generator

import { registerBlock, registerBlockState } from './blocks.js';

const grass = registerBlock("grass");
const dirt = registerBlock("dirt");
const stone = registerBlock("stone");

export function generateChunk(chunk) {
    const { blocks, blockStates } = chunk;

    const CHUNK_SIZE = 16;
    const WORLD_HEIGHT = 128;

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
                    blocks[index] = grass;
                } else if (y > height - 4) {
                    blocks[index] = dirt;
                } else {
                    blocks[index] = stone;
                }
            }
        }
    }

    chunk.needsRemesh = true;
}

