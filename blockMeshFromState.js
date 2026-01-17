import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158.0/+esm";
import { getBlockstate } from "./blockstateRegistry.js";
import { loadBlockModel } from "./modelLoader.js";

export async function createMeshForBlock(blockId, state = {}) {
    const bs = getBlockstate(blockId);

    // No blockstate JSON → fallback to model with same name
    if (!bs) {
        return loadBlockModel("block/" + blockId);
    }

    // MULTIPART
    if (bs.multipart) {
        const group = new THREE.Group();

        for (const part of bs.multipart) {
            const when = part.when || {};
            let matches = true;

            for (const key in when) {
                if (String(state[key]) !== String(when[key])) {
                    matches = false;
                    break;
                }
            }

            if (matches) {
                const modelName = part.apply.model.replace("minecraft:", ""); // "block/oak_fence_side"
                const mesh = await loadBlockModel(modelName);
                group.add(mesh);
            }
        }

        return group;
    }

    // VARIANTS
    if (bs.variants) {
        const entries = Object.entries(state);
        const key = entries.map(([k, v]) => `${k}=${v}`).join(",");

        const variant = bs.variants[key] || bs.variants[""];
        const modelName = variant.model.replace("minecraft:", ""); // "block/grass_block"
        return loadBlockModel(modelName);
    }

    return loadBlockModel("block/" + blockId);
}

