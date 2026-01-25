// textureLoader.js

const THREE = window.THREE;

export const textureCache = new Map();

// Core async texture loader
export async function loadTexture(path) {
    if (textureCache.has(path)) return textureCache.get(path);

    const loader = new THREE.TextureLoader();

    const tex = await new Promise((resolve, reject) => {
        loader.load(
            path,
            resolve,
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

// High-level texture router
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


