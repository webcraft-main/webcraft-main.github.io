// blocks.js — numeric block registry + state registry

export const blockRegistry = [];
export const blockNameToId = new Map();

export const stateRegistry = [];          // stateID → { blockId, properties }
export const stateLookup = new Map();     // "blockId|prop1=val,prop2=val" → stateID

let nextBlockId = 1; // 0 = air
let nextStateId = 1; // 0 = default state

export function registerBlock(name, baseProperties = {}) {
    const id = nextBlockId++;
    blockNameToId.set(name, id);

    blockRegistry[id] = {
        id,
        name,
        baseProperties
    };

    // Register default state
    const key = `${id}|`;
    stateLookup.set(key, 0);
    stateRegistry[0] = { blockId: id, properties: {} };

    return id;
}

export function registerBlockState(blockId, properties) {
    const key = `${blockId}|` + Object.entries(properties)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');

    if (stateLookup.has(key)) return stateLookup.get(key);

    const stateId = nextStateId++;
    stateLookup.set(key, stateId);
    stateRegistry[stateId] = { blockId, properties };

    return stateId;
}

export function getState(blockId, properties) {
    const key = `${blockId}|` + Object.entries(properties)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');

    return stateLookup.get(key) ?? 0;
}


export function getBlock(x, y, z) {
    return blockMap.get(key(x, y, z));
}


