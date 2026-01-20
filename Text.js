// Text.js

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

// textMesh.js

const THREE = window.THREE;

import { getFont } from "./bitmapFont.js";

export function createTextMesh(text, { font = "default", size = 1, spacing = 0.1 } = {}) {
    const fontData = getFont(font);
    if (!fontData) throw new Error(`Font not loaded: ${font}`);

    const { glyphs } = fontData;

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];

    let xOffset = 0;

    for (const char of text) {
        const glyph = glyphs[char];
        if (!glyph) {
            xOffset += size + spacing;
            continue;
        }

        const { left, right, top, bottom, u0, v0, u1, v1 } = glyph;

        const w = (right - left) * size;
        const h = (top - bottom) * size;

        const x = xOffset;
        const y = 0;

        // 2 triangles per glyph
        positions.push(
            x, y, 0,
            x + w, y, 0,
            x, y + h, 0,

            x + w, y, 0,
            x + w, y + h, 0,
            x, y + h, 0
        );

        uvs.push(
            u0, v1,
            u1, v1,
            u0, v0,

            u1, v1,
            u1, v0,
            u0, v0
        );

        xOffset += w + spacing;
    }

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    const material = new THREE.MeshBasicMaterial({
        map: getFontTexture(font),
        transparent: true,
    });

    return new THREE.Mesh(geometry, material);
}

function getFontTexture(font) {
    // Load texture from font config
    const path = `assets/sixsevencraft/font/${font}.png`;
    const tex = new THREE.TextureLoader().load(path);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
}

export const Text = {
    async loadFonts(fontNames) {
        for (const name of fontNames) {
            await loadFont(name);
        }
    },

    create3D(text, options) {
        return createTextMesh(text, options);
    }
};
