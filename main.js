import { scene, camera, renderer } from "./engine.js";
import { player, stepRemoteInterpolation, worldTime } from "./world.js";
import { keys } from "./input.js";
import { ensureChunksAround } from "./terrain.js";
import { updatePhysics } from "./physics.js";
import { sendMovement } from "./multiplayer.js";
import { saveWorld, loadWorld } from "./storage.js";

let lastTime = performance.now();

let volcanicTimer = 0;
const VOLCANIC_ERUPTION_TIME = 40 * 60; // 40 minutes

function updateVolcano(dt) {
    volcanicTimer += dt;
    if (volcanicTimer >= VOLCANIC_ERUPTION_TIME) {
        volcanicTimer = 0;
        console.log("🔥 VOLCANIC ERUPTION!");
        // TODO: add lava flood, explosions, ash particles
    }
}

const heartsEl = document.getElementById("hearts");
const hungerEl = document.getElementById("hunger");

document.addEventListener("keydown", e => {
    if (e.code === "KeyR") {
        loadWorld();
    }
    if (e.code === "KeyP") {
        saveWorld();
    }
});

function updateHUD() {
    heartsEl.innerHTML = "";
    hungerEl.innerHTML = "";

    for (let i = 0; i < 10; i++) {
        const heart = document.createElement("div");
        heart.className = "heart " + (player.health > i * 2 ? "full" : "empty");
        heartsEl.appendChild(heart);
    }

    for (let i = 0; i < 10; i++) {
        const h = document.createElement("div");
        h.className = "hunger-icon " + (player.hunger > i * 2 ? "full" : "empty");
        hungerEl.appendChild(h);
    }
}

function updateTime(dt) {
    worldTime.timeOfDay = (worldTime.timeOfDay + dt) % worldTime.dayLength;
    worldTime.seasonTime = (worldTime.seasonTime + dt) % worldTime.seasonLength;

    if (worldTime.seasonTime < dt) {
        worldTime.seasonIndex = (worldTime.seasonIndex + 1) % 4;
        console.log("Season changed to", worldTime.seasonIndex);
    }

    const t = worldTime.timeOfDay / worldTime.dayLength;
    const brightness = Math.max(0.1, Math.sin(t * Math.PI));
    renderer.setClearColor(new THREE.Color(0x87ceeb).multiplyScalar(brightness));
}

function applyHungerAndHealth(dt, moving) {
    if (moving) {
        player.hunger = Math.max(0, player.hunger - dt * 0.5);
    } else {
        if (player.hunger > 16 && player.health < 20) {
            player.health = Math.min(20, player.health + dt * 0.5);
        }
    }

    if (player.hunger <= 0) {
        player.health = Math.max(0, player.health - dt * 0.5);
    }
}

camera.position.copy(player.pos);

function tick(dt) {
    let moveSpeed = 7;

    const isSprinting = keys["ShiftLeft"] && player.hunger > 0;
    const isSneaking  = keys["ControlLeft"];

    if (isSprinting) moveSpeed *= 1.6;
    if (isSneaking)  moveSpeed *= 0.4;

    const dir = new THREE.Vector3();
    const f = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion); f.y = 0;
    const s = new THREE.Vector3().crossVectors(camera.up, f);

    const beforePos = player.pos.clone();

    if (keys["KeyW"]) dir.add(f);
    if (keys["KeyS"]) dir.sub(f);
    if (keys["KeyA"]) dir.add(s);
    if (keys["KeyD"]) dir.sub(s);

    let moving = false;
    if (dir.lengthSq() > 0) {
        dir.normalize().multiplyScalar(moveSpeed * dt);
        player.pos.add(dir);
        moving = true;
    }

    player.vel.y -= 30 * dt;
    player.pos.y += player.vel.y * dt;

    if (player.pos.y < 2) {
        player.pos.y = 2;
        player.vel.y = 0;
    }

    camera.position.copy(player.pos);
    player.yaw = camera.rotation.y;

    ensureChunksAround(player.pos);
    updatePhysics(dt);
    stepRemoteInterpolation(dt);

    updateTime(dt);
    applyHungerAndHealth(dt, moving);
    updateHUD();

    sendMovement();
}

function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    player.pos.set(0, 2, 0);
    camera.position.copy(player.pos);

    tick(dt);
    renderer.render(scene, camera);
    updateVolcano(dt);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
