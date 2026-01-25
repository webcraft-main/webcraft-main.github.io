// input.js — unified gameplay + GUI input

import { camera } from "./engine.js";
import { world } from "./world.js";   // correct source of setBlock/removeBlock
import { getBiomeAt } from "./worldgen.js"; // biome lookup
import { raycastVoxel } from "./raycast.js"; // voxel ray-marcher

export const keys = {};
export let selectedSlot = 0;

// GUI callbacks
let inventoryToggleCallback = null;
let hotbarSelectCallback = null;

/* ============================
   PUBLIC REGISTRATION FUNCTIONS
   ============================ */
export function registerInventoryToggle(fn) {
    inventoryToggleCallback = fn;
}

export function registerHotbarSelect(fn) {
    hotbarSelectCallback = fn;
}

/* ============================
   KEY DOWN
   ============================ */
document.addEventListener("keydown", e => {
    keys[e.code] = true;

    // HOTBAR SELECTION (1–9)
    if (e.key >= "1" && e.key <= "9") {
        selectedSlot = parseInt(e.key) - 1;

        if (hotbarSelectCallback) {
            hotbarSelectCallback(selectedSlot);
        }

        e.preventDefault();
    }

    // INVENTORY TOGGLE (E)
    if (e.key === "e" || e.key === "E") {
        if (inventoryToggleCallback) {
            inventoryToggleCallback();
        }
        e.preventDefault();
    }
});

/* ============================
   KEY UP
   ============================ */
document.addEventListener("keyup", e => {
    keys[e.code] = false;
});

/* ============================
   MOUSE CLICK (BREAK / PLACE)
   ============================ */
window.addEventListener("mousedown", e => {
    // GUI handles clicks when inventory is open
    if (window.inventoryOpen === true) return;

    // Acquire pointer lock
    if (!document.pointerLockElement) {
        document.body.requestPointerLock();
        return;
    }

    // Ray-march into voxel world
    const hit = raycastVoxel(camera, world);

    if (!hit) return;

    const { x, y, z, nx, ny, nz } = hit;

    if (e.button === 0) {
        // LEFT CLICK = BREAK
        world.setBlock(x, y, z, 0); // 0 = air

    } else if (e.button === 2) {
        // RIGHT CLICK = PLACE
        const px = x + nx;
        const py = y + ny;
        const pz = z + nz;

        const biome = getBiomeAt(px, pz);

        // VOLCANIC BIOME SPECIAL RULE
        if (selectedSlot === 1 && biome === "VOLCANIC") {
            world.setBlock(px, py, pz, world.getBlockId("lava"));
        } else {
            const blockNames = [
                "grass", "stone", "oak_log", "oak_leaves",
                "water", "lava", "sand", "tnt"
            ];

            const chosen = blockNames[selectedSlot] || "stone";
            world.setBlock(px, py, pz, world.getBlockId(chosen));
        }
    }
});

/* ============================
   MOUSE LOOK
   ============================ */
document.addEventListener("mousemove", e => {
    if (document.pointerLockElement) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});



