// loop.js — main game loop (chunk-aware + GUI-safe)

import { input } from "./engine.js";

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

export function startGameLoop(world, scene, camera, renderer) {
    function tick() {

        // -----------------------------
        // MOVEMENT SYSTEM
        // -----------------------------
        const baseSpeed = 0.1;
        let speed = baseSpeed;

        if (input.sprint) speed *= 2.0;
        if (input.crouch) speed *= 0.5;

        direction.set(0, 0, 0);

        if (input.forward) direction.z -= 1;
        if (input.backward) direction.z += 1;
        if (input.left) direction.x -= 1;
        if (input.right) direction.x += 1;

        direction.normalize();

        // Apply movement relative to camera rotation
        const move = new THREE.Vector3(direction.x, 0, direction.z);
        move.applyEuler(camera.rotation);
        move.multiplyScalar(speed);

        camera.position.add(move);

        // Crouch camera height
        camera.position.y = input.crouch ? 79.6 : 80;

        // -----------------------------
        // CHUNK SYSTEM
        // -----------------------------
        // Load/unload chunks around player
        world.updateLoadedChunks(camera.position.x, camera.position.z);

        // Rebuild meshes for dirty chunks
        world.remeshDirtyChunks();

        // -----------------------------
        // RENDER 3D WORLD
        // -----------------------------
        renderer.render(scene, camera);

        // -----------------------------
        // RENDER GUI (your GUI canvas)
        // -----------------------------
        if (world.gui && world.gui.render) {
            world.gui.render();
        }

        requestAnimationFrame(tick);
    }

    tick();
}
