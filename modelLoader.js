// modelLoader.js — loads model JSON, resolves parents, caches geometry

export const modelCache = new Map();

async function loadJSON(path) {
    const res = await fetch(path);
    return await res.json();
}

async function loadModelRecursive(path) {
    if (modelCache.has(path)) return modelCache.get(path);

    const json = await loadJSON(path);

    let parent = null;
    if (json.parent) {
        let parentPath;
        if (json.parent.includes(":")) {
            const [namespace, rest] = json.parent.split(":");
            parentPath = `assets/${namespace}/models/${rest}.json`;
        } else {
            parentPath = `assets/sixsevencraft/models/${json.parent}.json`;
        }
        parent = await loadModelRecursive(parentPath);
    }

    const model = {
        elements: json.elements || (parent ? parent.elements : []),
        textures: { ...(parent ? parent.textures : {}), ...(json.textures || {}) }
    };

    modelCache.set(path, model);
    return model;
}

export async function loadModel(modelName) {
    const path = `assets/sixsevencraft/models/${modelName}.json`;
    return await loadModelRecursive(path);
}

// Resolve #texture references
function resolveTexture(texName, textures) {
    if (!texName.startsWith("#")) return texName;
    const key = texName.slice(1);
    return textures[key];
}

// Convert model JSON into face templates for the mesher
export function buildFaceTemplates(model) {
    const faces = [];

    for (const elem of model.elements) {
        if (!elem.faces) continue;

        const { from, to } = elem;

        for (const [faceName, face] of Object.entries(elem.faces)) {
            const texName = resolveTexture(face.texture, model.textures);
            const uv = face.uv || [0, 0, 16, 16];

            faces.push({
                faceName,
                from,
                to,
                textureName: texName, // e.g. "sixsevencraft:block/stone"
                uv,
                cullface: face.cullface || null,
                rotation: face.rotation || 0
            });
        }
    }

    return faces;
}
