import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import paper from 'paper';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const root = process.cwd();
const sourceDir = path.resolve(root, args.get('--source') || 'icons');
const outputDir = path.resolve(root, args.get('--output') || 'icons');
const tolerance = Number(args.get('--tolerance') || 0.5);
const sampleStep = Number(args.get('--sample-step') || 2);
const passes = Number(args.get('--passes') || 1);

if (!Number.isFinite(tolerance) || tolerance <= 0) {
  throw new Error('--tolerance must be a positive number.');
}

if (!Number.isFinite(sampleStep) || sampleStep <= 0) {
  throw new Error('--sample-step must be a positive number.');
}

if (!Number.isInteger(passes) || passes < 1 || passes > 4) {
  throw new Error('--passes must be an integer from 1 to 4.');
}

paper.setup(new paper.Size(256, 256));
await fs.mkdir(outputDir, { recursive: true });

const files = (await fs.readdir(sourceDir))
  .filter((filename) => filename.endsWith('.svg'))
  .sort();
let smoothedCount = 0;
let retainedCount = 0;

for (const filename of files) {
  const source = await fs.readFile(path.join(sourceDir, filename), 'utf8');
  if (source.includes('data-contour-smoothing="organic-v2"')) {
    if (sourceDir !== outputDir) await fs.writeFile(path.join(outputDir, filename), source);
    retainedCount += 1;
    continue;
  }

  const pathMatch = source.match(/<path\s+([^>]*?)d="([^"]+)"([^>]*)\/>/);
  if (!pathMatch) throw new Error(`${filename}: expected one self-closing path.`);

  const commands = [...pathMatch[2].matchAll(/[A-Za-z]/g)].map((match) => match[0]);
  const unsupported = [...new Set(commands)].filter((command) => !['M', 'C', 'Z'].includes(command));
  if (unsupported.length) {
    throw new Error(`${filename}: unsupported path commands ${unsupported.join(', ')}.`);
  }

  const artwork = new paper.CompoundPath(pathMatch[2]);
  const smoothedContours = [];
  for (const contour of artwork.children) {
    const sampleCount = Math.max(12, Math.ceil(contour.length / sampleStep));
    let points = Array.from({ length: sampleCount }, (_, index) => (
      contour.getPointAt((index / sampleCount) * contour.length)
    ));

    for (let pass = 0; pass < passes; pass += 1) {
      points = points.map((_, index) => {
        const point = new paper.Point(0, 0);
        const weights = [1, 4, 6, 4, 1];
        for (let offset = -2; offset <= 2; offset += 1) {
          const neighbor = points[(index + offset + points.length) % points.length];
          point.x += neighbor.x * weights[offset + 2];
          point.y += neighbor.y * weights[offset + 2];
        }
        return point.divide(16);
      });
    }

    const smoothed = new paper.Path({ segments: points, closed: true, insert: false });
    if (contour.area && smoothed.area) {
      const areaScale = Math.sqrt(Math.abs(contour.area / smoothed.area));
      smoothed.scale(areaScale, contour.bounds.center);
    }
    smoothed.simplify(tolerance);
    smoothedContours.push(smoothed.pathData);
    smoothed.remove();
  }

  const smoothedPath = smoothedContours.join('');
  artwork.remove();

  const output = source
    .replace(/\sdata-contour-smoothing="[^"]+"/, '')
    .replace('<svg ', '<svg data-contour-smoothing="organic-v2" ')
    .replace(pathMatch[0], `<path ${pathMatch[1]}d="${smoothedPath}"${pathMatch[3]}/>`);

  await fs.writeFile(path.join(outputDir, filename), output);
  smoothedCount += 1;
}

console.log(`Smoothed ${smoothedCount} master SVGs with ${passes} contour pass(es); retained ${retainedCount} organic-v2 masters.`);
