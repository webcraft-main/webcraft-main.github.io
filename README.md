# sixsevencraft

An infinite, procedural, survival game built  in JavaScript using **Three.js**. This project features a fully functional sandbox environment running directly in the browser with advanced physics, crafting, and multiplayer simulation.

---

## 🎮 Controls

| Action | Control |
| :--- | :--- |
| **Move** | `W` `A` `S` `D` |
| **Jump** | `Space` |
| **Look** | `Mouse` |
| **Mine / Explode TNT** | `Left Click` |
| **Place Block** | `Right Click` |
| **Select Block** | `1` - `8` |
| **Open Crafting** | `E` |
| **Capture Mouse** | `Left Click (on screen)` |

---

## ✨ Features

* **🌍 Infinite Terrain:** Procedural world generation using noise functions with chunk-based loading for endless exploration.
* **💥 Voxel Physics:** Falling sand gravity and TNT-based explosions that modify the landscape.
* **🌊 Dynamic Liquids:** Spreading Water and Lava with swimming mechanics and fire damage.
* **🛠️ Survival Systems:** Health and Hunger bars with food (Apples) and a crafting menu for tools.
* **📦 Chest System:** Functional storage containers that save their inventory to specific coordinates.
* **☀️ Ultra Graphics:** Real-time shadow mapping, ambient occlusion, and a dynamic Day/Night cycle.
* **🔊 Procedural Audio:** 8-bit sound effects synthesized in real-time via the Web Audio API.

---

## 🛠️ Technical Details

* **Engine:** [Three.js](https://threejs.org/) (WebGL)
* **Physics:** Custom AABB collision detection and voxel-step gravity.
* **Storage:** `localStorage` integration for persistent world saving.
* **Architecture:** Chunk-based memory management to maintain high FPS during infinite travel.

---

## 📄 License
This project is open-source and available under the MIT License.
