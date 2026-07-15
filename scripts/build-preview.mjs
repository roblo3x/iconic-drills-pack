import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const metadata = JSON.parse(await fs.readFile(path.join(root, 'data', 'icons.json'), 'utf8'));
const columns = 12;
const tile = 72;
const gap = 16;
const padding = 24;
const rows = Math.ceil(metadata.icons.length / columns);
const width = padding * 2 + columns * tile + (columns - 1) * gap;
const height = padding * 2 + rows * tile + (rows - 1) * gap;

const composites = await Promise.all(metadata.icons.map(async (icon, index) => ({
  input: await sharp(path.join(root, 'dist', 'emoji-png', '128', `${icon.id}.png`))
    .resize(tile, tile)
    .png()
    .toBuffer(),
  left: padding + (index % columns) * (tile + gap),
  top: padding + Math.floor(index / columns) * (tile + gap),
})));

await fs.mkdir(path.join(root, 'docs'), { recursive: true });
await sharp({
  create: {
    width,
    height,
    channels: 4,
    background: '#F3F1EA',
  },
})
  .composite(composites)
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'docs', 'preview.png'));

console.log(`Built ${columns} × ${rows} visual preview.`);
