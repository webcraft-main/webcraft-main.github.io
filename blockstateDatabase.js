// blockstateDatabase.js

export const BlockstateDB = {
    byName: new Map(),      // "oak_log" → { raw, properties, variants, multipart }
    allProperties: new Map(), // "axis" → Set("x","y","z")
    allModels: new Set(),     // "block/oak_log", "block/oak_log_horizontal"
    allBlocks: [],            // list of all block names
};

export async function loadAllBlockstates(blockNames) {
    for (const name of blockNames) {
        const entry = await loadOne(name);
        BlockstateDB.byName.set(name, entry);

        BlockstateDB.allBlocks.push(name);

        // merge properties
        for (const [prop, values] of Object.entries(entry.properties)) {
            if (!BlockstateDB.allProperties.has(prop)) {
                BlockstateDB.allProperties.set(prop, new Set());
            }
            for (const v of values) {
                BlockstateDB.allProperties.get(prop).add(v);
            }
        }

        // merge models
        for (const model of entry.models) {
            BlockstateDB.allModels.add(model);
        }
    }
}

async function loadOne(name) {
    const path = `assets/sixsevencraft/blockstates/${name}.json`;
    const res = await fetch(path);
    const raw = await res.json();

    const properties = extractProperties(raw);
    const variants = extractVariants(raw);
    const multipart = raw.multipart || null;
    const models = extractModels(raw);

    return { raw, properties, variants, multipart, models };
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
    for (const k in props) props[k] = [...props[k]];
    return props;
}

function extractVariants(raw) {
    return raw.variants || null;
}

function extractModels(raw) {
    const models = new Set();

    if (raw.variants) {
        for (const entry of Object.values(raw.variants)) {
            if (Array.isArray(entry)) {
                for (const e of entry) models.add(e.model);
            } else {
                models.add(entry.model);
            }
        }
    }

    if (raw.multipart) {
        for (const part of raw.multipart) {
            const apply = part.apply;
            if (Array.isArray(apply)) {
                for (const e of apply) models.add(e.model);
            } else {
                models.add(apply.model);
            }
        }
    }

    return [...models];
}
