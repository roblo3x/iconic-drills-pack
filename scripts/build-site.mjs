import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'site-dist');
const siteUrl = (process.env.SITE_URL || 'https://roblo3x.github.io/iconic-drills-pack').replace(/\/$/, '');
const sitePath = new URL(siteUrl).pathname.replace(/\/$/, '');
const repositoryUrl = 'https://github.com/roblo3x/iconic-drills-pack';
const licenseUrl = 'https://creativecommons.org/licenses/by/4.0/';
const credit = 'Iconic Drills Pack © 2026 Roman Kuzhel, Kyrgyzstan — CC BY 4.0';
const emojiAssetRevision = 'c8ff00';
const metadata = JSON.parse(await fs.readFile(path.join(root, 'data', 'icons.json'), 'utf8'));
const logoSource = await fs.readFile(path.join(root, 'site-src', 'DdrillsLogo.jsx'), 'utf8');
const logoPaths = [...logoSource.matchAll(/<path d="([^"]+)" fill=\{fill\}\/>/g)].map((match) => match[1]);

if (metadata.icons.length !== 96) throw new Error(`Expected 96 icons, found ${metadata.icons.length}`);
if (logoPaths.length !== 12) throw new Error(`Expected 12 Ddrills logo paths, found ${logoPaths.length}`);

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const jsonLd = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');
const absolute = (value = '') => `${siteUrl}/${String(value).replace(/^\//, '')}`;
const local = (value = '') => `${sitePath}/${String(value).replace(/^\//, '')}`.replace(/^$/, '/');
const emojiAbsolute = (value) => `${absolute(value)}?v=${emojiAssetRevision}`;
const emojiLocal = (value) => `${local(value)}?v=${emojiAssetRevision}`;
const displayCategory = (value) => value.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
const ddrillsLogo = (className) => `<svg class="${className}" viewBox="0 0 210 80" aria-hidden="true" focusable="false">${logoPaths.map((d) => `<path d="${d}"/>`).join('')}</svg>`;

function head({ title, description, canonical, image, structuredData }) {
  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="author" content="Roman Kuzhel, Kyrgyzstan">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <link rel="license" href="${licenseUrl}">
    <link rel="icon" type="image/svg+xml" href="${emojiLocal('assets/emoji-svg/1F34E.svg')}">
    <link rel="sitemap" type="application/xml" href="${absolute('sitemap.xml')}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Iconic Drills Pack">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <link rel="stylesheet" href="${local('assets/styles.css')}">
    <script type="application/ld+json">${jsonLd(structuredData)}</script>`;
}

function header() {
  return `<header class="site-header">
    <a class="brand" href="${local('')}" aria-label="Ddrills Club — Iconic Pack">
      ${ddrillsLogo('brand-mark')}<span>Iconic</span>
    </a>
    <nav class="header-links" aria-label="Primary navigation">
      <a href="${local('#catalog')}">Pack</a>
      <a href="${local('usage/')}">License</a>
      <a href="${repositoryUrl}">GitHub ↗</a>
    </nav>
  </header>`;
}

function footer() {
  return `<footer class="site-footer">
    <a class="footer-brand" href="https://www.ddrills.xyz/" aria-label="Ddrills Club">${ddrillsLogo('footer-mark')}</a>
    <div class="footer-copy"><p>${credit}. Commercial use requires attribution.</p><p><a href="${local('usage/')}">How to credit</a> · <a href="${repositoryUrl}">Source on GitHub</a></p></div>
  </footer>`;
}

function page({ title, description, canonical, image, structuredData, content }) {
  return `<!doctype html>
<html lang="en">
<head>${head({ title, description, canonical, image, structuredData })}
</head>
<body>
  ${header()}
  ${content}
  ${footer()}
  <script type="module" src="${local('assets/app.js')}"></script>
</body>
</html>
`;
}

const categories = [...new Set(metadata.icons.map((icon) => icon.category))].sort();
const heroIcons = [metadata.icons[3], metadata.icons[15], metadata.icons[28], metadata.icons[42], metadata.icons[67], metadata.icons[88]];
const sampleIcon = metadata.icons.find((icon) => icon.id === '1F34E') || metadata.icons[0];

const collectionData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'Iconic Drills Pack',
      url: `${siteUrl}/`,
      description: 'A rough, hand-drawn SVG illustration and custom emoji pack by Roman Kuzhel.',
      creator: { '@id': `${siteUrl}/#creator` },
      license: licenseUrl,
      inLanguage: 'en',
    },
    {
      '@type': 'Person',
      '@id': `${siteUrl}/#creator`,
      name: 'Roman Kuzhel',
      homeLocation: { '@type': 'Country', name: 'Kyrgyzstan' },
      url: 'https://github.com/roblo3x',
    },
    {
      '@type': 'CollectionPage',
      '@id': `${siteUrl}/#collection`,
      name: 'Iconic Drills Pack — 96 hand-drawn icons',
      url: `${siteUrl}/`,
      isPartOf: { '@id': `${siteUrl}/#website` },
      creator: { '@id': `${siteUrl}/#creator` },
      license: licenseUrl,
      numberOfItems: metadata.icons.length,
      keywords: ['hand-drawn icons', 'SVG illustration pack', 'custom emoji', 'CC BY icons', 'emoji SVG', 'Slack emoji'],
      hasPart: metadata.icons.map((icon) => ({
        '@type': 'ImageObject',
        name: icon.name,
        url: absolute(`icons/${icon.id}/`),
        contentUrl: absolute(`assets/illustration/${icon.id}.svg`),
        license: licenseUrl,
        creditText: credit,
        creator: { '@id': `${siteUrl}/#creator` },
      })),
    },
    {
      '@type': 'SoftwareSourceCode',
      name: 'iconic-drills-pack',
      codeRepository: repositoryUrl,
      runtimePlatform: 'JavaScript',
      programmingLanguage: 'JavaScript',
      license: 'https://opensource.org/license/mit',
      author: { '@id': `${siteUrl}/#creator` },
    },
  ],
};

