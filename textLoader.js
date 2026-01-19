export async function loadText(path) {
    const res = await fetch(path);
    return await res.text();
}

export function parseColorCodes(text) {
    return text.replace(/§([0-9a-f])/g, "<span class='mc-color-$1'>");
}
