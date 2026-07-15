import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const metadata = JSON.parse(await fs.readFile(path.join(root, 'data', 'icons.json'), 'utf8'));
const errors = [];
const seenIds = new Set();
const seenEmoji = new Set();

if (metadata.version !== 1) errors.push('data/icons.json: unsupported manifest version');
if (metadata.status !== 'alpha') errors.push('data/icons.json: initial release must remain alpha');
if (metadata.icons.length !== 96) errors.push(`data/icons.json: expected 96 approved icons, found ${metadata.icons.length}`);

for (const icon of metadata.icons) {
  if (seenIds.has(icon.id)) errors.push(`Duplicate id: ${icon.id}`);
  if (seenEmoji.has(icon.emoji)) errors.push(`Duplicate emoji: ${icon.emoji}`);
  seenIds.add(icon.id);
  seenEmoji.add(icon.emoji);

  const sourcePath = path.join(root, 'icons', `${icon.id}.svg`);
  let source;
  try {
    source = await fs.readFile(sourcePath, 'utf8');
  } catch {
    errors.push(`Missing master SVG: ${icon.id}`);
    continue;
  }

  if (!/viewBox="0 0 256 256"/.test(source)) errors.push(`${icon.id}: viewBox must be 0 0 256 256`);
  if (/\b(?:width|height)="/i.test(source)) errors.push(`${icon.id}: fixed width/height is forbidden`);
  if (/<(?:script|image|foreignObject|text)\b/i.test(source)) errors.push(`${icon.id}: unsafe or unsupported SVG element`);
  if (/\b(?:href|xlink:href)=|url\s*\(/i.test(source)) errors.push(`${icon.id}: external references are forbidden`);
  if (!source.includes('fill="#090909"')) errors.push(`${icon.id}: master ink must be #090909`);

  const illustrationPath = path.join(root, 'dist', 'illustration', `${icon.id}.svg`);
  const emojiSvgPath = path.join(root, 'dist', 'emoji-svg', `${icon.id}.svg`);
  try {
    const illustration = await fs.readFile(illustrationPath, 'utf8');
    if (!illustration.includes('fill="currentColor"')) errors.push(`${icon.id}: illustration build must use currentColor`);
    const emoji = await fs.readFile(emojiSvgPath, 'utf8');
    if (!emoji.includes('fill="#0AF40B"')) errors.push(`${icon.id}: emoji build must use the Iconic field color`);
  } catch {
    errors.push(`${icon.id}: build outputs are missing; run npm run build`);
  }

  const slackPng = path.join(root, 'dist', 'emoji-png', '128', `${icon.id}.png`);
  try {
    const stat = await fs.stat(slackPng);
    if (stat.size >= 128 * 1024) errors.push(`${icon.id}: 128 px PNG exceeds Slack's 128 KB guidance`);
  } catch {
    errors.push(`${icon.id}: 128 px PNG is missing`);
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${metadata.icons.length} approved icons and all distributable formats.`);
}
