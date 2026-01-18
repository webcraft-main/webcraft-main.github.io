// config.js — global engine constants

// Chunk dimensions
export const CHUNK_SIZE = 16;          // X and Z size
export const WORLD_HEIGHT = 128;       // Y size

// Derived values
export const CHUNK_AREA = CHUNK_SIZE * CHUNK_SIZE;
export const CHUNK_VOLUME = CHUNK_SIZE * CHUNK_SIZE * WORLD_HEIGHT;

// World generation
export const RENDER_DISTANCE = 4;      // chunks in each direction

// Meshing
export const USE_GREEDY_MESHING = true;

// Debug flags
export const DEBUG_CHUNK_LOAD = false;
export const DEBUG_MESH = false;

