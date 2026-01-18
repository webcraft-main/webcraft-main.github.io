// blockstateDatabase.js
// Central authority for all blockstate JSONs

export const BlockstateDB = {
    byName: new Map(),        // name → { raw, properties, variants, multipart, models }
    allProperties: new Map(), // propName → Set(values)
    allModels: new Set(),     // "block/stone", "block/oak_log_horizontal", ...
    allBlocks: [],            // ["stone", "oak_log", ...]
};

/**
 * Load all blockstate JSONs for the given block names.
 * blockNames: array of block registry names, e.g. ["stone","oak_log","grass_block"]
 */
export async function loadAllBlockstates(blockNames) {
    for (const name of blockNames) {
        const entry = await loadOneBlockstate(name);
        if (!entry) continue;

        BlockstateDB.byName.set(name, entry);
        BlockstateDB.allBlocks.push(name);

        // merge properties
        for (const [prop, values] of Object.entries(entry.properties)) {
            if (!BlockstateDB.allProperties.has(prop)) {
                BlockstateDB.allProperties.set(prop, new Set());
            }
            const set = BlockstateDB.allProperties.get(prop);
            for (const v of values) set.add(v);
        }

        // merge models
        for (const model of entry.models) {
            BlockstateDB.allModels.add(model);
        }
    }
}

/**
 * Resolve a model name for a given block + properties.
 * Returns a string like "block/stone" or null if unresolved.
 */
export function resolveModelForBlock(blockName, properties = {}) {
    const entry = BlockstateDB.byName.get(blockName);
    if (!entry) return `block/${blockName}`;

    const { raw, variants, multipart } = entry;

    // 1) variants
    if (variants && Object.keys(variants).length > 0) {
        const key = propsToKey(properties);

        // exact match
        if (variants[key]) {
            return pickModel(variants[key]);
        }

        // fallback: empty key
        if (variants[""]) {
            return pickModel(variants[""]);
        }
    }

    // 2) multipart (simple support)
    if (multipart && multipart.length > 0) {
        for (const part of multipart) {
            if (!part.when || matchesWhen(properties, part.when)) {
                return pickModel(part.apply);
            }
        }
    }

    // 3) fallback
    return `block/${blockName}`;
}

/**
 * Generate a flat list of "state definitions" suitable for building a stateRegistry.
 * Each entry: { blockName, properties, key, model }
 */
export function generateStateDefinitions() {
    const result = [];

    for (const [name, entry] of BlockstateDB.byName.entries()) {
        const { raw, properties, variants, multipart } = entry;

        // 1) variants → explicit states
        if (variants && Object.keys(variants).length > 0) {
            for (const [key, value] of Object.entries(variants)) {
                const props = keyToProps(key);
                result.push({
                    blockName: name,
                    properties: props,
                    key,
                    model: pickModel(value),
                });
            }
        }

        // 2) multipart → record as a special state
        if (multipart && multipart.length > 0) {
            result.push({
                blockName: name,
                properties: {},
                key: "__multipart__",
                model: null,
                multipart,
            });
        }

        // 3) no variants/multipart → single default state
        if ((!variants || Object.keys(variants).length === 0) && (!multipart || multipart.length === 0)) {
            result.push({
                blockName: name,
                properties: {},
                key: "",
                model: `block/${name}`,
            });
        }
    }

    return result;
}

/**
 * Simple validation: returns an array of issues:
 *  - missing models
 *  - blocks with no usable variants
 */
export function validateBlockstates(modelExistsFn) {
    const issues = [];

    for (const [name, entry] of BlockstateDB.byName.entries()) {
        // check models
        for (const model of entry.models) {
            if (!modelExistsFn || !modelExistsFn(model)) {
                issues.push({ type: "missingModel", block: name, model });
            }
        }

        // check that at least one state is resolvable
        const hasVariants = entry.variants && Object.keys(entry.variants).length > 0;
        const hasMultipart = entry.multipart && entry.multipart.length > 0;
        if (!hasVariants && !hasMultipart) {
            issues.push({ type: "noStates", block: name });
        }
    }

    return issues;
}

// -----------------------------
// INTERNAL LOADING / PARSING
// -----------------------------

async function loadOneBlockstate(name) {
    const path = `assets/sixsevencraft/blockstates/${name}.json`;

    try {
        const res = await fetch(path);
        if (!res.ok) {
            console.warn("[BlockstateDB] Missing blockstate:", name, path);
            return null;
        }

        const raw = await res.json();

        const properties = extractProperties(raw);
        const variants = raw.variants || null;
        const multipart = raw.multipart || null;
        const models = extractModels(raw);

        return { raw, properties, variants, multipart, models };
    } catch (e) {
        console.error("[BlockstateDB] Error loading blockstate:", name, e);
        return null;
    }
}

function extractProperties(raw) {
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

    // convert sets to arrays
    for (const k in props) {
        props[k] = [...props[k]];
    }
    return props;
}

function extractModels(raw) {
    const models = new Set();

    if (raw.variants) {
        for (const entry of Object.values(raw.variants)) {
            if (Array.isArray(entry)) {
                for (const e of entry) {
                    if (e.model) models.add(e.model);
                }
            } else if (entry && entry.model) {
                models.add(entry.model);
            }
        }
    }

    if (raw.multipart) {
        for (const part of raw.multipart) {
            const apply = part.apply;
            if (Array.isArray(apply)) {
                for (const e of apply) {
                    if (e.model) models.add(e.model);
                }
            } else if (apply && apply.model) {
                models.add(apply.model);
            }
        }
    }

    return [...models];
}

// -----------------------------
// HELPERS
// -----------------------------

function propsToKey(props) {
    const entries = Object.entries(props || {}).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return "";
    return entries.map(([k, v]) => `${k}=${v}`).join(",");
}

function keyToProps(key) {
    if (!key) return {};
    const props = {};
    const parts = key.split(",");
    for (const part of parts) {
        const [k, v] = part.split("=");
        props[k] = v;
    }
    return props;
}

function pickModel(entry) {
    if (!Array.isArray(entry)) {
        return entry.model;
    }

    // Weighted random selection
    let total = 0;
    for (const e of entry) {
        total += e.weight || 1;
    }

    let r = Math.random() * total;

    for (const e of entry) {
        r -= (e.weight || 1);
        if (r <= 0) {
            return e.model;
        }
    }

    // Fallback (should never hit)
    return entry[0].model;
}

function matchesWhen(props, when) {
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

