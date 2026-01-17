import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158.0/+esm";
import { scene } from "./engine.js";
import { createMeshForBlock } from "./blockMeshFromState.js";

export const BlockRegistry = {};
export const BlockID = {};
export let nextBlockId = 1;

// Optional registry for custom/simple blocks
export function registerBlock(name, data) {
    BlockRegistry[name] = {
        id: nextBlockId,
        name,
        solid: data.solid ?? true,
        transparent: data.transparent ?? false,
        fluid: data.fluid ?? false,
        gravity: data.gravity ?? false,
        light: data.light ?? 0,
        material: data.material,
        drops: data.drops ?? name,
        color: data.color ?? 0xffffff,
        mesh: null
    };
    BlockID[nextBlockId] = BlockRegistry[name];
    nextBlockId++;
}

// Legacy simple cube mesh (still usable for custom blocks)
export function createBlockMesh(block, x, y, z) {
    const mat = new THREE.MeshStandardMaterial({
        color: block.color,
        transparent: block.transparent,
        opacity: block.transparent ? 0.6 : 1
    });

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
    mesh.position.set(x, y, z);
    mesh.userData.block = block;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

// World storage
export const blockMap = new Map();
function key(x, y, z) { return `${x},${y},${z}`; }

// NEW: setBlock now accepts either "name" or { id, state }
export function setBlock(x, y, z, blockData) {
    let id, state;

    if (typeof blockData === "string") {
        id = blockData;
        state = {};
    } else if (blockData && typeof blockData === "object") {
        id = blockData.id;
        state = blockData.state || {};
    } else {
        return;
    }

    const k = key(x, y, z);
    if (blockMap.has(k)) removeBlock(x, y, z);

    const entry = { id, state, mesh: null };
    blockMap.set(k, entry);

    // Use blockstate/model system for mesh
    createMeshForBlock(id, state).then(mesh => {
        if (!blockMap.has(k)) {
            // Block was removed before mesh finished loading
            if (mesh) scene.remove(mesh);
            return;
        }
        if (!mesh) return;
        mesh.position.set(x, y, z);
        scene.add(mesh);
        entry.mesh = mesh;
    });
}

export function removeBlock(x, y, z) {
    const k = key(x, y, z);
    const entry = blockMap.get(k);
    if (!entry) return;
    if (entry.mesh) scene.remove(entry.mesh);
    blockMap.delete(k);
}

export function getBlock(x, y, z) {
    return blockMap.get(key(x, y, z));
}


