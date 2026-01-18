// main.js — game loop + chunk loading + meshing

import { scene, camera, renderer } from './engine.js';
import { World } from './world.js';
import { generateChunk } from './terrain.js';
import { meshChunk } from './chunkMesher.js';
import { loadAllBlockstates } from './loadAllBlockstates.js';
import { CHUNK_SIZE } from './config.js';

const world = new World();

// shared material for chunks (assign atlas later)
world.material = new THREE.MeshStandardMaterial({
    map: null,
    side: THREE.FrontSide
});

// load blockstates + models
await loadAllBlockstates();

let lastPlayerChunk = { cx: 0, cz: 0 };

function getPlayerChunk() {
    const cx = Math.floor(camera.position.x / CHUNK_SIZE);
    const cz = Math.floor(camera.position.z / CHUNK_SIZE);
    return { cx, cz };
}

async function ensureChunk(cx, cz) {
    if (!world.hasChunk(cx, cz)) {
        const chunk = world.ensureChunk(cx, cz);
        generateChunk(chunk);
        await meshChunk(world, chunk);
        scene.add(chunk.mesh);
    }
}

async function updateChunks() {
    const { cx, cz } = getPlayerChunk();

    if (cx === lastPlayerChunk.cx && cz === lastPlayerChunk.cz) return;
    lastPlayerChunk = { cx, cz };

    const radius = 4;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
            ensureChunk(cx + dx, cz + dz);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    updateChunks();

    for (const chunk of world.chunks.values()) {
        if (chunk.needsRemesh) {
            meshChunk(world, chunk).then(mesh => {
                if (!scene.children.includes(mesh)) {
                    scene.add(mesh);
                }
            });
        }
    }

    renderer.render(scene, camera);
}

animate();


animate();