const cards = metadata.icons.map((icon) => {
  const search = [icon.name, icon.category, icon.subcategory, ...icon.keywords, icon.id, icon.emoji].join(' ').toLowerCase();
  return `<article class="icon-item" data-icon-item data-category="${escapeHtml(icon.category)}" data-search="${escapeHtml(search)}">
    <a class="icon-link" href="${local(`icons/${icon.id}/`)}" aria-label="View ${escapeHtml(icon.name)} icon">
      <img src="${local(`assets/illustration/${icon.id}.svg`)}" alt="Rough hand-drawn ${escapeHtml(icon.name)} icon" width="256" height="256" loading="lazy">
      <div class="icon-meta"><span class="icon-name">${escapeHtml(icon.name)}</span><span class="icon-code">U+${escapeHtml(icon.unicodeSequence)}</span></div>
    </a>
  </article>`;
}).join('\n');

const homeContent = `<main>
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="eyebrow">Ddrills Club® / Iconic</p>
      <h1 id="hero-title">Iconic<br>Drills Pack</h1>
      <p class="hero-lede">Rough, hand-drawn symbols built twice: as scalable illustrations and as ready-to-use custom emoji.</p>
      <div class="actions">
        <a class="button button--primary" href="#catalog">Explore all icons</a>
        <a class="button" href="${repositoryUrl}">Get the pack ↗</a>
      </div>
    </div>
    <div class="hero-art" aria-hidden="true">
      ${heroIcons.map((icon) => `<img class="hero-icon" src="${emojiLocal(`assets/emoji-svg/${icon.id}.svg`)}" alt="" width="256" height="256">`).join('\n')}
    </div>
  </section>

  <section class="intro reveal" aria-labelledby="intro-title">
    <h2 id="intro-title">One icon.<br>Two formats.</h2>
    <div class="intro-copy">
      <p>Use transparent, monochrome SVGs in interfaces and editorial layouts. Use the Ddrills acid-lime versions as emoji in Slack, Discord, documentation, and community spaces.</p>
      <p>Every icon has a stable Unicode code-point ID and downloadable SVG plus 128, 256, and 512 px PNG exports.</p>
    </div>
  </section>

  <section class="format-pair reveal" aria-label="Available formats">
    <div class="format">
      <figure>
        <img src="${local(`assets/illustration/${sampleIcon.id}.svg`)}" alt="${escapeHtml(sampleIcon.name)} as a transparent monochrome SVG illustration" width="430" height="430">
        <figcaption><span>Illustration SVG</span><span>currentColor</span></figcaption>
      </figure>
    </div>
    <div class="format">
      <figure>
        <img src="${emojiLocal(`assets/emoji-svg/${sampleIcon.id}.svg`)}" alt="${escapeHtml(sampleIcon.name)} as a Ddrills acid-lime custom emoji" width="430" height="430">
        <figcaption><span>Custom emoji</span><span>SVG + PNG</span></figcaption>
      </figure>
    </div>
  </section>

  <section class="catalog" id="catalog" aria-labelledby="catalog-title">
    <div class="catalog-head reveal">
      <div><p class="eyebrow">96 approved icons</p><h2 id="catalog-title">Icon pack</h2></div>
      <p class="count" data-result-count>${metadata.icons.length} icons</p>
    </div>
    <div class="filters">
      <label for="icon-search">Search icons</label>
      <input id="icon-search" type="search" placeholder="Search: apple, travel, face…" autocomplete="off" data-icon-search>
      <label for="category-filter">Filter by category</label>
      <select id="category-filter" data-category-filter>
        <option value="all">All categories</option>
        ${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(displayCategory(category))}</option>`).join('')}
      </select>
    </div>
    <div class="icon-grid">${cards}</div>
    <p class="empty-state" data-empty-state hidden>No icons match that search yet.</p>
  </section>
