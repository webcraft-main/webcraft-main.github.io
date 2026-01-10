import { blocks, removeBlock, getBlock } from "./blocks.js";

/* ============================================================
   EXPLOSION
   ============================================================ */

export function explode(pos) {
    const radius = 4;

    for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        const dist = b.position.distanceTo(pos);

        if (dist < radius) {
            const blockData = b.userData.block;

            // TNT chain reaction
            if (blockData && blockData.name === "tnt") {
                igniteTNT(
                    Math.round(b.position.x),
                    Math.round(b.position.y),
                    Math.round(b.position.z)
                );
            }

            removeBlock(b.position.x, b.position.y, b.position.z);
        }
    }
}

/* ============================================================
   TNT FUSE
   ============================================================ */

export function igniteTNT(x, y, z) {
    setTimeout(() => {
        explode({ x, y, z });
    }, 4000); // 4 second fuse
}

/* ============================================================
   PHYSICS LOOP (sand gravity)
   ============================================================ */

export function updatePhysics() {
    blocks.forEach(b => {
        const blockData = b.userData.block;

        // Sand gravity
        if (blockData && blockData.name === "sand") {
            const x = Math.round(b.position.x);
            const y = Math.round(b.position.y);
            const z = Math.round(b.position.z);

            const below = getBlock(x, y - 1, z);

            if (!below && y > -10) {
                b.position.y -= 0.1;
            } else {
                b.position.y = Math.round(b.position.y);
            }
        }
    });
}
