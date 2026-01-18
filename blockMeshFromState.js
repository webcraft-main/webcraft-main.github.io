// blockMeshFromState.js

const THREE = window.THREE;

import { getStateDef } from "./blocks.js";
import { resolveModelForBlock } from "./blockstateDatabase.js";
import { loadModel } from "./modelLoader.js"; // assuming you have this

const modelCache = new Map(); // modelName → parsed model data

export async function buildBlockMeshFromState(stateId, x, y, z, targetGeometry) {
    const state = getStateDef(stateId);
    if (!state) return;

    const modelName = state.model || resolveModelForBlock(state.blockName, state.properties);
    if (!modelName) return;

    const model = await getModel(modelName);
    if (!model) return;

    // Here you plug into your existing greedy mesher / face builder.
    // For now, assume `addModelToGeometry(model, x, y, z, targetGeometry)` exists.
    addModelToGeometry(model, x, y, z, targetGeometry);
}

async function getModel(modelName) {
    if (modelCache.has(modelName)) return modelCache.get(modelName);
    const model = await loadModel(modelName);
    modelCache.set(modelName, model);
    return model;
}

// Stub: you already have something like this in your mesher.
function addModelToGeometry(model, x, y, z, targetGeometry) {
    // Use model.elements, faces, UVs, etc. to push into targetGeometry.
}




