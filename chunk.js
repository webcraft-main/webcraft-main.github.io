import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from "./config.js";

export class Chunk {
    constructor(cx, cz) {
        this.cx = cx;
        this.cz = cz;

        this.blocks = new Uint16Array(CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z);

        this.needsRemesh = true;
        this.mesh = null;
    }

    index(x, y, z) {
        return x + CHUNK_SIZE_X * (z + CHUNK_SIZE_Z * y);
    }

    getBlock(x, y, z) {
        if (
            x < 0 || x >= CHUNK_SIZE_X ||
            y < 0 || y >= CHUNK_SIZE_Y ||
            z < 0 || z >= CHUNK_SIZE_Z
        ) return 0;
        return this.blocks[this.index(x, y, z)];
    }

    setBlock(x, y, z, id) {
        if (
            x < 0 || x >= CHUNK_SIZE_X ||
            y < 0 || y >= CHUNK_SIZE_Y ||
            z < 0 || z >= CHUNK_SIZE_Z
        ) return;
        this.blocks[this.index(x, y, z)] = id;
        this.needsRemesh = true;
    }
}