</main>`;

const home = page({
  title: 'Iconic Drills Pack — Hand-drawn SVG icons and custom emoji',
  description: 'Browse 96 rough, hand-drawn icons by Roman Kuzhel, available as scalable SVG illustrations and custom emoji PNGs under CC BY 4.0.',
  canonical: `${siteUrl}/`,
  image: absolute('assets/preview.png'),
  structuredData: collectionData,
  content: homeContent,
});

const usageData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'How to use and credit Iconic Drills Pack',
  url: absolute('usage/'),
  isPartOf: { '@id': `${siteUrl}/#website` },
  about: {
    '@type': 'CreativeWork',
    name: 'Iconic Drills Pack',
    creator: { '@id': `${siteUrl}/#creator` },
    license: licenseUrl,
  },
};

const usageContent = `<main class="usage">
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="${local('')}">Iconic Drills Pack</a> / Usage &amp; license</nav>
  <p class="eyebrow">Use it. Credit it. Keep creating.</p>
  <h1>Usage &amp;<br>attribution.</h1>
  <section>
    <h2>What you can do</h2>
    <p>The icon artwork is licensed under Creative Commons Attribution 4.0 International. You may copy, adapt, and use it in personal and commercial work, provided you give appropriate credit, link to the license, and indicate changes.</p>
  </section>
  <section>
    <h2>Required credit</h2>
    <p>Place the credit where it is reasonable for the medium: in credits, acknowledgements, an About screen, documentation, or license notices.</p>
    <pre><code>Iconic Drills Pack © 2026 Roman Kuzhel, Kyrgyzstan
Source: https://github.com/roblo3x/iconic-drills-pack
License: CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
Changes were made, if applicable.</code></pre>
  </section>
  <section>
    <h2>Install from GitHub</h2>
    <pre><code>npm install github:roblo3x/iconic-drills-pack#v0.1.0-alpha.1</code></pre>
    <p>The public npm registry release is planned after alpha review.</p>
  </section>
  <section>
    <h2>Artwork provenance</h2>
    <p>The artwork is AI-assisted, human-directed, selected, edited, vectorized, and curated by Roman Kuzhel. No OpenMoji artwork is included.</p>
  </section>
</main>`;

