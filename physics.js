import { blocks, removeBlock } from "./blocks.js";

export function explode(pos) {
    const radius = 4;
    for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].position.distanceTo(pos) < radius) {
            removeBlock(blocks[i]);
        }
    }
}

export function updatePhysics() {
    blocks.forEach(b => {
        if (b.userData.type === 6) {
            const below = blocks.find(o =>
                o.position.x === b.position.x &&
                o.position.y === b.position.y - 1 &&
                o.position.z === b.position.z
            );
            if (!below && b.position.y > -10) b.position.y -= 0.1;
            else b.position.y = Math.round(b.position.y);
        }
    });
}
