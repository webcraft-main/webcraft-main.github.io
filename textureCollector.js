// textureCollector.js — gathers all texture names used by all block models

export async function collectAllTextureNames(BlockstateDB) {
    const textures = new Set();

    for (const [blockName, stateDef] of BlockstateDB.byName) {
        if (!stateDef) continue;

        // -------------------------------------------------
        // 1. VARIANTS
        // -------------------------------------------------
        if (stateDef.variants) {
            let variantsArray = [];

            if (Array.isArray(stateDef.variants)) {
                variantsArray = stateDef.variants;
            } else if (typeof stateDef.variants === "object") {
                for (const key in stateDef.variants) {
                    const v = stateDef.variants[key];
                    if (v) variantsArray.push(v);
                }
            }

            for (const variant of variantsArray) {
                if (!variant || !variant.model) continue;

                const model = BlockstateDB.models?.get?.(variant.model);
                if (!model) continue;

                collectTexturesFromModel(model, textures);
            }
        }

        // -------------------------------------------------
        // 2. MULTIPART
        // -------------------------------------------------
        if (stateDef.multipart) {
            for (const part of stateDef.multipart) {
                if (!part.apply) continue;

                // apply.model
                if (part.apply.model) {
                    const model = BlockstateDB.models?.get?.(part.apply.model);
                    if (model) collectTexturesFromModel(model, textures);
                }

                // apply.models[]
                if (Array.isArray(part.apply.models)) {
                    for (const m of part.apply.models) {
                        const model = BlockstateDB.models?.get?.(m.model);
                        if (model) collectTexturesFromModel(model, textures);
                    }
                }
            }
        }
    }

    return Array.from(textures);
}


// ---------------------------------------------------------
// Helper: extract textures from a model
// ---------------------------------------------------------
function collectTexturesFromModel(model, textures) {

    // model.textures: { "all": "block/stone", ... }
    if (model.textures) {
        for (const key in model.textures) {
            const tex = model.textures[key];
            if (typeof tex === "string") {
                textures.add(tex);
            }
        }
    }

    // model.elements[*].faces[*].texture
    if (model.elements) {
        for (const elem of model.elements) {
            if (!elem.faces) continue;

            for (const faceName in elem.faces) {
                const face = elem.faces[faceName];
                if (face.texture) {
                    textures.add(face.texture);
                }
            }
        }
    }
}