const usagePage = page({
  title: 'Usage and attribution — Iconic Drills Pack',
  description: 'How to use Iconic Drills Pack in personal and commercial projects with the required CC BY 4.0 attribution to Roman Kuzhel, Kyrgyzstan.',
  canonical: absolute('usage/'),
  image: absolute('assets/preview.png'),
  structuredData: usageData,
  content: usageContent,
});

await fs.rm(outputDir, { recursive: true, force: true });
await Promise.all([
  fs.mkdir(path.join(outputDir, 'assets'), { recursive: true }),
  fs.mkdir(path.join(outputDir, 'usage'), { recursive: true }),
]);

await Promise.all([
  fs.cp(path.join(root, 'dist', 'illustration'), path.join(outputDir, 'assets', 'illustration'), { recursive: true }),
  fs.cp(path.join(root, 'dist', 'emoji-svg'), path.join(outputDir, 'assets', 'emoji-svg'), { recursive: true }),
  fs.cp(path.join(root, 'dist', 'emoji-png'), path.join(outputDir, 'assets', 'emoji-png'), { recursive: true }),
  fs.cp(path.join(root, 'dist', 'data'), path.join(outputDir, 'assets', 'data'), { recursive: true }),
  fs.copyFile(path.join(root, 'site-src', 'styles.css'), path.join(outputDir, 'assets', 'styles.css')),
  fs.copyFile(path.join(root, 'site-src', 'app.js'), path.join(outputDir, 'assets', 'app.js')),
  fs.cp(path.join(root, 'site-src', 'fonts'), path.join(outputDir, 'assets', 'fonts'), { recursive: true }),
  fs.copyFile(path.join(root, 'docs', 'preview.png'), path.join(outputDir, 'assets', 'preview.png')),
  fs.writeFile(path.join(outputDir, 'index.html'), home),
  fs.writeFile(path.join(outputDir, 'usage', 'index.html'), usagePage),
  fs.writeFile(path.join(outputDir, '.nojekyll'), ''),
]);

