// bitmapFont.js

export const FontRegistry = new Map(); // "default" → { glyphs, config }

export async function loadFont(name) {
    const configPath = `assets/sixsevencraft/font/${name}.json`;
    const res = await fetch(configPath);
    if (!res.ok) throw new Error(`Font config not found: ${name}`);

    const config = await res.json();

    // Load includes
    const glyphs = {};
    if (config.providers) {
        for (const provider of config.providers) {
            if (provider.type === "bitmap" && provider.file) {
                const includePath = `assets/sixsevencraft/font/include/${provider.file}`;
                const glyphRes = await fetch(includePath);
                if (glyphRes.ok) {
                    const glyphData = await glyphRes.json();
                    Object.assign(glyphs, glyphData);
                }
            }
        }
    }

    FontRegistry.set(name, { config, glyphs });
    return FontRegistry.get(name);
}

export function getFont(name) {
    return FontRegistry.get(name) || null;
}
