export const blockstates = new Map();

export function registerBlockstate(name, json) {
    blockstates.set(name, json);
}

export function getBlockstate(name) {
    return blockstates.get(name);
}
