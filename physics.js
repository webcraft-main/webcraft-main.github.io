import { blockMap, removeBlock, getBlock } from "./blocks.js";

/* ============================================================
   EXPLOSION
   ============================================================ */

export function explode(pos) {
    const radius = 4;

    for (const [key, entry] of blockMap.entries()) {
        const mesh = entry.mesh;
        const dist = mesh.position.distanceTo(pos);

        if (dist < radius) {
            const blockData = entry.block;

            // TNT chain reaction
            if (blockData.name === "tnt") {
                igniteTNT(
                    Math.round(mesh.position.x),
                    Math.round(mesh.position.y),
                    Math.round(mesh.position.z)
                );
            }

            const [x, y, z] = key.split(",").map(Number);
            removeBlock(x, y, z);
        }
    }
}

/* ============================================================
   TNT FUSE
   ============================================================ */

export function igniteTNT(x, y, z) {
    setTimeout(() => {
        explode({ x, y, z });
    }, 4000);
}

/* ============================================================
   PHYSICS LOOP (sand gravity)
   ============================================================ */

export function updatePhysics() {
    for (const [key, entry] of blockMap.entries()) {
        const mesh = entry.mesh;
        const blockData = entry.block;

        if (blockData.name === "sand") {
            const x = Math.round(mesh.position.x);
            const y = Math.round(mesh.position.y);
            const z = Math.round(mesh.position.z);

            const below = getBlock(x, y - 1, z);

            if (!below && y > -10) {
                mesh.position.y -= 0.1;
            } else {
                mesh.position.y = Math.round(mesh.position.y);
            }
        }
    }
}

