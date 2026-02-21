// config.js — global engine constants

// -----------------------------------------------------
// CHUNK DIMENSIONS
// -----------------------------------------------------

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = 256;
export const CHUNK_SIZE_Z = 16;

export const CHUNK_RADIUS = 6; // how many chunks to load around player

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


