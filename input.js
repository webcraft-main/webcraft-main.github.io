import { camera } from "./engine.js";
import { blocks, setBlock, removeBlock, getBlock } from "./blocks.js";
import { explode } from "./physics.js";
import { getBiomeAt } from "./terrain.js"; // you must export this

export const keys = {};
export let selectedSlot = 0;

/* ============================
   HOTBAR SELECTION
   ============================ */
document.addEventListener("keydown", e => {
    keys[e.code] = true;

    if (e.key >= 1 && e.key <= 8) {
        selectedSlot = e.key - 1;
        document.querySelectorAll('.slot').forEach((s,i) =>
            s.className = (i === selectedSlot) ? 'slot active' : 'slot'
        );
    }
});

document.addEventListener("keyup", e => {
    keys[e.code] = false;
});

/* ============================
   MOUSE CLICK (BREAK / PLACE)
   ============================ */
window.addEventListener("mousedown", e => {
    if (!document.pointerLockElement) {
        document.body.requestPointerLock();
        return;
    }

    const ray = new THREE.Raycaster();
    ray.setFromCamera({x:0, y:0}, camera);
    const hits = ray.intersectObjects(blocks);

    if (hits.length === 0) return;

    const obj = hits[0].object;

    if (e.button === 0) {
        // LEFT CLICK = BREAK
        const block = obj.userData.block;

        if (block.name === "tnt") {
            explode(obj.position);
        }

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

        // VOLCANIC BIOME SPECIAL RULE:
        // placing cobblestone (stone) ignites lava
        if (selectedSlot === 1 && biome === "VOLCANIC") {
            setBlock(x, y, z, "lava");
        } else {
            const blockNames = [
                "grass", "stone", "oak_log", "oak_leaves",
                "water", "lava", "sand", "tnt"
            ];
            setBlock(x, y, z, blockNames[selectedSlot]);
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