for (const [index, icon] of metadata.icons.entries()) {
  const canonical = absolute(`icons/${icon.id}/`);
  const illustrationUrl = absolute(`assets/illustration/${icon.id}.svg`);
  const emojiSvgUrl = emojiAbsolute(`assets/emoji-svg/${icon.id}.svg`);
  const emojiPngUrl = emojiAbsolute(`assets/emoji-png/512/${icon.id}.png`);
  const previous = metadata.icons[(index - 1 + metadata.icons.length) % metadata.icons.length];
  const next = metadata.icons[(index + 1) % metadata.icons.length];
  const description = `Download the rough hand-drawn ${icon.name} icon by Roman Kuzhel as a transparent SVG illustration or Ddrills acid-lime custom emoji in SVG and PNG.`;
  const iconData = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    '@id': `${canonical}#image`,
    name: `${icon.name} — Iconic Drills Pack`,
    caption: `Rough hand-drawn ${icon.name} icon and custom emoji`,
    description,
    url: canonical,
    contentUrl: illustrationUrl,
    thumbnailUrl: emojiPngUrl,
    encodingFormat: 'image/svg+xml',
    license: licenseUrl,
    acquireLicensePage: absolute('usage/'),
    creditText: credit,
    copyrightNotice: 'Roman Kuzhel',
    creator: {
      '@type': 'Person',
      name: 'Roman Kuzhel',
      homeLocation: { '@type': 'Country', name: 'Kyrgyzstan' },
      url: 'https://github.com/roblo3x',
    },
    isPartOf: { '@id': `${siteUrl}/#collection` },
    keywords: [...icon.keywords, icon.category, icon.subcategory, 'hand-drawn icon', 'custom emoji'],
  };

  const detailContent = `<main class="detail-main">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="${local('')}">Iconic Drills Pack</a> / <a href="${local(`#catalog`)}">Catalog</a> / ${escapeHtml(icon.name)}</nav>
    <section class="detail-hero">
      <div class="detail-visual"><img src="${local(`assets/illustration/${icon.id}.svg`)}" alt="Hand-drawn ${escapeHtml(icon.name)} from the Iconic Drills Pack" width="512" height="512"></div>
      <div class="detail-copy">
        <span class="emoji-glyph" aria-hidden="true">${escapeHtml(icon.emoji)}</span>
        <h1>${escapeHtml(icon.name)}</h1>
        <dl class="detail-facts">
          <div><dt>Unicode ID</dt><dd>U+${escapeHtml(icon.unicodeSequence)}</dd></div>
          <div><dt>Category</dt><dd>${escapeHtml(displayCategory(icon.category))}</dd></div>
          <div><dt>Formats</dt><dd>SVG · PNG 128/256/512</dd></div>
          <div><dt>License</dt><dd><a href="${licenseUrl}">CC BY 4.0</a></dd></div>
        </dl>
        <div class="actions">
          <a class="button button--dark" href="${local(`assets/illustration/${icon.id}.svg`)}" download>Download SVG</a>
          <a class="button" href="${emojiLocal(`assets/emoji-png/512/${icon.id}.png`)}" download>Download PNG</a>
        </div>
      </div>
    </section>
    <section class="asset-row" aria-label="${escapeHtml(icon.name)} formats">
      <div class="asset-preview">
        <img src="${local(`assets/illustration/${icon.id}.svg`)}" alt="Transparent monochrome ${escapeHtml(icon.name)} SVG illustration" width="360" height="360">
        <h2>Illustration SVG</h2>
        <p>Transparent and scalable. Inherits color with <code>currentColor</code>.</p>
        <a href="${local(`assets/illustration/${icon.id}.svg`)}" download>Download illustration</a>
      </div>
      <div class="asset-preview">
        <img src="${emojiLocal(`assets/emoji-svg/${icon.id}.svg`)}" alt="Ddrills acid-lime ${escapeHtml(icon.name)} custom emoji" width="360" height="360">
        <h2>Custom emoji</h2>
        <p>Acid-lime SVG plus compact PNG exports for chat and community tools.</p>
        <a href="${emojiLocal(`assets/emoji-svg/${icon.id}.svg`)}" download>SVG</a> ·
        <a href="${emojiLocal(`assets/emoji-png/128/${icon.id}.png`)}" download>128 PNG</a> ·
        <a href="${emojiLocal(`assets/emoji-png/256/${icon.id}.png`)}" download>256 PNG</a> ·
        <a href="${emojiLocal(`assets/emoji-png/512/${icon.id}.png`)}" download>512 PNG</a>
      </div>
    </section>
    <section class="license-note">
      <h2>Use with attribution.</h2>
      <p>This artwork may be used in personal and commercial projects under CC BY 4.0. Credit <strong>Roman Kuzhel, Kyrgyzstan</strong>, link to the source and license, and note modifications. <a href="${local('usage/')}">Copy the full attribution</a>.</p>
      <p><a href="${local(`icons/${previous.id}/`)}">← ${escapeHtml(previous.name)}</a> &nbsp;·&nbsp; <a href="${local(`icons/${next.id}/`)}">${escapeHtml(next.name)} →</a></p>
    </section>
  </main>`;

  const detailPage = page({
    title: `${icon.name} SVG icon and custom emoji — Iconic Drills Pack`,
    description,
    canonical,
    image: emojiPngUrl,
    structuredData: iconData,
    content: detailContent,
  });

  const iconDir = path.join(outputDir, 'icons', icon.id);
  await fs.mkdir(iconDir, { recursive: true });
  await fs.writeFile(path.join(iconDir, 'index.html'), detailPage);
}

const lastModified = new Date().toISOString().slice(0, 10);
const pageUrls = [`${siteUrl}/`, absolute('usage/'), ...metadata.icons.map((icon) => absolute(`icons/${icon.id}/`))];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pageUrls.map((url) => `  <url><loc>${escapeHtml(url)}</loc><lastmod>${lastModified}</lastmod></url>`).join('\n')}
</urlset>
`;

const imageSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${metadata.icons.map((icon) => `  <url>
    <loc>${absolute(`icons/${icon.id}/`)}</loc>
    <image:image><image:loc>${absolute(`assets/illustration/${icon.id}.svg`)}</image:loc><image:title>${escapeHtml(icon.name)} SVG illustration</image:title><image:caption>Hand-drawn ${escapeHtml(icon.name)} icon by Roman Kuzhel</image:caption></image:image>
    <image:image><image:loc>${emojiAbsolute(`assets/emoji-png/512/${icon.id}.png`)}</image:loc><image:title>${escapeHtml(icon.name)} custom emoji</image:title><image:caption>Ddrills acid-lime custom emoji by Roman Kuzhel</image:caption></image:image>
  </url>`).join('\n')}
</urlset>
`;

const robots = `# Iconic Drills Pack project crawler guidance
User-agent: OAI-SearchBot
Allow: /

# Search access is enabled; OpenAI model-training access is not required for search.
User-agent: GPTBot
Disallow: /

User-agent: *
Allow: /

Sitemap: ${absolute('sitemap.xml')}
Sitemap: ${absolute('image-sitemap.xml')}
`;

const llms = `# Iconic Drills Pack

> A rough, hand-drawn icon system by Roman Kuzhel, Kyrgyzstan. The 96 approved icons work as scalable SVG illustrations and custom emoji. Artwork is CC BY 4.0; commercial use requires attribution.

## Primary resources

- [Icon catalog](${siteUrl}/): Browse and search all icons.
- [Usage and attribution](${absolute('usage/')}): License requirements and ready-to-copy credit.
- [Machine-readable icon data](${absolute('assets/data/icons.json')}): Names, categories, keywords, Unicode IDs, and asset paths.
- [GitHub repository](${repositoryUrl}): Source, package API, releases, and contribution guide.
- [Full icon index](${absolute('llms-full.txt')}): One stable page and asset URL per icon.

## Required attribution

Iconic Drills Pack © 2026 Roman Kuzhel, Kyrgyzstan — ${repositoryUrl} — CC BY 4.0. Changes were made, if applicable.
`;

const llmsFull = `# Iconic Drills Pack — full icon index

Creator: Roman Kuzhel, Kyrgyzstan
Source: ${repositoryUrl}
License: CC BY 4.0 — ${licenseUrl}
Count: ${metadata.icons.length}

${metadata.icons.map((icon) => `## ${icon.emoji} ${icon.name}
- Unicode ID: ${icon.id}
- Category: ${icon.category} / ${icon.subcategory}
- Keywords: ${icon.keywords.join(', ')}
- Page: ${absolute(`icons/${icon.id}/`)}
- Illustration SVG: ${absolute(`assets/illustration/${icon.id}.svg`)}
- Emoji SVG: ${emojiAbsolute(`assets/emoji-svg/${icon.id}.svg`)}
- Emoji PNG: ${emojiAbsolute(`assets/emoji-png/512/${icon.id}.png`)}`).join('\n\n')}
`;

const notFound = page({
  title: 'Page not found — Iconic Drills Pack',
  description: 'Return to the Iconic Drills Pack catalog.',
  canonical: `${siteUrl}/`,
  image: absolute('assets/preview.png'),
  structuredData: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Page not found' },
  content: `<main class="usage"><p class="eyebrow">404</p><h1>That icon<br>isn’t here.</h1><p><a class="button button--dark" href="${local('')}">Return to the catalog</a></p></main>`,
});

await Promise.all([
  fs.writeFile(path.join(outputDir, 'sitemap.xml'), sitemap),
  fs.writeFile(path.join(outputDir, 'image-sitemap.xml'), imageSitemap),
  fs.writeFile(path.join(outputDir, 'robots.txt'), robots),
  fs.writeFile(path.join(outputDir, 'llms.txt'), llms),
  fs.writeFile(path.join(outputDir, 'llms-full.txt'), llmsFull),
  fs.writeFile(path.join(outputDir, '404.html'), notFound),
]);

console.log(`Built crawlable catalog with ${metadata.icons.length} icon pages at ${outputDir}`);
