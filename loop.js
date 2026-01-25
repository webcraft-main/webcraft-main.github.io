// loop.js — main game loop

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
        // WORLD UPDATE + RENDER
        // -----------------------------
        if (world.update) world.update();
        renderer.render(scene, camera);

        requestAnimationFrame(tick);
    }

    tick();
}
