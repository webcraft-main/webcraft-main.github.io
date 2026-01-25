// main.js

const THREE = window.THREE;

import { registerBlock, buildStatesFromBlockstates } from "./blockRenderer.js";
import { BlockstateDB, loadAllBlockstates } from "./blockRenderer.js";
import { initDebugBlockstateUI } from "./world.js"; // new file

// 1. Register all blocks (names must match blockstate filenames)
const BLOCK_NAMES = [
    "stone",
    "grass_block",
    "dirt",
    "oak_log",
    "oak_leaves",
    // ...add all your block names here
];

for (const name of BLOCK_NAMES) {
    registerBlock(name);
}

async function init() {
    // 2. Load all blockstates
    await loadAllBlockstates(BLOCK_NAMES);

    // 3. Build state registry from blockstates
    buildStatesFromBlockstates();

    // 4. Init debug UI
    initDebugBlockstateUI();

    // 5. Continue with your existing world/engine init...
    // create world, start render loop, etc.
}

init();




