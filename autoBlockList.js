// autoBlockList.js
// Loads block names from blocklist.json (recommended)

export async function loadBlockNames() {
    const res = await fetch("assets/sixsevencraft/blockstates/blocklist.json");
    if (!res.ok) {
        console.error("Failed to load blocklist.json");
        return [];
    }
    return await res.json();
}
