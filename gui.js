// gui.js — Minecraft-style GUI (hotbar + inventory)

import { tex, loadAllItemNames } from "./textureLoader.js";
import { registerInventoryToggle, registerHotbarSelect } from "./input.js";

const canvas = document.getElementById("guiCanvas");
const ctx = canvas.getContext("2d");

// -----------------------------------------------------
// STATE
// -----------------------------------------------------

let hotbarTex = null;
let selectTex = null;

let itemTextures = new Map();   // name → THREE.Texture
let allItems = [];              // list of all item names

let hotbarItems = new Array(9).fill(null);
let selectedSlot = 0;

let inventoryOpen = false;

// Inventory layout
const INV_COLS = 9;
const INV_ROWS = 4;
const SLOT_SIZE = 32;
const SLOT_PADDING = 4;

let invX = 0, invY = 0, invW = 0, invH = 0;

// -----------------------------------------------------
// RESIZE CANVAS (with DPI scaling)
// -----------------------------------------------------

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// -----------------------------------------------------
// LOAD GUI + ITEM TEXTURES
// -----------------------------------------------------

async function loadGUITextures() {
    hotbarTex = await tex("gui", "hotbar");
    selectTex = await tex("gui", "hotbar_selection");

    allItems = await loadAllItemNames();

    for (const name of allItems) {
        const icon = await tex("item", name);
        if (icon) itemTextures.set(name, icon);
    }
}

// -----------------------------------------------------
// HOTBAR DRAWING
// -----------------------------------------------------

function drawHotbar() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    const hotbarWidth = hotbarTex?.image?.width || 182;
    const hotbarHeight = hotbarTex?.image?.height || 22;

    const x = (w - hotbarWidth) / 2;
    const y = h - hotbarHeight - 10;

    // Draw hotbar frame
    if (hotbarTex?.image) {
        ctx.drawImage(hotbarTex.image, x, y);
    }

    // Slot width from texture
    const SLOT_W = hotbarWidth / 9;

    // Draw selected slot highlight
    if (selectTex?.image) {
        const slotX = x + selectedSlot * SLOT_W;
        ctx.drawImage(selectTex.image, slotX, y - 1);
    }

    // Draw item icons
    for (let i = 0; i < 9; i++) {
        const item = hotbarItems[i];
        if (!item) continue;

        const tex = itemTextures.get(item);
        if (!tex?.image) continue;

        const iconX = x + i * SLOT_W + (SLOT_W - 16) / 2;
        const iconY = y + (hotbarHeight - 16) / 2;

        ctx.drawImage(tex.image, iconX, iconY, 16, 16);
    }
}

// -----------------------------------------------------
// INVENTORY DRAWING
// -----------------------------------------------------

function drawInventory() {
    if (!inventoryOpen) return;

    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    invW = INV_COLS * SLOT_SIZE + 40;
    invH = INV_ROWS * SLOT_SIZE + 80;

    invX = (w - invW) / 2;
    invY = (h - invH) / 2;

    // Background
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(invX, invY, invW, invH);

    // Title
    ctx.fillStyle = "white";
    ctx.font = "20px monospace";
    ctx.fillText("Inventory", invX + 20, invY + 30);

    const startX = invX + 20;
    const startY = invY + 50;

    let index = 0;

    for (let row = 0; row < INV_ROWS; row++) {
        for (let col = 0; col < INV_COLS; col++) {
            const sx = startX + col * SLOT_SIZE;
            const sy = startY + row * SLOT_SIZE;

            // Slot background
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.fillRect(sx, sy, SLOT_SIZE, SLOT_SIZE);

            if (index >= allItems.length) {
                index++;
                continue;
            }

            const name = allItems[index];
            const tex = itemTextures.get(name);

            if (tex?.image) {
                const inner = SLOT_SIZE - SLOT_PADDING * 2;
                ctx.drawImage(
                    tex.image,
                    sx + SLOT_PADDING,
                    sy + SLOT_PADDING,
                    inner,
                    inner
                );
            }

            index++;
        }
    }
}

// -----------------------------------------------------
// INVENTORY CLICK HANDLING
// -----------------------------------------------------

canvas.addEventListener("mousedown", (e) => {
    if (!inventoryOpen) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const mx = (e.clientX - rect.left) * dpr;
    const my = (e.clientY - rect.top) * dpr;

    if (mx < invX || mx > invX + invW || my < invY || my > invH) return;

    const startX = invX + 20;
    const startY = invY + 50;

    const localX = mx - startX;
    const localY = my - startY;

    if (localX < 0 || localY < 0) return;

    const col = Math.floor(localX / SLOT_SIZE);
    const row = Math.floor(localY / SLOT_SIZE);

    if (col < 0 || col >= INV_COLS || row < 0 || row >= INV_ROWS) return;

    const index = row * INV_COLS + col;
    if (index >= allItems.length) return;

    const pickedName = allItems[index];
    hotbarItems[selectedSlot] = pickedName;
});

// -----------------------------------------------------
// MAIN RENDER LOOP
// -----------------------------------------------------

function renderGUI() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawHotbar();
    drawInventory();

    requestAnimationFrame(renderGUI);
}

// -----------------------------------------------------
// INITIALIZE
// -----------------------------------------------------

async function initGUI() {
    registerInventoryToggle(() => {
        inventoryOpen = !inventoryOpen;
    });

    registerHotbarSelect((idx) => {
        selectedSlot = idx;
    });

    await loadGUITextures();
    renderGUI();
}

initGUI();


