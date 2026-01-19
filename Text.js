// Text.js

import { loadFont } from "./bitmapFont.js";
import { createTextMesh } from "./textMesh.js";

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
