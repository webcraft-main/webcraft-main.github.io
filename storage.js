// storage.js — binary chunk save/load

import { CHUNK_SIZE, WORLD_HEIGHT } from './config.js';

const CHUNK_VOLUME = CHUNK_SIZE * CHUNK_SIZE * WORLD_HEIGHT;

export function createEmptyChunk(cx, cz) {
    return {
        cx, cz,
        blocks: new Uint16Array(CHUNK_VOLUME),
        blockStates: new Uint16Array(CHUNK_VOLUME),
        mesh: null,
        needsRemesh: true
    };
}

function encodeArray(arr) {
    return btoa(String.fromCharCode(...new Uint8Array(arr.buffer)));
}

function decodeArray(str) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Uint16Array(bytes.buffer);
}

export function saveChunk(chunk) {
    return {
        cx: chunk.cx,
        cz: chunk.cz,
        blocks: encodeArray(chunk.blocks),
        blockStates: encodeArray(chunk.blockStates)
    };
}

export function loadChunk(data) {
    return {
        cx: data.cx,
        cz: data.cz,
        blocks: decodeArray(data.blocks),
        blockStates: decodeArray(data.blockStates),
        mesh: null,
        needsRemesh: true
    };
}

