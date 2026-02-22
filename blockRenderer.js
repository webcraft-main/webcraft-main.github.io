// blockRenderer.js — unified blockstate → model → face pipeline

const THREE = window.THREE;

// -----------------------------------------------------
// INTERNAL DATABASES (NOW EXPORTED)
// -----------------------------------------------------

export const BlockstateDB = {
    byName: new Map(),
    allModels: new Set(),
    models: new Map(),      // <-- added
};

export const blockNameToId = new Map();
export const blockIdToName = [];
export const stateIdToDef = [];
export const stateKeyToId = new Map();
export const blocks = [];

export let nextBlockId = 1;
export let nextStateId = 1;

// -----------------------------------------------------
// BLOCK REGISTRATION
// -----------------------------------------------------

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

// -----------------------------------------------------
// BLOCKSTATE LOADING
// -----------------------------------------------------

export async function loadAllBlockstates(blockNames) {
    for (const name of blockNames) {
        const entry = await loadOneBlockstate(name);
        if (!entry) continue;

        BlockstateDB.byName.set(name, entry);

        for (const model of entry.models) {
            BlockstateDB.allModels.add(model);
        }
    }

    // preload all models into BlockstateDB.models
    for (const modelName of BlockstateDB.allModels) {
        const model = await loadModel(modelName);
        BlockstateDB.models.set(modelName, model);
    }
}

export async function loadOneBlockstate(name) {
    const path = `assets/sixsevencraft/blockstates/${name}.json`;

    try {
        const res = await fetch(path);
        if (!res.ok) return null;

        const raw = await res.json();

        const properties = extractProperties(raw);
        const variants = raw.variants || null;
        const multipart = raw.multipart || null;
        const models = extractModels(raw);

        return { raw, properties, variants, multipart, models };
    } catch {
        return null;
    }
}

export function extractProperties(raw) {
    const props = {};

    if (raw.variants) {
        for (const key of Object.keys(raw.variants)) {
            if (key === "") continue;
            const parts = key.split(",");
            for (const part of parts) {
                const [prop, value] = part.split("=");
                if (!props[prop]) props[prop] = new Set();
                props[prop].add(value);
            }
        }
    }

    if (raw.multipart) {
        for (const part of raw.multipart) {
            if (part.when) {
                for (const [prop, value] of Object.entries(part.when)) {
                    if (!props[prop]) props[prop] = new Set();
                    props[prop].add(value);
                }
            }
        }
    }

    for (const k in props) props[k] = [...props[k]];
    return props;
}

export function extractModels(raw) {
    const models = new Set();

    if (raw.variants) {
        for (const entry of Object.values(raw.variants)) {
            if (Array.isArray(entry)) {
                for (const e of entry) if (e.model) models.add(e.model);
            } else if (entry && entry.model) {
                models.add(entry.model);
            }
        }
    }

    if (raw.multipart) {
        for (const part of raw.multipart) {
            const apply = part.apply;
            if (Array.isArray(apply)) {
                for (const e of apply) if (e.model) models.add(e.model);
            } else if (apply && apply.model) {
                models.add(apply.model);
            }
        }
    }

    return [...models];
}

// -----------------------------------------------------
// STATE REGISTRY
// -----------------------------------------------------

export function buildStatesFromBlockstates() {
    const defs = generateStateDefinitions();

    for (const def of defs) {
        const blockId = blockNameToId.get(def.blockName);
        if (!blockId) continue;

        const id = nextStateId++;
        const key = makeStateKey(def.blockName, def.properties);

        const state = {
            id,
            blockId,
            blockName: def.blockName,
            properties: def.properties,
            model: def.model,
            multipart: def.multipart || null,
        };

        stateIdToDef[id] = state;
        stateKeyToId.set(key, id);

        blocks[blockId].states.push(id);

        if (!blocks[blockId].defaultStateId) {
            blocks[blockId].defaultStateId = id;
        }
    }
}

export function generateStateDefinitions() {
    const result = [];

    for (const [name, entry] of BlockstateDB.byName.entries()) {
        const { variants, multipart } = entry;

        if (variants && Object.keys(variants).length > 0) {
            for (const [key, value] of Object.entries(variants)) {
                const props = keyToProps(key);
                result.push({
                    blockName: name,
                    properties: props,
                    model: pickModel(value),
                });
            }
        }

        if (multipart && multipart.length > 0) {
            result.push({
                blockName: name,
                properties: {},
                model: null,
                multipart,
            });
        }

        if ((!variants || Object.keys(variants).length === 0) &&
            (!multipart || multipart.length === 0)) {
            result.push({
                blockName: name,
                properties: {},
                model: `block/${name}`,
            });
        }
    }

    return result;
}

export function makeStateKey(blockName, props) {
    const entries = Object.entries(props || {}).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return blockName;
    return `${blockName}|` + entries.map(([k, v]) => `${k}=${v}`).join(",");
}

export function keyToProps(key) {
    if (!key) return {};
    const props = {};
    for (const part of key.split(",")) {
        const [k, v] = part.split("=");
        props[k] = v;
    }
    return props;
}

export function pickModel(entry) {
    if (!Array.isArray(entry)) return entry.model;

    let total = 0;
    for (const e of entry) total += e.weight || 1;

    let r = Math.random() * total;
    for (const e of entry) {
        r -= (e.weight || 1);
        if (r <= 0) return e.model;
    }

    return entry[0].model;
}

// -----------------------------------------------------
// MODEL LOADING (NOW EXPORTED)
// -----------------------------------------------------

export const modelCache = new Map();

export async function loadModel(modelName) {
    const path = `assets/sixsevencraft/models/${modelName}.json`;
    return await loadModelRecursive(path);
}

export async function loadModelRecursive(path) {
    if (modelCache.has(path)) return modelCache.get(path);

    const res = await fetch(path);
    const json = await res.json();

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

export function resolveTexture(texName, textures) {
    if (!texName.startsWith("#")) return texName;
    return textures[texName.slice(1)];
}

// -----------------------------------------------------
// FACE TEMPLATE GENERATION
// -----------------------------------------------------

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
                textureName: texName,
                uv,
                cullface: face.cullface || null,
                rotation: face.rotation || 0
            });
        }
    }

    return faces;
}

// -----------------------------------------------------
// PUBLIC API FOR MESHER
// -----------------------------------------------------

export async function getBlockModelFaces(blockId, stateId) {
    const state = stateIdToDef[stateId];
    if (!state) return [];

    let modelName = state.model;

    if (!modelName && state.multipart) {
        for (const part of state.multipart) {
            if (!part.when || matchesWhen(state.properties, part.when)) {
                modelName = part.apply.model;
                break;
            }
        }
    }

    if (!modelName) return [];

    const model = await loadModel(modelName);
    return buildFaceTemplates(model);
}

export function matchesWhen(props, when) {
    for (const [k, v] of Object.entries(when)) {
        if (typeof v === "string") {
            if (props[k] !== v) return false;
        } else if (Array.isArray(v)) {
            if (!v.includes(props[k])) return false;
        } else {
            return false;
        }
    }
    return true;
}

// -----------------------------------------------------
// PUBLIC API: STATE LOOKUP
// -----------------------------------------------------

export function getStateDef(stateId) {
    return stateIdToDef[stateId] || null;
}
