const THREE = window.THREE;

export const textureCache = new Map();

export async function loadTexture(path) {
    if (textureCache.has(path)) return textureCache.get(path);

    const loader = new THREE.TextureLoader();
    const tex = await new Promise(resolve => {
        loader.load(path, resolve);
    });

    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;

    textureCache.set(path, tex);
    return tex;
}

export function tex(category, name) {
    return loadTexture(`assets/sixsevencraft/textures/${category}/${name}.png`);
}

