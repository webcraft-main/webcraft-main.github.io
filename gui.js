import { tex, loadAllItemNames } from "./textureLoader.js";
import { registerInventoryToggle, registerHotbarSelect, selectedSlot as inputSelectedSlot } from "./input.js";

const canvas = document.getElementById("guiCanvas");
const ctx = canvas.getContext("2d");

let hotbarTex = null;
let selectTex = null;
let creativeItemsTex = null;
let creativeSearchTex = null;
let creativeInventoryTex = null;

let itemTextures = new Map();
let allItems = [];

let hotbarItems = new Array(9).fill(null);
let armorSlots = [null, null, null, null];
let craftingGrid = [null, null, null, null];
let craftingResult = null;

let inventoryOpen = false;
window.inventoryOpen = false;

let selectedTab = "items";
let scrollOffset = 0;
let maxScroll = 0;
let searchText = "";

const SLOT_SIZE = 18;
const SLOT_PADDING = 1;
const VISIBLE_ROWS = 5;
const COLS = 9;

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

async function loadGUITextures() {
    hotbarTex = await tex("gui", "hotbar");
    selectTex = await tex("gui", "hotbar_selection");
    creativeItemsTex = await tex("gui/container/creative_inventory", "tab_items");
    creativeSearchTex = await tex("gui/container/creative_inventory", "tab_item_search");
    creativeInventoryTex = await tex("gui/container/creative_inventory", "tab_inventory");

    allItems = await loadAllItemNames();
    maxScroll = Math.max(0, Math.ceil(allItems.length / COLS) - VISIBLE_ROWS);

    for (const name of allItems) {
        const icon = await tex("item", name);
        if (icon) itemTextures.set(name, icon);
    }
}

function drawHotbar() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    const hotbarWidth = hotbarTex?.image?.width || 182;
    const hotbarHeight = hotbarTex?.image?.height || 22;

    const x = (w - hotbarWidth) / 2;
    const y = h - hotbarHeight - 10;

    if (hotbarTex?.image) ctx.drawImage(hotbarTex.image, x, y);

    const SLOT_W = hotbarWidth / 9;

    if (selectTex?.image) {
        const slotX = x + inputSelectedSlot * SLOT_W;
        ctx.drawImage(selectTex.image, slotX, y - 1);
    }

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

function drawInventory() {
    if (!inventoryOpen) return;

    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    const leftTex = selectedTab === "search" ? creativeSearchTex : creativeItemsTex;
    const leftImg = leftTex.image;
    const rightImg = creativeInventoryTex.image;

    const leftW = leftImg.width;
    const leftH = leftImg.height;
    const rightW = rightImg.width;
    const rightH = rightImg.height;

    const totalW = leftW + rightW;
    const totalH = Math.max(leftH, rightH);

    const baseX = (w - totalW) / 2;
    const baseY = (h - totalH) / 2;

    ctx.drawImage(leftImg, baseX, baseY);
    ctx.drawImage(rightImg, baseX + leftW, baseY);

    const gridX = baseX + 9;
    const gridY = baseY + 18;

    let items = allItems;
    if (selectedTab === "search" && searchText.length > 0) {
        items = allItems.filter(name => name.includes(searchText.toLowerCase()));
    }

    maxScroll = Math.max(0, Math.ceil(items.length / COLS) - VISIBLE_ROWS);
    let index = scrollOffset * COLS;

    for (let row = 0; row < VISIBLE_ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (index >= items.length) break;

            const name = items[index];
            const tex = itemTextures.get(name);
            const x = gridX + col * SLOT_SIZE;
            const y = gridY + row * SLOT_SIZE;

            if (tex?.image) {
                ctx.drawImage(tex.image, x + SLOT_PADDING, y + SLOT_PADDING, 16, 16);
            }

            index++;
        }
    }

    const barX = baseX + leftW - 12;
    const barY = gridY;
    const barH = VISIBLE_ROWS * SLOT_SIZE;
    const sliderH = Math.max(20, barH * (VISIBLE_ROWS / (maxScroll + VISIBLE_ROWS)));
    const sliderY = barY + (scrollOffset / maxScroll) * (barH - sliderH);

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(barX, barY, 8, barH);
    ctx.fillStyle = "rgba(200,200,200,0.8)";
    ctx.fillRect(barX, sliderY, 8, sliderH);

    const tabY = baseY - 28;
    function drawTab(x, label, key) {
        const active = selectedTab === key;
        ctx.fillStyle = active ? "#ffffff" : "#888888";
        ctx.fillRect(x, tabY, 60, 24);
        ctx.fillStyle = active ? "#000000" : "#222222";
        ctx.font = "14px monospace";
        ctx.fillText(label, x + 8, tabY + 16);
    }

    drawTab(baseX + 0, "Items", "items");
    drawTab(baseX + 70, "Search", "search");
    drawTab(baseX + 140, "Inv", "inventory");

    if (selectedTab === "search") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(gridX, baseY + 4, 162, 14);
        ctx.fillStyle = "#000000";
        ctx.font = "12px monospace";
        ctx.fillText(searchText, gridX + 4, baseY + 15);
    }

    const rightX = baseX + leftW;
    const rightY = baseY;

    for (let i = 0; i < 4; i++) {
        const sx = rightX + 7;
        const sy = rightY + 7 + i * 20;
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.strokeRect(sx, sy, SLOT_SIZE, SLOT_SIZE);
        const item = armorSlots[i];
        const tex = itemTextures.get(item);
        if (tex?.image) ctx.drawImage(tex.image, sx + 1, sy + 1, 16, 16);
    }

    for (let i = 0; i < 4; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const sx = rightX + 60 + col * 20;
        const sy = rightY + 17 + row * 20;
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.strokeRect(sx, sy, SLOT_SIZE, SLOT_SIZE);
        const item = craftingGrid[i];
        const tex = itemTextures.get(item);
        if (tex?.image) {
            ctx.drawImage(tex.image, resultX + 1, resultY + 1, 16, 16);
        }
    }
} // end of drawInventory()


// -----------------------------------------------------
// RENDER LOOP
// -----------------------------------------------------
function renderGUI() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawHotbar();
    drawInventory();
    requestAnimationFrame(renderGUI);
}


// -----------------------------------------------------
// INIT
// -----------------------------------------------------
async function initGUI() {
    registerInventoryToggle(() => {
        inventoryOpen = !inventoryOpen;
        window.inventoryOpen = inventoryOpen;
    });

    registerHotbarSelect((idx) => {
        // hotbar selection already synced via inputSelectedSlot
    });

    await loadGUITextures();
    renderGUI();
}

initGUI();
