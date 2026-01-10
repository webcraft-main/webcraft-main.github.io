import { blockMap, setBlock } from "./blocks.js";

const STORAGE_KEY = "sixsevencraft-world";

export function saveWorld() {
    const data = [];

    for (const [key, entry] of blockMap.entries()) {
        const [x, y, z] = key.split(",").map(Number);
        data.push({
            x, y, z,
            name: entry.block.name
        });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("World saved:", data.length, "blocks");
}

export function loadWorld() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        data.forEach(b => {
            setBlock(b.x, b.y, b.z, b.name);
        });
        console.log("World loaded:", data.length, "blocks");
    } catch (e) {
        console.warn("Failed to load world:", e);
    }
}
