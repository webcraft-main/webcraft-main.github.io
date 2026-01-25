// textureAtlas.js — runtime 16x16 block texture atlas (4096x4096)

const THREE = window.THREE;

// Global atlas texture + UV map
export let blockTextureAtlas = null;
export const BlockAtlasUV = new Map(); // key: "block/grass_block_top" → { u0,v0,u1,v1 }

// Config
const TILE_SIZE = 16;          // each source texture is 16x16
const ATLAS_SIZE = 4096;       // final atlas is 4096x4096
const TILES_PER_ROW = ATLAS_SIZE / TILE_SIZE; // 256

// -----------------------------------------------------
// MAIN ENTRY
// -----------------------------------------------------

export async function buildBlockTextureAtlas(textureNames) {
    // textureNames: array of strings like "block/grass_block_top"
    // We assume all are 16x16 PNGs under assets/sixsevencraft/textures/

    // Create an offscreen canvas to assemble the atlas
    const canvas = document.createElement("canvas");
    canvas.width = ATLAS_SIZE;
    canvas.height = ATLAS_SIZE;
    const ctx = canvas.getContext("2d");

    let index = 0;

    for (const name of textureNames) {
        const img = await loadImageForTexture(name);
        if (!img) continue;

        const tileX = index % TILES_PER_ROW;
        const tileY = Math.floor(index / TILES_PER_ROW);

        const x = tileX * TILE_SIZE;
        const y = tileY * TILE_SIZE;

        ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE);

        const u0 = x / ATLAS_SIZE;
        const v0 = y / ATLAS_SIZE;
        const u1 = (x + TILE_SIZE) / ATLAS_SIZE;
        const v1 = (y + TILE_SIZE) / ATLAS_SIZE;

        BlockAtlasUV.set(name, { u0, v0, u1, v1 });

        index++;
    }

    const atlasTexture = new THREE.CanvasTexture(canvas);
    atlasTexture.magFilter = THREE.NearestFilter;
    atlasTexture.minFilter = THREE.NearestFilter;

    blockTextureAtlas = atlasTexture;
    return { texture: atlasTexture, uvMap: BlockAtlasUV };
}

// -----------------------------------------------------
// HELPERS
// -----------------------------------------------------

async function loadImageForTexture(name) {
    // name like "block/grass_block_top"
    const path = `assets/sixsevencraft/textures/${name}.png`;

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = path;
    });
}
