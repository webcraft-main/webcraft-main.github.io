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

    // 3. Load blockstates
    await loadAllBlockstates(BLOCK_NAMES);

    // 4. Build state registry
    buildStatesFromBlockstates();

    // 5. Load biomes
    await loadBiomes();

    // 6. Collect all texture names from blockstates + models
    const textureNames = await collectAllTextureNames(BlockstateDB);

    // 7. Build texture atlas
    const { texture: atlasTexture } = await buildBlockTextureAtlas(textureNames);

    // 8. Inject atlas into world
    world.textureAtlas = atlasTexture;

    // 9. Debug UI
    initDebugBlockstateUI();

    // 10. Force-load spawn chunk (0,0)
    world.ensureChunk(0, 0);

    // 11. Start game loop (chunk-aware)
    startGameLoop(world, scene, camera, renderer);
}

init();
