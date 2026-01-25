// multiplayer.js — chunk-based multiplayer sync

import { scene } from "./engine.js";
import { world } from "./world.js"; // FIXED: world comes from world.js

const THREE = window.THREE;

export const socket = new WebSocket("wss://sixsevencraft-server.onrender.com");

export let playerId = null;
export const remotePlayers = new Map();

// -----------------------------
// CONNECTION
// -----------------------------
socket.addEventListener("open", () => {
    playerId = crypto.randomUUID();
    socket.send(JSON.stringify({ type: "join", id: playerId }));
});

// -----------------------------
// SEND PLAYER MOVEMENT
// -----------------------------
export function sendMovement(player) {
    if (!playerId || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
        type: "move",
        id: playerId,
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        ry: player.rotation.y
    }));
}

// -----------------------------
// HANDLE INCOMING MESSAGES
// -----------------------------
socket.addEventListener("message", e => {
    const data = JSON.parse(e.data);

    switch (data.type) {

        // Remote player positions
        case "state":
            for (const id in data.players) {
                if (id === playerId) continue;
                updateRemotePlayer(id, data.players[id]);
            }
            cleanupMissingPlayers(data.players);
            break;

        // Chunk data from server
        case "chunk":
            world.loadRemoteChunk(data); // world.js handles decoding
            break;

        // Block update from server
        case "blockUpdate":
            world.setBlock(data.x, data.y, data.z, data.blockId, data.stateId);
            break;

        // Player left
        case "leave":
            removeRemotePlayer(data.id);
            break;
    }
});

// -----------------------------
// REMOTE PLAYER MANAGEMENT
// -----------------------------
function updateRemotePlayer(id, info) {
    let obj = remotePlayers.get(id);

    if (!obj) {
        obj = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 1.8, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x00aaff })
        );
        obj.position.set(info.x, info.y, info.z);
        scene.add(obj);
        remotePlayers.set(id, obj);
    }

    // TODO: interpolation hook
    obj.position.set(info.x, info.y, info.z);
    obj.rotation.y = info.ry;
}

function removeRemotePlayer(id) {
    const obj = remotePlayers.get(id);
    if (!obj) return;
    scene.remove(obj);
    remotePlayers.delete(id);
}

function cleanupMissingPlayers(serverPlayers) {
    for (const id of remotePlayers.keys()) {
        if (!serverPlayers[id]) removeRemotePlayer(id);
    }
}

