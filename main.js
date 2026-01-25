// main.js — full auto-discovery bootstrap

const THREE = window.THREE;

import {
    registerBlock,
    buildStatesFromBlockstates,
    loadAllBlockstates,
    BlockstateDB
} from "./blockRenderer.js";

import { buildBlockTextureAtlas } from "./textureAtlas.js";
import { collectAllTextureNames } from "./textureCollector.js";
import { world } from "./world.js"; // ← YOUR ORIGINAL IMPORT
import { scene, camera, renderer } from "./engine.js";
import { startGameLoop } from "./loop.js";
import { initDebugBlockstateUI } from "./debugBlockstateUI.js";

// -----------------------------------------------------
// AUTO-DISCOVER BLOCK NAMES
// -----------------------------------------------------

export async function discoverBlockNames() {
    const res = await fetch("assets/sixsevencraft/blockstates/blocklist.json");
    if (!res.ok) {
        console.error("Failed to load blocklist.json", res.status, res.statusText);
        return [];
    }
    return await res.json();
}


// -----------------------------------------------------
// MAIN INIT
// -----------------------------------------------------

async function init() {

    // 1. Auto-discover all blockstate files
    const BLOCK_NAMES = await discoverBlockNames();

    // 2. Register all blocks
    for (const name of BLOCK_NAMES) {
        registerBlock(name);
    }

    // 3. Load blockstates
    await loadAllBlockstates(BLOCK_NAMES);

    // 4. Build state registry
    buildStatesFromBlockstates();

    // 5. Collect all texture names from blockstates + models
    const textureNames = await collectAllTextureNames(BlockstateDB);

    // 6. Build texture atlas
    const { texture: atlasTexture } = await buildBlockTextureAtlas(textureNames);

    // 7. Inject atlas into your existing world
    world.textureAtlas = atlasTexture;

    // 8. Debug UI
    initDebugBlockstateUI();

    // 9. Start game loop
    startGameLoop(world, scene, camera, renderer);
}
// Force-load the spawn chunk
world.ensureChunk(0, 0);

init();




