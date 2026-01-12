import { setBlock } from "./blocks.js";

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

function maybeTree(biome) {
    return biome === "OAK_FOREST" && Math.random() < 0.05;
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

            if (biome === "ICE_PLAINS") {
                setBlock(wx, h, wz, "snow");
            } else if (biome === "GRASSY_PLAINS") {
                setBlock(wx, h, wz, "grass");
            } else if (biome === "OAK_FOREST") {
                setBlock(wx, h, wz, "grass");
                if (maybeTree(biome)) {
                    generateOakTree(wx, h + 1, wz);
                }
            } else if (biome === "VOLCANIC") {
                setBlock(wx, h, wz, "deepslate");
                if (Math.random() < 0.03) {
                    setBlock(wx, h + 1, wz, "lava");
                }
            } else if (biome === "OCEAN") {
                setBlock(wx, h, wz, "sand");
                for (let y = h + 1; y <= 0; y++) {
                    setBlock(wx, y, wz, "water");
                }
            }

            if (biome !== "OCEAN" && Math.random() < 0.01) {
                setBlock(wx, h + 1, wz, "water");
            }
        }
    }
}

/* ============================================================
   OAK TREE GENERATOR
   ============================================================ */

function generateOakTree(x, y, z) {
    for (let i = 0; i < 4; i++) {
        setBlock(x, y + i, z, "oak_log");
    }
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            if (Math.abs(dx) + Math.abs(dz) < 4) {
                setBlock(x + dx, y + 4, z + dz, "oak_leaves");
            }
        }
    }
}

export function getBiomeAt(x, z) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    return getBiome(cx, cz);
}


