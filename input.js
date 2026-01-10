import { camera } from "./engine.js";
import { blocks, addBlock, removeBlock, BlockType } from "./blocks.js";
import { explode } from "./physics.js";

export const keys = {};
export let selectedSlot = 0;

document.addEventListener("keydown", e => {
    keys[e.code] = true;

    if (e.key >= 1 && e.key <= 8) {
        selectedSlot = e.key - 1;
        document.querySelectorAll('.slot').forEach((s,i) =>
            s.className = (i === selectedSlot) ? 'slot active' : 'slot'
        );
    }
});

if (selectedSlot === BlockType.STONE && biomeAt(camera.position) === "VOLCANIC") {
    addBlock(p.x, p.y, p.z, BlockType.LAVA);
}

document.addEventListener("keyup", e => {
    keys[e.code] = false;
});

window.addEventListener("mousedown", e => {
    if (!document.pointerLockElement) {
        document.body.requestPointerLock();
        return;
    }

    const ray = new THREE.Raycaster();
    ray.setFromCamera({x:0, y:0}, camera);
    const hits = ray.intersectObjects(blocks);

    if (hits.length > 0) {
        const obj = hits[0].object;

        if (e.button === 0) {
            if (obj.userData.type === BlockType.TNT) explode(obj.position);
            removeBlock(obj);
        } else {
            const p = obj.position.clone().add(hits[0].face.normal);
            addBlock(p.x, p.y, p.z, selectedSlot);
        }
    }
});

document.addEventListener("mousemove", e => {
    if (document.pointerLockElement) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});
