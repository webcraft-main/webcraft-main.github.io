// debugBlockstateUI.js — simple blockstate debug overlay

export function initDebugBlockstateUI() {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.top = "10px";
    div.style.right = "10px";
    div.style.padding = "10px";
    div.style.background = "rgba(0,0,0,0.5)";
    div.style.color = "white";
    div.style.fontFamily = "monospace";
    div.style.fontSize = "12px";
    div.style.zIndex = "9999";
    div.style.maxHeight = "300px";
    div.style.overflowY = "auto";
    div.style.pointerEvents = "none";

    div.innerHTML = `
        <b>Blockstate Debug</b><br>
        Loaded blockstates: <span id="dbg-block-count">0</span><br>
        Loaded models: <span id="dbg-model-count">0</span><br>
        Loaded textures: <span id="dbg-texture-count">0</span><br>
    `;

    document.body.appendChild(div);

    // Expose update function globally
    window.updateBlockstateDebug = function (blockCount, modelCount, textureCount) {
        document.getElementById("dbg-block-count").textContent = blockCount;
        document.getElementById("dbg-model-count").textContent = modelCount;
        document.getElementById("dbg-texture-count").textContent = textureCount;
    };
}
