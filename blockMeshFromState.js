// blockMeshFromState.js — resolves blockstate → model → face templates

import { stateRegistry } from './blocks.js';
import { loadModel, buildFaceTemplates } from './modelLoader.js';

export const blockModelCache = new Map();

export async function getBlockModelFaces(blockId, stateId) {
    const state = stateRegistry[stateId] || { properties: {} };

    const key = `${blockId}|${JSON.stringify(state.properties)}`;
    if (blockModelCache.has(key)) return blockModelCache.get(key);

    // Resolve blockstate → model name
    const modelName = resolveModelName(blockId, state.properties);

    const model = await loadModel(modelName);
    const faces = buildFaceTemplates(model);

    blockModelCache.set(key, faces);
    return faces;
}

// This is where you map blockId + properties → model name
// Expand this as you add more blocks
function resolveModelName(blockId, properties) {
    // Example:
    // logs: axis = x/y/z
    // slabs: type = top/bottom/double
    // stairs: facing, half, shape

    // For now, assume simple blocks:
    return `block/${blockId}`;
}


