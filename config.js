// config.js — global engine constants

// -----------------------------------------------------
// CHUNK DIMENSIONS
// -----------------------------------------------------

// Horizontal chunk size (X and Z)
export const CHUNK_SIZE = 16;

// Vertical world height (Y)
export const WORLD_HEIGHT = 128;

// Derived values
export const CHUNK_AREA = CHUNK_SIZE * CHUNK_SIZE;
export const CHUNK_VOLUME = CHUNK_SIZE * CHUNK_SIZE * WORLD_HEIGHT;


// -----------------------------------------------------
// WORLD GENERATION / RENDERING
// -----------------------------------------------------

// How many chunks outward from the player to load
// RENDER_DISTANCE = 4 → 9×9 chunk grid (81 chunks)
export const RENDER_DISTANCE = 4;

// Maximum chunks to mesh per frame (prevents frame spikes)
export const MAX_MESHES_PER_FRAME = 2;


// -----------------------------------------------------
// MESHING
// -----------------------------------------------------

// Whether to use greedy meshing (always recommended)
export const USE_GREEDY_MESHING = true;

// Whether to cull faces against neighbors in other chunks
export const USE_CROSS_CHUNK_CULLING = true;


// -----------------------------------------------------
// DEBUG FLAGS
// -----------------------------------------------------

export const DEBUG_CHUNK_LOAD = false;
export const DEBUG_MESH = false;
export const DEBUG_ATLAS = false;   // new: logs atlas building
export const DEBUG_STATES = false;  // new: logs blockstate registry


