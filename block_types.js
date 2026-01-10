import { registerBlock } from "./blocks.js";

/* BASIC MATERIAL COLORS */
const COLORS = {
    grass: 0x55aa55,
    dirt: 0x8b4513,
    stone: 0x808080,
    sand: 0xedc9af,
    gravel: 0x777777,
    oak_log: 0x4b2d13,
    oak_leaves: 0x228b22,
    water: 0x0066ff,
    lava: 0xff4500,
    deepslate: 0x2a2a2a,
    snow: 0xffffff,
    netherrack: 0x7a0000,
    endstone: 0xffffaa
};

/* OVERWORLD BASICS */
registerBlock("grass", { color: COLORS.grass });
registerBlock("dirt", { color: COLORS.dirt });
registerBlock("stone", { color: COLORS.stone });
registerBlock("sand", { color: COLORS.sand });
registerBlock("gravel", { color: COLORS.gravel });

/* WOOD + LEAVES */
registerBlock("oak_log", { color: COLORS.oak_log });
registerBlock("oak_leaves", { color: COLORS.oak_leaves, transparent: true });

/* FLUIDS */
registerBlock("water", { color: COLORS.water, transparent: true, fluid: true });
registerBlock("lava", { color: COLORS.lava, transparent: true, fluid: true, light: 15 });

/* SNOW */
registerBlock("snow", { color: COLORS.snow });

/* VOLCANIC */
registerBlock("deepslate", { color: COLORS.deepslate });

/* TNT */
registerBlock("tnt", { color: 0xff0000 });

/* NETHER */
registerBlock("netherrack", { color: COLORS.netherrack });
registerBlock("nether_quartz_ore", { color: 0xffffff });

/* END */
registerBlock("end_stone", { color: COLORS.endstone });

/* ORES */
registerBlock("coal_ore", { color: 0x333333 });
registerBlock("iron_ore", { color: 0xd8af93 });
registerBlock("gold_ore", { color: 0xffd700 });
registerBlock("diamond_ore", { color: 0x00ffff });
registerBlock("redstone_ore", { color: 0xaa0000, light: 7 });
registerBlock("emerald_ore", { color: 0x00ff00 });
