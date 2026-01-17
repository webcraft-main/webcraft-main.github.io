import { registerBlockstate } from "./blockstateRegistry.js";

export async function loadAllBlockstates() {
    const folder = "../assets/minecraft/blockstates/";

    // Get the list of files in the folder
    const response = await fetch(folder);
    const text = await response.text();

    // Parse the directory listing (works on GitHub Pages, local servers, etc.)
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const links = [...doc.querySelectorAll("a")];

    for (const link of links) {
        const name = link.getAttribute("href");
        if (!name.endsWith(".json")) continue;

        const blockId = name.replace(".json", "");
        const json = await fetch(folder + name).then(r => r.json());

        registerBlockstate(blockId, json);
    }
}
