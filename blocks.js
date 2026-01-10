import { scene } from "./engine.js";

export const BlockRegistry = {};
export const BlockID = {};
export let nextBlockId = 1;

// Register a block type
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

// Create a mesh for a block
export function createBlockMesh(block, x, y, z) {
    const mat = new THREE.MeshStandardMaterial({
        color: block.color,
        transparent: block.transparent,
        opacity: block.transparent ? 0.6 : 1
    });

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), mat);
    mesh.position.set(x,y,z);
    mesh.userData.block = block;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
}

// World storage
export const blockMap = new Map();
function key(x,y,z) { return `${x},${y},${z}`; }

export function setBlock(x,y,z,blockName) {
    const b = BlockRegistry[blockName];
    if (!b) return;

    const k = key(x,y,z);
    if (blockMap.has(k)) removeBlock(x,y,z);

    const mesh = createBlockMesh(b, x,y,z);
    blockMap.set(k, { block: b, mesh });
}

export function removeBlock(x,y,z) {
    const k = key(x,y,z);
    const entry = blockMap.get(k);
    if (!entry) return;
    scene.remove(entry.mesh);
    blockMap.delete(k);
}

export function getBlock(x,y,z) {
    return blockMap.get(key(x,y,z));
}


export function removeBlock(b) {
    scene.remove(b);
    blocks.splice(blocks.indexOf(b), 1);
}
