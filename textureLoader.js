// textureLoader.js

const THREE = window.THREE;

export const textureCache = new Map();

// -----------------------------------------------------
// CORE ASYNC TEXTURE LOADER
// -----------------------------------------------------

export async function loadTexture(path) {
    if (textureCache.has(path)) return textureCache.get(path);

    const loader = new THREE.TextureLoader();

    const tex = await new Promise((resolve) => {
        loader.load(
            path,
            (texture) => resolve(texture),
            undefined,
            (err) => {
                console.warn("[TextureLoader] Failed to load:", path, err);
                resolve(null);
            }
        );
    });

    if (!tex) {
        console.warn("[TextureLoader] Missing texture:", path);
        return null;
    }

    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;

    textureCache.set(path, tex);
    return tex;
}

// -----------------------------------------------------
// HIGH-LEVEL TEXTURE ROUTER
// -----------------------------------------------------

export function tex(category, name) {
    // GUI routing
    if (category === "gui") {
        // HUD sprites (hotbar, selection, etc.)
        if (name === "hotbar" || name === "hotbar_selection") {
            return loadTexture(
                `assets/sixsevencraft/textures/gui/sprites/hud/${name}.png`
            );
        }

        // Direct GUI files in textures/gui/ (e.g. menu_background.png, book.png)
        return loadTexture(
            `assets/sixsevencraft/textures/gui/${name}.png`
        );
    }

    // Default block/item routing
    return loadTexture(
        `assets/sixsevencraft/textures/${category}/${name}.png`
    );
}

// -----------------------------------------------------
// AUTO-DISCOVER ALL ITEM ICON NAMES
// (from assets/sixsevencraft/textures/item/itemlist.json)
// -----------------------------------------------------

export async function loadAllItemNames() {
    const res = await fetch("assets/sixsevencraft/textures/item/itemlist.json");
    if (!res.ok) {
        console.error("Failed to load itemlist.json", res.status, res.statusText);
        return [];
    }
    return await res.json();
}


