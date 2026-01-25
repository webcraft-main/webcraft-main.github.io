// shaderLoader.js — async GLSL loader

export async function loadShader(path) {
    const res = await fetch(path);
    if (!res.ok) {
        console.warn("[ShaderLoader] Failed to load", path, res.status);
        return "";
    }
    return await res.text();
}

