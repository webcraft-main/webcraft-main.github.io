// blockMeshFromState.js — resolves blockstate → model → face templates

import { stateRegistry, blockRegistry } from './blocks.js';
import { loadModel, buildFaceTemplates } from './modelLoader.js';

// Cache: blockId|stateId → face templates
export const blockModelCache = new Map();

/**
 * Returns the face templates for a block given its blockId + stateId.
 * This is what the greedy mesher consumes.
 */
export async function getBlockModelFaces(blockId, stateId) {
    const cacheKey = `${blockId}|${stateId}`;
    if (blockModelCache.has(cacheKey)) {
        return blockModelCache.get(cacheKey);
    }

    const state = stateRegistry[stateId] || { properties: {} };
    const modelName = resolveModelName(blockId, state.properties);

    const model = await loadModel(modelName);
    const faces = buildFaceTemplates(model);

    blockModelCache.set(cacheKey, faces);
    return faces;
}

/**
 * Maps blockId + blockstate properties → correct model name.
 * This is where blockstate logic becomes real rendering.
 */
export function resolveModelName(blockId, properties) {
    const name = blockRegistry[blockId].name;

    // -----------------------------
    // GRASS BLOCK
    // -----------------------------
    if (name === "grass_block") {
        if (properties.snowy === "true") return "block/grass_block_snow";
        return "block/grass_block";
    }

    // -----------------------------
    // LOGS (axis = x/y/z)
    // -----------------------------
    if (name.endsWith("_log")) {
        const axis = properties.axis || "y";
        if (axis === "x" || axis === "z") {
            return `block/${name}_horizontal`;
        }
        return `block/${name}`;
    }

    // -----------------------------
    // LEAVES
    // -----------------------------
    if (name.endsWith("_leaves")) {
        return `block/${name}`;
    }

    // -----------------------------
    // PLANKS, STONE, DIRT, SIMPLE CUBES
    // -----------------------------
    return `block/${name}`;
}



