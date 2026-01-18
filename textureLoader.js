const THREE = window.THREE

export const textureCache = new Map();

export function loadTexture(path) {
    if (textureCache.has(path)) return textureCache.get(path);

    const loader = new THREE.TextureLoader();
    const tex = loader.load(path);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;

    textureCache.set(path, tex);
    return tex;
}
