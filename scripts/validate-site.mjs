import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'site-dist');
const metadata = JSON.parse(await fs.readFile(path.join(root, 'data', 'icons.json'), 'utf8'));
const errors = [];

async function read(relativePath) {
  try {
    return await fs.readFile(path.join(outputDir, relativePath), 'utf8');
  } catch {
    errors.push(`Missing generated file: ${relativePath}`);
    return '';
  }
}

const home = await read('index.html');
const sitemap = await read('sitemap.xml');
const imageSitemap = await read('image-sitemap.xml');
const robots = await read('robots.txt');
const llms = await read('llms.txt');

if (!home.includes('application/ld+json')) errors.push('Homepage is missing JSON-LD');
if (!home.includes('data-icon-item')) errors.push('Homepage is missing static icon entries');
if (!robots.includes('OAI-SearchBot')) errors.push('robots.txt is missing OAI-SearchBot guidance');
if (!robots.includes('GPTBot\nDisallow: /')) errors.push('robots.txt does not separate search from training access');
if (!llms.includes('Roman Kuzhel, Kyrgyzstan')) errors.push('llms.txt is missing creator attribution');

for (const icon of metadata.icons) {
  const detail = await read(path.join('icons', icon.id, 'index.html'));
  if (!detail.includes(`<title>${icon.name} SVG icon and custom emoji`)) errors.push(`${icon.id}: title is missing`);
  if (!detail.includes('"@type":"ImageObject"')) errors.push(`${icon.id}: ImageObject JSON-LD is missing`);
  if (!detail.includes('Roman Kuzhel, Kyrgyzstan')) errors.push(`${icon.id}: attribution is missing`);
  if (!detail.includes('rel="canonical"')) errors.push(`${icon.id}: canonical URL is missing`);
  if (!sitemap.includes(`/icons/${icon.id}/`)) errors.push(`${icon.id}: missing from sitemap.xml`);
  if (!imageSitemap.includes(`/assets/illustration/${icon.id}.svg`)) errors.push(`${icon.id}: missing from image sitemap`);

  for (const relativePath of [
    path.join('assets', 'illustration', `${icon.id}.svg`),
    path.join('assets', 'emoji-svg', `${icon.id}.svg`),
    path.join('assets', 'emoji-png', '128', `${icon.id}.png`),
    path.join('assets', 'emoji-png', '256', `${icon.id}.png`),
    path.join('assets', 'emoji-png', '512', `${icon.id}.png`),
  ]) {
    try {
      await fs.access(path.join(outputDir, relativePath));
    } catch {
      errors.push(`${icon.id}: missing asset ${relativePath}`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${metadata.icons.length} crawlable icon pages, assets, sitemaps, and AI discovery files.`);
}
