// blockstateRegistry.js — loads blockstate JSON

export const blockstateRegistry = new Map();

export async function loadBlockstate(name) {
    const path = `assets/sixsevencraft/blockstates/${name}.json`;

    const res = await fetch(path);
    if (!res.ok) return null;

    const json = await res.json();
    blockstateRegistry.set(name, json);
    return json;
}

export function getBlockstate(name) {
    return blockstateRegistry.get(name) || null;
}


