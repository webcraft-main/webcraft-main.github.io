// autoBlockList.js
export async function loadBlockNames() {
    const res = await fetch("assets/sixsevencraft/blockstates/blocklist.json");
    return await res.json();
}

    // Parse directory listing (GitHub Pages returns HTML)
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const names = [];

    doc.querySelectorAll("a").forEach(a => {
        const href = a.getAttribute("href");
        if (href && href.endsWith(".json")) {
            const name = href.replace(".json", "");
            names.push(name);
        }
    });

    return names;
}
