// input.js — merged gameplay + GUI input

import { camera } from "./engine.js";
import { blockMap, setBlock, removeBlock } from "./blockRenderer.js";
import { getBiomeAt } from "./world.js";

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

        document.querySelectorAll('.slot').forEach((s, i) =>
            s.className = (i === selectedSlot) ? 'slot active' : 'slot'
        );
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
    // If inventory is open, GUI handles clicks
    if (window.inventoryOpen === true) return;

    if (!document.pointerLockElement) {
        document.body.requestPointerLock();
        return;
    }

    const ray = new THREE.Raycaster();
    ray.setFromCamera({ x: 0, y: 0 }, camera);
    const hits = ray.intersectObjects(
        Array.from(blockMap.values()).map(e => e.mesh)
    );

    if (hits.length === 0) return;

    const obj = hits[0].object;

    if (e.button === 0) {
        // LEFT CLICK = BREAK
        removeBlock(
            Math.round(obj.position.x),
            Math.round(obj.position.y),
            Math.round(obj.position.z)
        );

    } else {
        // RIGHT CLICK = PLACE
        const p = obj.position.clone().add(hits[0].face.normal);
        const x = Math.round(p.x);
        const y = Math.round(p.y);
        const z = Math.round(p.z);

        const biome = getBiomeAt(x, z);

        // VOLCANIC BIOME SPECIAL RULE
        if (selectedSlot === 1 && biome === "VOLCANIC") {
            setBlock(x, y, z, "lava");
        } else {
            const blockNames = [
                "grass", "stone", "oak_log", "oak_leaves",
                "water", "lava", "sand", "tnt"
            ];

            const chosen = blockNames[selectedSlot] || "stone";
            setBlock(x, y, z, chosen);
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


