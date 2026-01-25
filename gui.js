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

let hotbarItems = new Array(9).fill(null); // 9 empty slots
let selectedSlot = 0;

let inventoryOpen = false;

// Inventory layout
const INV_COLS = 9;
const INV_ROWS = 4;
const SLOT_SIZE = 32;
const SLOT_PADDING = 4;

let invX = 0;
let invY = 0;
let invW = 0;
let invH = 0;

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
// LOAD GUI + ITEM TEXTURES
// -----------------------------------------------------

async function loadGUITextures() {
    // Hotbar frame + selection
    hotbarTex = await tex("gui", "hotbar");
    selectTex = await tex("gui", "hotbar_selection");

    // Discover all item icons
    allItems = await loadAllItemNames();

    // Load all item textures
    for (const name of allItems) {
        const icon = await tex("item", name);
        if (icon) {
            itemTextures.set(name, icon);
        }
    }
}

// -----------------------------------------------------
// HOTBAR DRAWING
// -----------------------------------------------------

function drawHotbar() {
    const w = canvas.width;
    const h = canvas.height;

    const hotbarWidth = 182; // Minecraft hotbar width
    const hotbarHeight = 22;

    const x = (w - hotbarWidth) / 2;
    const y = h - hotbarHeight - 10;

    // Draw hotbar frame
    if (hotbarTex?.image) {
        ctx.drawImage(hotbarTex.image, x, y);
    }

    // Draw selected slot highlight
    if (selectTex?.image) {
        const slotX = x + selectedSlot * 20 - 1;
        ctx.drawImage(selectTex.image, slotX, y - 1);
    }

    // Draw item icons in hotbar
    for (let i = 0; i < 9; i++) {
        const item = hotbarItems[i];
        if (!item) continue;

        const tex = itemTextures.get(item);
        if (!tex?.image) continue;

        ctx.drawImage(tex.image, x + 3 + i * 20, y + 3, 16, 16);
    }
}

// -----------------------------------------------------
// INVENTORY DRAWING
// -----------------------------------------------------

function drawInventory() {
    if (!inventoryOpen) return;

    const w = canvas.width;
    const h = canvas.height;

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

    // Slots + items
    const startX = invX + 20;
    const startY = invY + 50;

    let index = 0;

    for (let row = 0; row < INV_ROWS; row++) {
        for (let col = 0; col < INV_COLS; col++) {
            const sx = startX + col * SLOT_SIZE;
            const sy = startY + row * SLOT_SIZE;

            // Slot background
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.fillRect(sx, sy, SLOT_SIZE - SLOT_PADDING, SLOT_SIZE - SLOT_PADDING);

            if (index >= allItems.length) {
                index++;
                continue;
            }

            const name = allItems[index];
            const tex = itemTextures.get(name);

            if (tex?.image) {
                ctx.drawImage(
                    tex.image,
                    sx + 4,
                    sy + 4,
                    SLOT_SIZE - 8 - SLOT_PADDING,
                    SLOT_SIZE - 8 - SLOT_PADDING
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
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if click is inside inventory area
    if (mx < invX || mx > invX + invW || my < invY || my > invY + invH) {
        return;
    }

    const startX = invX + 20;
    const startY = invY + 50;

    const localX = mx - startX;
    const localY = my - startY;

    if (localX < 0 || localY < 0) return;

    const col = Math.floor(localX / SLOT_SIZE);
    const row = Math.floor(localY / SLOT_SIZE);

    if (col < 0 || col >= INV_COLS || row < 0 || row >= INV_ROWS) return;

    const index = row * INV_COLS + col;
    if (index < 0 || index >= allItems.length) return;

    const pickedName = allItems[index];

    // Place into currently selected hotbar slot
    hotbarItems[selectedSlot] = pickedName;
});

// -----------------------------------------------------
// MAIN RENDER LOOP
// -----------------------------------------------------

function renderGUI() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Always draw hotbar
    drawHotbar();

    // Draw inventory overlay if open
    drawInventory();

    requestAnimationFrame(renderGUI);
}

// -----------------------------------------------------
// INITIALIZE
// -----------------------------------------------------

async function initGUI() {
    // Hook up input events
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

