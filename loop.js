// loop.js — main game loop

export function startGameLoop(world, scene, camera, renderer) {
    function tick() {
        // Update world (chunks, lighting, etc.)
        if (world.update) {
            world.update();
        }

        // Render
        renderer.render(scene, camera);

        requestAnimationFrame(tick);
    }

    tick();
}
