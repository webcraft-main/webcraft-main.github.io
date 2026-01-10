import { scene, camera, renderer } from "./engine.js";
import { addBlock } from "./blocks.js";
import { updatePhysics } from "./physics.js";
import { keys } from "./input.js";
import { sendMovement } from "./multiplayer.js";
import { player } from "./world.js";

// Build floor
for (let x=-10; x<10; x++)
for (let z=-10; z<10; z++)
    addBlock(x, 0, z, 0);

camera.position.set(0, 5, 5);

function animate() {
    requestAnimationFrame(animate);
    const dt = 0.016;

    const dir = new THREE.Vector3();
    const f = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion); f.y = 0;
    const s = new THREE.Vector3().crossVectors(camera.up, f);

    if (keys["KeyW"]) dir.add(f);
    if (keys["KeyS"]) dir.sub(f);
    if (keys["KeyA"]) dir.add(s);
    if (keys["KeyD"]) dir.sub(s);

    camera.position.add(dir.normalize().multiplyScalar(7 * dt));

    player.vel.y -= 30 * dt;
    camera.position.y += player.vel.y * dt;

    updatePhysics();
    renderer.render(scene, camera);

    sendMovement(camera.position.x, camera.position.y, camera.position.z, camera.rotation.y);
}

animate();
