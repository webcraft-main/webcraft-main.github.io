// debugBlockstates.js

import { BlockstateDB } from "./blockstateDatabase.js";
import { blocks, stateIdToDef } from "./blocks.js";

export function initDebugBlockstateUI() {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.right = "0";
    container.style.maxHeight = "100vh";
    container.style.overflow = "auto";
    container.style.background = "rgba(0,0,0,0.8)";
    container.style.color = "#fff";
    container.style.fontFamily = "monospace";
    container.style.fontSize = "11px";
    container.style.padding = "8px";
    container.style.zIndex = "9999";

    const title = document.createElement("div");
    title.textContent = "Blockstate Debug";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "4px";
    container.appendChild(title);

    for (const [name, entry] of BlockstateDB.byName.entries()) {
        const blockDiv = document.createElement("div");
        blockDiv.style.borderBottom = "1px solid #444";
        blockDiv.style.marginBottom = "4px";
        blockDiv.style.paddingBottom = "4px";

        const header = document.createElement("div");
        header.textContent = name;
        header.style.color = "#0ff";
        blockDiv.appendChild(header);

        // properties
        const propsDiv = document.createElement("div");
        propsDiv.textContent = "props: " + JSON.stringify(entry.properties);
        blockDiv.appendChild(propsDiv);

        // variants
        if (entry.variants && Object.keys(entry.variants).length > 0) {
            const variantsDiv = document.createElement("div");
            variantsDiv.textContent = "variants:";
            blockDiv.appendChild(variantsDiv);

            const list = document.createElement("ul");
            for (const [key, value] of Object.entries(entry.variants)) {
                const li = document.createElement("li");
                li.textContent = `${key} → ${JSON.stringify(value)}`;
                list.appendChild(li);
            }
            blockDiv.appendChild(list);
        }

        // multipart
        if (entry.multipart && entry.multipart.length > 0) {
            const mpDiv = document.createElement("div");
            mpDiv.textContent = "multipart: " + JSON.stringify(entry.multipart);
            blockDiv.appendChild(mpDiv);
        }

        container.appendChild(blockDiv);
    }

    document.body.appendChild(container);
}
