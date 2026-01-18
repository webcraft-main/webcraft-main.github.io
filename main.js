// main.js — game loop + chunk loading + meshing

import * as THREE from 'three';
import { World } from './world.js';
import { generateChunk } from './terrain.js';
import { meshChunk } from './chunkMesher.js';
import { loadAllBlockstates } from './loadAllBlockstates.js';

import { CHUNK_SIZE } from './config.js';

const world = new World();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 80, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Material shared by all chunks
world.material = new THREE.MeshStandardMaterial({
    map: null, // texture atlas assigned later
    side: THREE.FrontSide
});

// Load blockstates + models
await loadAllBlockstates();

// Player chunk tracking
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

    // Only update when player crosses chunk boundary
    if (cx === lastPlayerChunk.cx && cz === lastPlayerChunk.cz) return;
    lastPlayerChunk = { cx, cz };

    const radius = 4; // load 9x9 chunks around player

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
            ensureChunk(cx + dx, cz + dz);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    updateChunks();

    // Remesh chunks that need it
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



