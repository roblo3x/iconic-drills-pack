import fs from 'node:fs/promises';
import path from 'node:path';

const sourceFlag = process.argv.indexOf('--source');
if (sourceFlag === -1 || !process.argv[sourceFlag + 1]) {
  throw new Error('Usage: npm run bootstrap -- --source /path/to/ddrills-exercise-generator');
}

const root = process.cwd();
const sourceRoot = path.resolve(process.argv[sourceFlag + 1]);
const manifestPath = path.join(sourceRoot, 'public', 'iconic', 'generated', 'emoji-manifest.json');
const sourceIconsDir = path.join(sourceRoot, 'public', 'iconic', 'generated', 'icons');
const targetIconsDir = path.join(root, 'icons');
const targetDataFile = path.join(root, 'data', 'icons.json');
const unicodeUrl = 'https://www.unicode.org/Public/emoji/latest/emoji-test.txt';

const [manifest, unicodeResponse] = await Promise.all([
  fs.readFile(manifestPath, 'utf8').then(JSON.parse),
  fetch(unicodeUrl),
]);

if (!unicodeResponse.ok) throw new Error(`Unicode data request failed: ${unicodeResponse.status}`);

const unicodeSource = await unicodeResponse.text();
if (!/^# Version: 17\.0$/m.test(unicodeSource)) {
  throw new Error('The official latest emoji-test.txt is not Unicode Emoji 17.0. Review before importing.');
}
const unicodeRecords = parseUnicodeEmojiTest(unicodeSource);
const approved = manifest.approvedBatches.flatMap((batch) => batch.items);

await fs.rm(targetIconsDir, { recursive: true, force: true });
await fs.mkdir(targetIconsDir, { recursive: true });

const icons = [];
for (const item of approved) {
  const record = unicodeRecords.get(withoutVariationSelectors(item.hexcode));
  if (!record) throw new Error(`No official Unicode record for ${item.emoji} (${item.hexcode})`);

  const sourceFile = path.join(sourceIconsDir, `${item.hexcode}.svg`);
  const source = await fs.readFile(sourceFile, 'utf8');
  const body = source.match(/<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/i)?.[1]?.trim();
  if (!body) throw new Error(`Invalid source SVG: ${sourceFile}`);

  const attribution = '<!-- Iconic Drills Pack © 2026 Roman Kuzhel, Kyrgyzstan | CC BY 4.0 | https://github.com/roblo3x/iconic-drills-pack -->';
  const master = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${attribution}${body}</svg>\n`;
  await fs.writeFile(path.join(targetIconsDir, `${item.hexcode}.svg`), master);

  const keywords = [...new Set(record.name.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean))];
  icons.push({
    id: item.hexcode,
    unicodeSequence: record.codepoints,
    emoji: item.emoji,
    name: record.name,
    category: slug(record.group),
    subcategory: slug(record.subgroup),
    keywords,
    assets: {
      illustration: `illustration/${item.hexcode}.svg`,
      emojiSvg: `emoji-svg/${item.hexcode}.svg`,
      emojiPng: {
        128: `emoji-png/128/${item.hexcode}.png`,
        256: `emoji-png/256/${item.hexcode}.png`,
        512: `emoji-png/512/${item.hexcode}.png`,
      },
    },
  });
}

const data = {
  version: 1,
  status: 'alpha',
  unicodeVersion: '17.0',
  creator: {
    name: 'Roman Kuzhel',
    country: 'Kyrgyzstan',
    attribution: 'Roman Kuzhel, Kyrgyzstan',
    url: 'https://github.com/roblo3x',
  },
  license: {
    name: 'Creative Commons Attribution 4.0 International',
    spdx: 'CC-BY-4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
  source: 'https://github.com/roblo3x/iconic-drills-pack',
  count: icons.length,
  icons,
};

await fs.mkdir(path.dirname(targetDataFile), { recursive: true });
await fs.writeFile(targetDataFile, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Imported ${icons.length} approved masters with Unicode 17.0 metadata.`);

function parseUnicodeEmojiTest(source) {
  const records = new Map();
  let group = '';
  let subgroup = '';

  for (const line of source.split(/\r?\n/)) {
    if (line.startsWith('# group:')) {
      group = line.slice('# group:'.length).trim();
      continue;
    }
    if (line.startsWith('# subgroup:')) {
      subgroup = line.slice('# subgroup:'.length).trim();
      continue;
    }

    const match = line.match(/^([0-9A-F ]+)\s*;\s*fully-qualified\s*#\s*(\S+)\s+E[0-9.]+\s+(.+)$/);
    if (!match) continue;

    const codepoints = match[1].trim().replaceAll(' ', '-');
    const key = withoutVariationSelectors(codepoints);
    if (!records.has(key)) {
      records.set(key, { codepoints, emoji: match[2], name: match[3].trim(), group, subgroup });
    }
  }

  return records;
}

function withoutVariationSelectors(id) {
  return id.split('-').filter((code) => code !== 'FE0E' && code !== 'FE0F').join('-');
}

function slug(value) {
  return value.toLowerCase().replaceAll('&', ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
