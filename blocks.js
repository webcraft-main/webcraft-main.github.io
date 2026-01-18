// blocks.js
// Block + state registry, driven by BlockstateDB

import { BlockstateDB, generateStateDefinitions } from "./blockstateDatabase.js";

export const blockNameToId = new Map();   // "stone" → 1
export const blockIdToName = [];          // [0:null, 1:"stone", ...]
export const blocks = [];                 // blockId → { id, name, states: [stateId,...], defaultStateId }

export const stateIdToDef = [];           // stateId → { id, blockId, blockName, properties, model, key }
export const stateKeyToId = new Map();    // "stone|axis=y" → stateId

let nextBlockId = 1;
let nextStateId = 1;

// -----------------------------
// BLOCK REGISTRATION
// -----------------------------

export function registerBlock(name) {
    if (blockNameToId.has(name)) return blockNameToId.get(name);

    const id = nextBlockId++;
    blockNameToId.set(name, id);
    blockIdToName[id] = name;

    blocks[id] = {
        id,
        name,
        states: [],
        defaultStateId: 0,
    };

    return id;
}

// -----------------------------
// STATE GENERATION FROM BLOCKSTATE DB
// -----------------------------

export function buildStatesFromBlockstates() {
    const defs = generateStateDefinitions();

    for (const def of defs) {
        const blockId = blockNameToId.get(def.blockName);
        if (!blockId) {
            console.warn("[blocks] State for unknown block:", def.blockName);
            continue;
        }

        const id = nextStateId++;

        const key = makeStateKey(def.blockName, def.properties);

        const state = {
            id,
            blockId,
            blockName: def.blockName,
            properties: def.properties,
            model: def.model,
            key: def.key,
            multipart: def.multipart || null,
        };

        stateIdToDef[id] = state;
        stateKeyToId.set(key, id);

        blocks[blockId].states.push(id);

        // default: first state becomes default
        if (!blocks[blockId].defaultStateId) {
            blocks[blockId].defaultStateId = id;
        }
    }
}

// -----------------------------
// HELPERS
// -----------------------------

function makeStateKey(blockName, props) {
    const entries = Object.entries(props || {}).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return blockName;
    const suffix = entries.map(([k, v]) => `${k}=${v}`).join(",");
    return `${blockName}|${suffix}`;
}

/**
 * Get stateId for a block + properties.
 * If no exact match, returns the block's default state.
 */
export function getStateId(blockId, properties = {}) {
    const blockName = blockIdToName[blockId];
    const key = makeStateKey(blockName, properties);
    const id = stateKeyToId.get(key);
    if (id) return id;
    return blocks[blockId].defaultStateId;
}

/**
 * Get state definition by id.
 */
export function getStateDef(stateId) {
    return stateIdToDef[stateId] || null;
}



