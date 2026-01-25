// engine.js — core Three.js setup

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

// -----------------------------------------------------
// CAMERA
// -----------------------------------------------------
export const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    512 // voxel engines work best with tighter far planes
);
camera.rotation.order = "YXZ";

camera.position.set(0, 80, 0);

// -----------------------------------------------------
// RENDERER
// -----------------------------------------------------
const canvas = document.getElementById("mainCanvas");

export const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;


// -----------------------------------------------------
// LIGHTING
// -----------------------------------------------------
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
sun.castShadow = true;

// Configure shadow camera for stability
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 100;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;

scene.add(sun);


// -----------------------------------------------------
// RESIZE HANDLER (fixed duplicate)
// -----------------------------------------------------
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// -----------------------------------------------------
// INPUT STATE (WASD + Sprint + Crouch)
// -----------------------------------------------------
export const input = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    crouch: false
};

window.addEventListener("keydown", (e) => {
    switch (e.code) {
        case "KeyW": input.forward = true; break;
        case "KeyS": input.backward = true; break;
        case "KeyA": input.left = true; break;
        case "KeyD": input.right = true; break;
        case "ShiftLeft": input.sprint = true; break;
        case "ControlLeft": input.crouch = true; break;
    }
});

window.addEventListener("keyup", (e) => {
    switch (e.code) {
        case "KeyW": input.forward = false; break;
        case "KeyS": input.backward = false; break;
        case "KeyA": input.left = false; break;
        case "KeyD": input.right = false; break;
        case "ShiftLeft": input.sprint = false; break;
        case "ControlLeft": input.crouch = false; break;
    }
});

window.scene = scene;
window.camera = camera;
window.renderer = renderer;
