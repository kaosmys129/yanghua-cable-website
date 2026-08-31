import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join } from 'node:path';
import matter from 'gray-matter';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const enDir = join(projectRoot, 'src/data/legacy-content/content/articles/en');
const esDir = join(projectRoot, 'src/data/legacy-content/content/articles/es');
const ptDir = join(projectRoot, 'src/data/legacy-content/content/articles/pt');
const publicDir = join(projectRoot, 'public');

const noImageBuf = readFileSync(join(publicDir, 'images/no-image-available.webp'));
const noImageCopyPath = join(publicDir, 'images/no-image-available-copy.webp');
const noImageCopyBuf = existsSync(noImageCopyPath) ? readFileSync(noImageCopyPath) : null;

const semanticAssetMap = {
  "alcalde-del-condado-de-changshun-de-la-provincia-de-guizhou-visita-yanghuasti-para-inspeccion-613506": "public/storage/uploads/images/2026/07/144fa38baa78d4db9f3d358e4eaec571.png",
  "buenos-productos-el-mercado-decide-busbar-flexible-de-alta-corriente-debuta-en-la-exposicion-de-energia-de-asia-2024-569829": "public/images/news/exhibition-2024.jpg",
  "china-construction-third-engineering-bureau-group-experts-visit-yanghuasti-for-inspection-552925": "public/storage/uploads/images/2026/07/2da569dfbb98d232aec5e1aefbc37fd4.png",
  "continuous-presence-yanghuasti-participates-in-northwest-electrical-and-new-energy-industry-chain-cooperation-conference-551905": "public/images/solutions/new-energy/cover.webp",
  "digital-energy-pioneer-smart-innovation-future-high-current-flexible-busbar-exhibition-highlights-512155": "public/storage/uploads/images/2026/07/fc6dee48e2fab209d8219d30e5843ac1.png",
  "dragon-boat-festival-greetings-757667": "public/images/company-intro.webp",
  "fifth-day-of-lunar-new-year-welcoming-the-god-of-wealth-gods-of-wealth-come-to-my-home-2025-must-prosper-571057": "public/images/homepage/home-hero-bg.png",
  "flexible-busbar-debuts-at-16th-china-architecture-society-building-electrical-branch-low-carbon-energy-efficiency-technology-forum-856106": "public/storage/uploads/images/2026/07/seedream-li2-09.jpg",
  "focus-on-electrical-engineering-gathering-in-guangzhou-highlights-from-2024-china-survey-and-design-electrical-branch-annual-conference-790559": "public/storage/uploads/images/2026/07/seedream-li2-10.jpg",
  "good-products-market-decides-high-current-flexible-busbar-debuts-at-2024-asia-power-and-asia-energy-storage-exhibition-569829": "public/images/projects/catl-energy-storage.webp",
  "guangdong-wire-and-cable-industry-association-secretary-general-visits-yanghuasti-526020": "public/storage/uploads/images/2026/07/seedream-li1-01.jpg",
  "heilongjiang-liaoning-jilin-media-reports-on-yanghuasti-high-current-flexible-busbar-at-changchun-optical-expo-821007": "public/images/news/market-growth.jpg",
  "hello-2025-576128": "public/images/homepage/hero-bg-3.webp",
  "invitation-april-10-12-13th-international-energy-storage-summit-and-exhibition-high-current-flexible-busbar-booth-b2119-hall-b2-515322": "public/storage/uploads/images/2026/07/seedream-li1-08.jpg",
  "key-points-yanghuasti-advances-china-korea-changchun-international-cooperation-demonstration-zone-project-556822": "public/images/projects/midea-industrial-complex.webp",
  "may-day-special-edition-the-shining-yanghuasti-team-917586": "public/images/yanghua-products/product-installed-01.png",
  "president-of-guangdong-sichuan-dazhou-chamber-of-commerce-visits-yanghuasti-for-exchange-and-guidance-617080": "public/storage/uploads/images/2026/07/seedream-li1-04.jpg",
  "remembering-qingming-living-in-the-present-year-after-year-forever-missing-our-loved-ones-559713": "public/images/homepage/home-page-bg2.webp",
  "riding-on-electricity-welcoming-light-high-current-flexible-busbar-debuts-in-changchun-782151": "public/images/yanghua-products/product-front.jpg",
  "second-appearance-high-current-flexible-busbar-showcased-at-building-electrical-low-carbon-energy-efficiency-forum-551521": "public/storage/uploads/images/2026/07/seedream-li2-11.jpg",
  "setting-sail-opening-the-flexible-power-era-568255": "public/images/yanghua-products/product-terminal.jpg",
  "shenzhen-china-southern-power-grid-shenzhen-hong-kong-technology-innovation-co-ltd-leadership-visits-yanghuasti-for-exchange-508737": "public/images/solutions/power-system/cover.webp",
  "signed-yanghuasti-and-china-korea-international-cooperation-demonstration-zone-hold-project-signing-ceremony-906150": "public/storage/uploads/images/2026/07/74d8afdc0ddf0fc0abc2123f1713eb92.png",
  "still-hesitating-about-high-current-flexible-busbar-listen-to-what-our-partners-say-573337": "public/images/news/technical-whitepaper.jpg",
  "ten-years-of-chamber-platform-building-dreams-high-current-flexible-busbar-moving-forward-with-honor-859905": "public/storage/uploads/images/2026/07/seedream-li2-12.jpg",
  "work-resumes-with-good-fortune-everything-is-promising-532350": "public/images/yanghua-products/product-installed-02.jpg",
  "world-earth-day-protecting-earth-together-with-flexible-busbar-730902": "public/images/projects/50mw-solar-farm-power-distribution.webp",
  "yanghua-insights-joint-free-long-distance-installation-flexible-busbar-vs-copper-busbar-comparison-559236": "public/images/yanghua-products/product-side.jpg",
  "yanghua-insights-main-busbar-explosion-in-electrical-room-flexible-busbar-emergency-power-repair-project-installation-site-568108": "public/images/yanghua-products/product-installed-03.jpg",
  "yanghuasti-2024-annual-review-528905": "public/images/news/new-product-launch.jpg",
  "yanghuasti-empowers-yunnan-industrial-park-construction-with-flexible-busbar-876002": "public/images/projects/steel-mill-modernization.webp",
  "yanghuasti-invited-to-participate-in-cable-industry-new-quality-productivity-development-technology-forum-839972": "public/storage/uploads/images/2026/07/seedream-li1-05.jpg",
  "yanghuasti-participates-in-2024-shenzhen-building-electrical-academic-annual-conference-501606": "public/storage/uploads/images/2026/07/seedream-li1-06.jpg",
  "yanghuasti-pays-tribute-to-every-worker-577809": "public/images/yanghua-products/product-installed-04.png",
  "yanghuasti-releases-flexible-busbar-industry-solutions-for-industrial-plants-596829": "public/images/solutions/manufacturing/cover.webp",
  "yanghuasti-signs-strategic-cooperation-agreement-with-subsidiary-of-sichuan-shudao-group-765758": "public/storage/uploads/images/2026/07/seedream-li1-07.jpg",
  "china-architecture-society-electrical-branch-vice-chairman-li-binghua-and-experts-visit-yanghuasti-for-inspection-and-exchange-658773": "public/storage/uploads/images/2026/07/seedream-li1-02.jpg",
  "vicepresidente-de-la-rama-de-ingenieria-electrica-de-la-sociedad-de-arquitectura-de-china-li-binghua-y-expertos-visitan-yanghuasti-para-inspeccion-e-intercambio-658773": "public/storage/uploads/images/2026/07/seedream-li1-02.jpg",
  "soluciones-de-industria-de-busbar-flexible-estaciones-de-carga-con-instrucciones-completas-de-descarga-del-manual-527307": "public/images/solutions/charging-station/cover.webp",
  "flexible-busbar-industry-solutions-charging-stations-with-complete-manual-download-instructions-527307": "public/images/solutions/charging-station/cover.webp",
  "year-of-the-snake-blessing-prosperity-and-joy-wishing-everyone-a-happy-new-year-505792": "public/images/homepage/home-hero-bg.webp"
};

