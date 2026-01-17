import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158.0/+esm";
import { loadTexture } from "./textureLoader.js";

// Adjust base paths if needed
const MODEL_BASE = "/assets/sixsevencraft/models/";
const TEXTURE_BASE = "/assets/sixsevencraft/textures/";

export async function loadBlockModel(modelName) {
    // modelName like "block/oak_fence"
    const path = MODEL_BASE + modelName + ".json";
    const json = await fetch(path).then(r => r.json());

    // Simple: use first texture entry
    const texKey = Object.values(json.textures)[0]; // e.g. "minecraft:block/oak_planks"
    const texPath = TEXTURE_BASE + texKey.replace("minecraft:", "") + ".png";

    const material = new THREE.MeshBasicMaterial({ map: loadTexture(texPath) });
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    return new THREE.Mesh(geometry, material);
}
