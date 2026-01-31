// textureCollector.js — collects all texture names used by blockstates + models

export async function collectAllTextureNames(BlockstateDB) {
    const textures = new Set();

    for (const [blockName, stateDef] of BlockstateDB.byName) {

        // --- SAFETY: ensure variants exists and is iterable ---
        if (!stateDef || !stateDef.variants) {
            console.warn("Blockstate missing variants:", blockName, stateDef);
            continue;
        }

        let variantsArray = [];

        // Minecraft-style: variants is an OBJECT, not an array
        if (Array.isArray(stateDef.variants)) {
            variantsArray = stateDef.variants;
        } else if (typeof stateDef.variants === "object") {
            // Convert { "": {...}, "facing=north": {...} } into array of variant objects
            for (const key in stateDef.variants) {
                const v = stateDef.variants[key];
                if (v) variantsArray.push(v);
            }
        } else {
            console.warn("Invalid variants format:", blockName, stateDef.variants);
            continue;
        }

        // --- Iterate normalized variants ---
        for (const variant of variantsArray) {
            if (!variant || !variant.model) continue;

            const model = BlockstateDB.models.get(variant.model);
            if (!model) continue;

            // Collect textures from model.textures
            if (model.textures) {
                for (const key in model.textures) {
                    const tex = model.textures[key];
                    if (typeof tex === "string") {
                        textures.add(tex);
                    }
                }
            }

            // Collect textures from model.elements[*].faces[*].texture
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
    }

    return Array.from(textures);
}

