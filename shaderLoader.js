export async function loadShader(path) {
    const res = await fetch(path);
    return await res.text();
}
