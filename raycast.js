// raycast.js — voxel ray-marcher for block targeting

const MAX_DISTANCE = 6;   // same as Minecraft reach
const STEP = 0.1;         // ray step size

export function raycastVoxel(camera, world) {
    // Camera world position
    const origin = camera.getWorldPosition(new THREE.Vector3());

    // Forward direction
    const dir = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .normalize();

    let x = origin.x;
    let y = origin.y;
    let z = origin.z;

    for (let d = 0; d < MAX_DISTANCE / STEP; d++) {
        x += dir.x * STEP;
        y += dir.y * STEP;
        z += dir.z * STEP;

        const bx = Math.floor(x);
        const by = Math.floor(y);
        const bz = Math.floor(z);

        const blockId = world.getBlock(bx, by, bz);

        if (blockId !== 0) {
            // Compute face normal by checking which axis changed most
            const fx = x - bx;
            const fy = y - by;
            const fz = z - bz;

            let nx = 0, ny = 0, nz = 0;

            const dx = Math.abs(fx - 0.5);
            const dy = Math.abs(fy - 0.5);
            const dz = Math.abs(fz - 0.5);

            if (dx > dy && dx > dz) nx = fx > 0.5 ? 1 : -1;
            else if (dy > dx && dy > dz) ny = fy > 0.5 ? 1 : -1;
            else nz = fz > 0.5 ? 1 : -1;

            return {
                x: bx,
                y: by,
                z: bz,
                nx,
                ny,
                nz,
                blockId
            };
        }
    }

    return null;
}
