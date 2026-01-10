export const socket = new WebSocket("wss://sixsevencraft-server.onrender.com");

export let playerId = null;
export const remotePlayers = {};

socket.addEventListener("open", () => {
    playerId = crypto.randomUUID();
    socket.send(JSON.stringify({ type: "join", id: playerId }));
});

export function sendMovement(x, y, z, ry) {
    if (!playerId) return;
    socket.send(JSON.stringify({ type: "move", id: playerId, x, y, z, ry }));
}

socket.addEventListener("message", e => {
    const data = JSON.parse(e.data);

    if (data.type === "state") {
        for (const id in data.players) {
            remotePlayers[id] = data.players[id];
        }
    }

    if (data.type === "leave") {
        delete remotePlayers[data.id];
    }
});
