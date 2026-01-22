// gui.js — Minecraft-style GUI renderer

import { loadTexture } from "./textureLoader.js";

const canvas = document.getElementById("guiCanvas");
const ctx = canvas.getContext("2d");

let hotbarTex, selectTex;
let itemTextures = new Map();

let selectedSlot = 0;
let hotbarItems = [
    "grass_block",
    "stone",
    "oak_log",
    "oak_leaves",
    "water_bucket",
    "lava_bucket",
    "sand",
    "tnt"
];

// -----------------------------------------------------
// LOAD GUI TEXTURES
// -----------------------------------------------------

async function loadGUITextures() {
    hotbarTex = await loadTexture("assets/sixsevencraft/textures/gui/hotbar.png");
    selectTex = await loadTexture("assets/sixsevencraft/textures/gui/hotbar_selection.png");

    for (const item of hotbarItems) {
        const tex = await loadTexture(`assets/sixsevencraft/textures/item/${item}.png`);
        itemTextures.set(item, tex);
    }
}

// -----------------------------------------------------
// RESIZE CANVAS
// -----------------------------------------------------

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// -----------------------------------------------------
// DRAW HOTBAR
// -----------------------------------------------------

function drawHotbar() {
    const w = canvas.width;
    const h = canvas.height;

    const hotbarWidth = 182; // Minecraft hotbar width
    const hotbarHeight = 22;

    const x = (w - hotbarWidth) / 2;
    const y = h - hotbarHeight - 10;

    // Draw hotbar frame
    ctx.drawImage(hotbarTex.image, x, y);

    // Draw selected slot highlight
    const slotX = x + selectedSlot * 20 - 1;
    ctx.drawImage(selectTex.image, slotX, y - 1);

    // Draw item icons
    for (let i = 0; i < 8; i++) {
        const item = hotbarItems[i];
        if (!item) continue;

        const tex = itemTextures.get(item);
        if (!tex) continue;

        ctx.drawImage(tex.image, x + 3 + i * 20, y + 3, 16, 16);
    }
}

// -----------------------------------------------------
// MAIN RENDER LOOP
// -----------------------------------------------------

function renderGUI() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawHotbar();
    requestAnimationFrame(renderGUI);
}

// -----------------------------------------------------
// INITIALIZE
// -----------------------------------------------------

(async function initGUI() {
    await loadGUITextures();
    renderGUI();
})();
