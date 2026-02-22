// main.js — unified bootstrap + chunk streaming

const THREE = window.THREE;

import {
    registerBlock,
    buildStatesFromBlockstates,
    loadAllBlockstates,
    BlockstateDB
} from "./blockRenderer.js";

import { buildBlockTextureAtlas } from "./textureAtlas.js";
import { collectAllTextureNames } from "./textureCollector.js";

import { world, loadBiomes } from "./world.js";   // ← chunk‑aware world
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

    // 3. Load blockstates (this ALSO preloads models now)
    await loadAllBlockstates(BLOCK_NAMES);

    // 4. Build state registry
    buildStatesFromBlockstates();

    // 5. Load biomes
    await loadBiomes();

    // 6. DEBUG: verify models are loaded
    console.log("Models loaded:", BlockstateDB.models.size);

    // 7. Collect all texture names
    const textureNames = await collectAllTextureNames(BlockstateDB);

    // 8. Build texture atlas
    const { texture: atlasTexture } = await buildBlockTextureAtlas(textureNames);

    // 9. Inject atlas into world
    world.textureAtlas = atlasTexture;

    // 10. Debug UI
    initDebugBlockstateUI();

    // 11. Force-load spawn chunk (0,0)
    world.ensureChunk(0, 0);

    // 12. Start game loop
    startGameLoop(world, scene, camera, renderer);
}

init();
