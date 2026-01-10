import { addBlock, BlockType } from "./blocks.js";

export const CHUNK_SIZE = 16;
export const VIEW_DISTANCE = 3;

const simplex = new SimplexNoise("sixseven-seed");
const loadedChunks = new Set();

function key(cx, cz) {
    return `${cx},${cz}`;
}

export function ensureChunksAround(playerPos) {
    const cx = Math.floor(playerPos.x / CHUNK_SIZE);
    const cz = Math.floor(playerPos.z / CHUNK_SIZE);

    for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
        for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
            const k = key(cx + dx, cz + dz);
            if (!loadedChunks.has(k)) {
                generateChunk(cx + dx, cz + dz);
                loadedChunks.add(k);
            }
        }
    }
}

/* ============================================================
   BIOME SELECTION
   ============================================================ */

function getBiome(cx, cz) {
    const n = simplex.noise2D(cx * 0.05, cz * 0.05);

    if (n < -0.35) return "OCEAN";
    if (n < -0.1) return "ICE_PLAINS";
    if (n < 0.25) return "GRASSY_PLAINS";
    if (n < 0.55) return "OAK_FOREST";
    return "VOLCANIC";
}

/* ============================================================
   HEIGHTMAP PER BIOME
   ============================================================ */

function getHeight(biome, wx, wz) {
    const h = simplex.noise2D(wx * 0.05, wz * 0.05);

    switch (biome) {
        case "OCEAN": return -2 + h * 1;
        case "ICE_PLAINS": return 1 + h * 2;
        case "GRASSY_PLAINS": return 2 + h * 3;
        case "OAK_FOREST": return 3 + h * 4;
        case "VOLCANIC": return 4 + h * 2;
    }
}

/* ============================================================
   DECORATION HELPERS
   ============================================================ */

function maybePond(biome) {
    return biome !== "OCEAN" && Math.random() < 0.02;
}

function maybeTree(biome) {
    return biome === "OAK_FOREST" && Math.random() < 0.05;
}

function maybeVolcanoCrack(biome) {
    return biome === "VOLCANIC" && Math.random() < 0.03;
}

/* ============================================================
   CHUNK GENERATION
   ============================================================ */

function generateChunk(cx, cz) {
    const biome = getBiome(cx, cz);

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const wx = cx * CHUNK_SIZE + x;
            const wz = cz * CHUNK_SIZE + z;

            const h = Math.floor(getHeight(biome, wx, wz));

            addBlock(wx, h, wz, "grass");
            addBlock(wx, h, wz, "sand");
            addBlock(wx, h, wz, "snow");
            addBlock(wx, h, wz, "deepslate");
            addBlock(wx, h, wz, "water");
            addBlock(wx, h, wz, "lava");
            addBlock(wx, h, wz, "oak_log");
            addBlock(wx, h, wz, "oak_leaves");

            // Ground
            let blockType = BlockType.GRASS;

            if (biome === "ICE_PLAINS") blockType = BlockType.SNOW ?? BlockType.GRASS;
            if (biome === "OCEAN") blockType = BlockType.SAND;
            if (biome === "VOLCANIC") blockType = BlockType.DEEPSLATE ?? BlockType.STONE;

            addBlock(wx, h, wz, blockType);

            // Ocean fill
            if (biome === "OCEAN") {
                for (let y = h + 1; y <= 0; y++) {
                    addBlock(wx, y, wz, BlockType.WATER);
                }
            }

            // Ponds
            if (maybePond(biome) && Math.random() < 0.01) {
                addBlock(wx, h + 1, wz, BlockType.WATER);
            }

            // Trees
            if (maybeTree(biome)) {
                generateOakTree(wx, h + 1, wz);
            }

            // Volcanic cracks
            if (maybeVolcanoCrack(biome)) {
                addBlock(wx, h + 1, wz, BlockType.LAVA);
            }
        }
    }
}

/* ============================================================
   OAK TREE GENERATOR
   ============================================================ */

function generateOakTree(x, y, z) {
    for (let i = 0; i < 4; i++) {
        addBlock(x, y + i, z, BlockType.WOOD);
    }
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) + Math.abs(dz) < 4) {
                addBlock(x + dx, y + 4, z + dz, BlockType.LEAVES);
            }
        }
    }
}
