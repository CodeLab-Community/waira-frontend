const fs = require("node:fs/promises");
const path = require("node:path");
const { PNG } = require("pngjs");

const ROOT = path.resolve(__dirname, "..");
const INPUT_ROOT = path.join(ROOT, "public", "personalizacion");
const OUTPUT_ROOT = path.join(INPUT_ROOT, "data");

const SIZE = 16;
const DEFAULT_LAYER_ORDER = ["ropa", "pelo", "pantalon"];

const palette = {
  outline: "0b0b0b",
  hair: "191015",
  skin: "fbc5ab",
  mouth: "e5b69f",
  primary: "303231",
  primaryShadow: "1d1f1e",
  secondary: "f4f3ee",
  secondaryShadow: "d3d2cd",
  pants: "3f3f74",
  pantsShadow: "29294b",
};

const legend = {
  ".": "empty",
  o: "outline",
  h: "hair",
  s: "skin",
  m: "mouth",
  p: "primary",
  q: "primaryShadow",
  c: "secondary",
  d: "secondaryShadow",
  t: "pants",
  u: "pantsShadow",
};

const roleToToken = Object.entries(legend).reduce((acc, [token, role]) => {
  if (role !== "empty") {
    acc[role] = token;
  }
  return acc;
}, {});

const colorToToken = new Map(
  Object.entries(palette).map(([role, hex]) => [hex, roleToToken[role]])
);

function toHex(value) {
  return value.toString(16).padStart(2, "0");
}

function rgbaToToken(r, g, b, a, unknownColors) {
  if (a === 0) {
    return ".";
  }
  if (a !== 255) {
    unknownColors.add(`rgba(${r},${g},${b},${a})`);
    return ".";
  }
  const hex = `${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
  const token = colorToToken.get(hex);
  if (!token) {
    unknownColors.add(hex);
    return ".";
  }
  return token;
}

async function readPng(filePath) {
  const buffer = await fs.readFile(filePath);
  return PNG.sync.read(buffer);
}

async function getCategoryDirs() {
  const entries = await fs.readdir(INPUT_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== "data")
    .map((entry) => entry.name);
}

async function getPngFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() && path.extname(entry.name).toLowerCase() === ".png"
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function buildCategory(category) {
  const categoryPath = path.join(INPUT_ROOT, category);
  const files = await getPngFiles(categoryPath);
  const sprites = [];

  for (const fileName of files) {
    const filePath = path.join(categoryPath, fileName);
    const png = await readPng(filePath);

    if (png.width !== SIZE || png.height !== SIZE) {
      throw new Error(
        `Invalid size for ${path.relative(
          ROOT,
          filePath
        )}: expected ${SIZE}x${SIZE}, got ${png.width}x${png.height}`
      );
    }

    const rows = [];
    const unknownColors = new Set();

    for (let y = 0; y < png.height; y += 1) {
      let row = "";
      for (let x = 0; x < png.width; x += 1) {
        const idx = (png.width * y + x) * 4;
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];
        const a = png.data[idx + 3];
        row += rgbaToToken(r, g, b, a, unknownColors);
      }
      rows.push(row);
    }

    if (unknownColors.size > 0) {
      throw new Error(
        `Unknown colors in ${path.relative(ROOT, filePath)}: ${[
          ...unknownColors,
        ].join(", ")}`
      );
    }

    sprites.push({
      id: path.basename(fileName, path.extname(fileName)),
      rows,
    });
  }

  return {
    category,
    size: [SIZE, SIZE],
    sprites,
  };
}

async function writeJson(filePath, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, json, "utf8");
}

async function run() {
  const categoryDirs = await getCategoryDirs();
  if (categoryDirs.length === 0) {
    throw new Error(
      `No category folders found in ${path.relative(ROOT, INPUT_ROOT)}`
    );
  }

  const layerOrder = [
    ...DEFAULT_LAYER_ORDER.filter((name) => categoryDirs.includes(name)),
    ...categoryDirs.filter((name) => !DEFAULT_LAYER_ORDER.includes(name)),
  ];

  await fs.mkdir(OUTPUT_ROOT, { recursive: true });

  const categories = {};
  for (const category of categoryDirs) {
    const data = await buildCategory(category);
    const outFile = path.join(OUTPUT_ROOT, `${category}.json`);
    await writeJson(outFile, data);
    categories[category] = path.relative(OUTPUT_ROOT, outFile).replace(/\\/g, "/");
  }

  const manifest = {
    version: 1,
    size: [SIZE, SIZE],
    layerOrder,
    legend,
    palette,
    categories,
  };

  await writeJson(path.join(OUTPUT_ROOT, "manifest.json"), manifest);

  const categoryCount = Object.values(categories).length;
  console.log(
    `Generated ${categoryCount} category file(s) in ${path.relative(
      ROOT,
      OUTPUT_ROOT
    )}`
  );
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
