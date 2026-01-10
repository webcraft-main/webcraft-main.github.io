import { scene } from "./engine.js";

export const mats = [
    new THREE.MeshStandardMaterial({color: 0x55aa55}),
    new THREE.MeshStandardMaterial({color: 0x808080}),
    new THREE.MeshStandardMaterial({color: 0x4b2d13}),
    new THREE.MeshStandardMaterial({color: 0x228b22}),
    new THREE.MeshStandardMaterial({color: 0x00aaff, transparent: true, opacity: 0.6}),
    new THREE.MeshStandardMaterial({color: 0xff4500}),
    new THREE.MeshStandardMaterial({color: 0xedc9af}),
    new THREE.MeshStandardMaterial({color: 0xff0000})
];

export const blocks = [];

export function addBlock(x, y, z, t) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), mats[t]);
    b.position.set(Math.round(x), Math.round(y), Math.round(z));
    b.userData.type = t;
    b.castShadow = true;
    b.receiveShadow = true;
    scene.add(b);
    blocks.push(b);
    return b;
}

export const BlockType = {
    GRASS: 0,
    STONE: 1,
    WOOD: 2,
    LEAVES: 3,
    WATER: 4,
    LAVA: 5,
    SAND: 6,
    TNT: 7,
    SNOW: 8,
    DEEPSLATE: 9
};

export function removeBlock(b) {
    scene.remove(b);
    blocks.splice(blocks.indexOf(b), 1);
}
