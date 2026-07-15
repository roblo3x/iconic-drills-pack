import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const iconsDir = path.join(root, 'icons');
const dataFile = path.join(root, 'data', 'icons.json');
const distDir = path.join(root, 'dist');
const sizes = [128, 256, 512];
const ink = '#090909';
const field = '#0AF40B';

const metadata = JSON.parse(await fs.readFile(dataFile, 'utf8'));

await fs.rm(distDir, { recursive: true, force: true });
await Promise.all([
  fs.mkdir(path.join(distDir, 'illustration'), { recursive: true }),
  fs.mkdir(path.join(distDir, 'emoji-svg'), { recursive: true }),
  fs.mkdir(path.join(distDir, 'data'), { recursive: true }),
  ...sizes.map((size) => fs.mkdir(path.join(distDir, 'emoji-png', String(size)), { recursive: true })),
]);

for (const icon of metadata.icons) {
  const filename = `${icon.id}.svg`;
  const source = await fs.readFile(path.join(iconsDir, filename), 'utf8');
  const match = source.match(/<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/i);

  if (!match) throw new Error(`Invalid SVG root: ${filename}`);

  const body = match[1].trim();
  const illustrationBody = body.replaceAll(ink, 'currentColor');
  const illustration = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-hidden="true">${illustrationBody}</svg>\n`;
  const emoji = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-hidden="true"><rect x="8" y="8" width="240" height="240" rx="56" fill="${field}"/>${body}</svg>\n`;

  await Promise.all([
    fs.writeFile(path.join(distDir, 'illustration', filename), illustration),
    fs.writeFile(path.join(distDir, 'emoji-svg', filename), emoji),
    ...sizes.map((size) =>
      sharp(Buffer.from(emoji))
        .resize(size, size)
        .png({ compressionLevel: 9, palette: true, colours: 64 })
        .toFile(path.join(distDir, 'emoji-png', String(size), `${icon.id}.png`)),
    ),
  ]);
}

await fs.writeFile(path.join(distDir, 'data', 'icons.json'), `${JSON.stringify(metadata, null, 2)}\n`);

const publicIcons = metadata.icons.map((icon) => ({ ...icon }));
const publicPack = {
  version: metadata.version,
  status: metadata.status,
  unicodeVersion: metadata.unicodeVersion,
  creator: metadata.creator,
  license: metadata.license,
  source: metadata.source,
};
const runtime = `const pack = Object.freeze(${JSON.stringify(publicPack)});
const icons = Object.freeze(${JSON.stringify(publicIcons)}.map((icon) => Object.freeze(icon)));
const byId = new Map(icons.map((icon) => [icon.id, icon]));
const byAlias = new Map();

function withoutVariationSelectors(id) {
  return id.split('-').filter((code) => code !== 'FE0E' && code !== 'FE0F').join('-');
}

export function toCodepoints(value, options = {}) {
  const id = [...String(value)].map((character) => character.codePointAt(0).toString(16).toUpperCase()).join('-');
  return options.stripVariationSelectors ? withoutVariationSelectors(id) : id;
}

for (const icon of icons) {
  byAlias.set(withoutVariationSelectors(icon.id), icon);
  byAlias.set(withoutVariationSelectors(toCodepoints(icon.emoji)), icon);
}

export { icons, pack };

export function getIcon(value) {
  if (value == null) return undefined;
  const input = String(value).trim();
  const id = /^[0-9a-f-]+$/i.test(input) ? input.toUpperCase() : toCodepoints(input);
  return byId.get(id) ?? byAlias.get(withoutVariationSelectors(id));
}

export function searchIcons(query, options = {}) {
  const terms = String(query).toLowerCase().trim().split(/\\s+/).filter(Boolean);
  const limit = Number.isFinite(options.limit) ? Math.max(0, options.limit) : 24;
  if (terms.length === 0) return icons.slice(0, limit);

  return icons
    .filter((icon) => {
      const haystack = [icon.name, icon.category, icon.subcategory, ...icon.keywords].join(' ').toLowerCase();
      return terms.every((term) => haystack.includes(term));
    })
    .slice(0, limit);
}

export function getAssetPath(value, variant = 'illustration', size = 128) {
  const icon = getIcon(value);
  if (!icon) return undefined;
  if (variant === 'illustration') return 'illustration/' + icon.id + '.svg';
  if (variant === 'emoji-svg') return 'emoji-svg/' + icon.id + '.svg';
  if (variant === 'emoji-png') {
    if (![128, 256, 512].includes(size)) throw new RangeError('Emoji PNG size must be 128, 256, or 512.');
    return 'emoji-png/' + size + '/' + icon.id + '.png';
  }
  throw new TypeError('Unknown asset variant: ' + variant);
}
`;

const types = `export type IconicCategory = string;

export interface IconicPack {
  readonly version: number;
  readonly status: string;
  readonly unicodeVersion: string;
  readonly creator: {
    readonly name: string;
    readonly country: string;
    readonly attribution: string;
    readonly url: string;
  };
  readonly license: {
    readonly name: string;
    readonly spdx: 'CC-BY-4.0';
    readonly url: string;
  };
  readonly source: string;
}

export interface IconicIcon {
  readonly id: string;
  readonly unicodeSequence: string;
  readonly emoji: string;
  readonly name: string;
  readonly category: IconicCategory;
  readonly subcategory: string;
  readonly keywords: readonly string[];
  readonly assets: {
    readonly illustration: string;
    readonly emojiSvg: string;
    readonly emojiPng: Readonly<Record<'128' | '256' | '512', string>>;
  };
}

export declare const pack: IconicPack;
export declare const icons: readonly IconicIcon[];
export declare function toCodepoints(value: string, options?: { stripVariationSelectors?: boolean }): string;
export declare function getIcon(value: string): IconicIcon | undefined;
export declare function searchIcons(query: string, options?: { limit?: number }): IconicIcon[];
export declare function getAssetPath(value: string, variant?: 'illustration' | 'emoji-svg' | 'emoji-png', size?: 128 | 256 | 512): string | undefined;
`;

await Promise.all([
  fs.writeFile(path.join(distDir, 'index.js'), runtime),
  fs.writeFile(path.join(distDir, 'index.d.ts'), types),
]);

console.log(`Built ${metadata.icons.length} icons in illustration SVG, emoji SVG, and ${sizes.join('/')} px PNG formats.`);
