import { scene } from "./engine.js";
import { player } from "./world.js";
import { ensureRemote, updateRemoteTarget, removeRemote, remotes } from "./world.js";

export const socket = new WebSocket("wss://sixsevencraft-server.onrender.com");

export let playerId = null;

socket.addEventListener("open", () => {
    playerId = crypto.randomUUID();
    socket.send(JSON.stringify({ type: "join", id: playerId }));
});

export function sendMovement() {
    if (!playerId || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
        type: "move",
        id: playerId,
        x: player.pos.x,
        y: player.pos.y,
        z: player.pos.z,
        ry: player.yaw
    }));
}

socket.addEventListener("message", e => {
    const data = JSON.parse(e.data);

    if (data.type === "state") {
        // Update or create remote players
        for (const id in data.players) {
            if (id === playerId) continue;
            updateRemoteTarget(id, data.players[id], scene);
        }

        // Remove players no longer in state
        for (const id in remotes) {
            if (!data.players[id] && id !== playerId) {
                removeRemote(id, scene);
            }
        }
    }

    if (data.type === "leave") {
        if (data.id !== playerId) {
            removeRemote(data.id, scene);
        }
    }
});


    if (data.type === "leave") {
        delete remotePlayers[data.id];
    }
});
