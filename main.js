// main.js

const THREE = window.THREE;

import { registerBlock, buildStatesFromBlockstates } from "./blockRenderer.js";
import { BlockstateDB, loadAllBlockstates, validateBlockstates } from "./blockRenderer.js";
import { initDebugBlockstateUI } from "./debugBlockstates.js"; // new file

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

    // 4. Validate blockstates against models (simple check)
    const issues = validateBlockstates(modelName => {
        // naive check: assume all models exist; or plug into your model loader cache
        return true;
    });
    if (issues.length > 0) {
        console.warn("[Blockstate Validation] Issues:", issues);
    }

    // 5. Init debug UI
    initDebugBlockstateUI();

    // 6. Continue with your existing world/engine init...
    // create world, start render loop, etc.
}

init();