let enUpdated = 0;
let esUpdated = 0;
let ptUpdated = 0;

for (const [slug, assetRelPath] of Object.entries(semanticAssetMap)) {
  const sourceAssetAbs = join(projectRoot, assetRelPath);
  if (!existsSync(sourceAssetAbs)) {
    throw new Error(`Source asset does not exist: ${sourceAssetAbs}`);
  }
  const ext = extname(sourceAssetAbs) || '.jpg';
  const articleId = slug.match(/(\d+)$/)?.[1];

  // 1. Process EN article
  for (const enFile of readdirSync(enDir).filter(f => f.endsWith('.mdx'))) {
    const enMdxPath = join(enDir, enFile);
    const enRaw = readFileSync(enMdxPath, 'utf8');
    const enParsed = matter(enRaw);
    const enSlug = enParsed.data.slug || enFile.replace('.mdx', '');
    const enArticleId = String(enParsed.data.translationKey || '').match(/(\d+)$/)?.[1] || String(enParsed.data.sourceId || '');

    if ((articleId && enArticleId === articleId) || enSlug === slug || enFile === `${slug}.mdx`) {
      const targetDir = join(publicDir, 'storage/uploads/images/articles/en', enSlug);
      mkdirSync(targetDir, { recursive: true });
      const targetAssetAbs = join(targetDir, `cover${ext}`);
      copyFileSync(sourceAssetAbs, targetAssetAbs);

      const newCoverSrc = `/storage/uploads/images/articles/en/${enSlug}/cover${ext}`;
      const oldCoverSrc = enParsed.data.cover?.src;
      let updatedRaw = enRaw;
      if (oldCoverSrc) {
        updatedRaw = updatedRaw.replace(oldCoverSrc, newCoverSrc);
      }
      writeFileSync(enMdxPath, updatedRaw, 'utf8');
      enUpdated++;
    }
  }

  // 2. Process ES article
  for (const esFile of readdirSync(esDir).filter(f => f.endsWith('.mdx'))) {
    const esMdxPath = join(esDir, esFile);
    const esRaw = readFileSync(esMdxPath, 'utf8');
    const esParsed = matter(esRaw);
    const esSlug = esParsed.data.slug || esFile.replace('.mdx', '');
    const esArticleId = String(esParsed.data.translationKey || '').match(/(\d+)$/)?.[1] || String(esParsed.data.sourceId || '');

    if ((articleId && esArticleId === articleId) || esSlug === slug) {
      const targetDir = join(publicDir, 'storage/uploads/images/articles/es', esSlug);
      mkdirSync(targetDir, { recursive: true });
      const targetAssetAbs = join(targetDir, `cover${ext}`);
      copyFileSync(sourceAssetAbs, targetAssetAbs);

      const newCoverSrc = `/storage/uploads/images/articles/es/${esSlug}/cover${ext}`;
      const oldCoverSrc = esParsed.data.cover?.src;
      let updatedRaw = esRaw;
      if (oldCoverSrc) {
        updatedRaw = updatedRaw.replace(oldCoverSrc, newCoverSrc);
      }
      writeFileSync(esMdxPath, updatedRaw, 'utf8');
      esUpdated++;
    }
  }

  // 3. Process PT article
  for (const ptFile of readdirSync(ptDir).filter(f => f.endsWith('.mdx'))) {
    const ptMdxPath = join(ptDir, ptFile);
    const ptRaw = readFileSync(ptMdxPath, 'utf8');
    const ptParsed = matter(ptRaw);
    const ptSlug = ptParsed.data.slug || ptFile.replace('.mdx', '');
    const ptArticleId = String(ptParsed.data.translationKey || '').match(/(\d+)$/)?.[1] || String(ptParsed.data.sourceId || '');

    if ((articleId && ptArticleId === articleId) || ptSlug === slug) {
      const targetDir = join(publicDir, 'storage/uploads/images/articles/pt', ptSlug);
      mkdirSync(targetDir, { recursive: true });
      const targetAssetAbs = join(targetDir, `cover${ext}`);
      copyFileSync(sourceAssetAbs, targetAssetAbs);

      const newCoverSrc = `/storage/uploads/images/articles/pt/${ptSlug}/cover${ext}`;
      const oldCoverSrc = ptParsed.data.cover?.src;
      let updatedRaw = ptRaw;
      if (oldCoverSrc) {
        updatedRaw = updatedRaw.replace(oldCoverSrc, newCoverSrc);
      }
      writeFileSync(ptMdxPath, updatedRaw, 'utf8');
      ptUpdated++;
    }
  }
}

console.log(`Remediation complete! Updated EN: ${enUpdated}, ES: ${esUpdated}, PT: ${ptUpdated}`);
