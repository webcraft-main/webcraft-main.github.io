import { registerBlockstate } from "./blockstateRegistry.js";

// Adjust folder if your path differs
const BLOCKSTATE_FOLDER = "../assets/sixsevencraft/blockstates/";

export async function loadAllBlockstates() {
    const res = await fetch(BLOCKSTATE_FOLDER);
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const links = [...doc.querySelectorAll("a")];

    for (const link of links) {
        const name = link.getAttribute("href");
        if (!name.endsWith(".json")) continue;

        const id = name.replace(".json", ""); // e.g. "oak_fence"
        const json = await fetch(BLOCKSTATE_FOLDER + name).then(r => r.json());
        registerBlockstate(id, json);
    }
}

