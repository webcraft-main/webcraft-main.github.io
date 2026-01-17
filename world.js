export const player = {
    pos: new THREE.Vector3(0, 2, 0),
    vel: new THREE.Vector3(),
    yaw: 0,
    onGround: false,
    health: 20,
    hunger: 20
};

// Store remote players
export const remotes = {};

// Create remote player mesh if missing
export function ensureRemote(id, scene) {
    if (remotes[id]) return;

    const geo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.set(0, 2, 0);
    scene.add(mesh);

    remotes[id] = {
        mesh,
        targetPos: new THREE.Vector3(),
        targetYaw: 0
    };
}

// Update remote player target position/rotation
export function updateRemoteTarget(id, data, scene) {
    ensureRemote(id, scene);

    const r = remotes[id];
    r.targetPos.set(data.x, data.y, data.z);
    r.targetYaw = data.ry;
}

// Remove remote player
export function removeRemote(id, scene) {
    if (!remotes[id]) return;

    scene.remove(remotes[id].mesh);
    delete remotes[id];
}

// Smoothly interpolate all remote players toward their target positions
export function stepRemoteInterpolation() {
    for (const id in remotes) {
        const r = remotes[id];

        // Smooth position interpolation
        r.mesh.position.lerp(r.targetPos, 0.2);

        // Smooth rotation interpolation
        r.mesh.rotation.y += (r.targetYaw - r.mesh.rotation.y) * 0.2;
    }
}

// Simple world time counter (ticks)
export let worldTime = {
    timeOfDay: 0,
    dayLength: 420,
    seasonTime: 0,
    seasonLength: 900,
    seasonIndex: 0
};


