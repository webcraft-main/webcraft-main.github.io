// textureCollector.js — collects all texture names used by blockstates + models

export async function collectAllTextureNames(BlockstateDB) {
    const textures = new Set();

    for (const [blockName, stateDef] of BlockstateDB.byName) {
        for (const variant of stateDef.variants) {
            if (!variant.model) continue;

            const model = BlockstateDB.models.get(variant.model);
            if (!model) continue;

            // Collect textures from model
            if (model.textures) {
                for (const key in model.textures) {
                    const tex = model.textures[key];
                    if (typeof tex === "string") {
                        textures.add(tex);
                    }
                }
            }

            // Collect textures from model elements
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
