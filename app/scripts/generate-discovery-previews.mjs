import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "public", "data", "countries");
const OUT_DIR = path.join(ROOT, "public", "discovery");
const WIDTH = 1200;
const HEIGHT = 630;
const PALETTE = [
  "#10b981",
  "#2563eb",
  "#f97316",
  "#8b5cf6",
  "#0f766e",
  "#e11d48",
  "#64748b",
  "#ca8a04",
  "#0891b2",
  "#7c3aed",
];

const PREVIEWS = [
  {
    id: "pt-direito-constitucional-comparado",
    title: "Direito constitucional comparado",
    subtitle: "BRA · PRT · DEU · ITA · COL · ECU · BOL",
    countries: ["BRA", "PRT", "DEU", "ITA", "COL", "ECU", "BOL"],
  },
  {
    id: "en-comparative-constitutional-law-ai",
    title: "Comparative constitutional law",
    subtitle: "DEU · ITA · BRA · COL · ECU · ZAF",
    countries: ["DEU", "ITA", "BRA", "COL", "ECU", "ZAF"],
  },
  {
    id: "pt-busca-semantica-constituicoes",
    title: "Busca semântica: dignidade",
    subtitle: "BRA · PRT · DEU · ESP · PER · COL · BOL",
    countries: ["BRA", "PRT", "DEU", "ESP", "PER", "COL", "BOL"],
  },
  {
    id: "en-semantic-search-constitutions",
    title: "Semantic search: environment",
    subtitle: "BRA · PRT · COL · ECU · ARG · NOR · TUR",
    countries: ["BRA", "PRT", "COL", "ECU", "ARG", "NOR", "TUR"],
  },
  {
    id: "pt-brasil-portugal-saude",
    title: "Brasil × Portugal: saúde",
    subtitle: "BRA · PRT",
    countries: ["BRA", "PRT"],
  },
  {
    id: "en-germany-italy-eternity-clauses",
    title: "Germany · Italy · Brazil",
    subtitle: "Eternity clauses and amendment limits",
    countries: ["DEU", "ITA", "BRA"],
  },
  {
    id: "pt-brasil-alemanha-direitos-sociais",
    title: "Brasil × Alemanha",
    subtitle: "Dignidade · Estado social · direitos sociais",
    countries: ["BRA", "DEU"],
  },
  {
    id: "pt-clausulas-petreas",
    title: "Cláusulas pétreas",
    subtitle: "BRA · DEU · ITA · AGO · MOZ · GNB",
    countries: ["BRA", "DEU", "ITA", "AGO", "MOZ", "GNB"],
  },
  {
    id: "pt-controle-de-constitucionalidade",
    title: "Controle de constitucionalidade",
    subtitle: "BRA · PRT · DEU · ITA · COL · PER · BOL · USA",
    countries: ["BRA", "PRT", "DEU", "ITA", "COL", "PER", "BOL", "USA"],
  },
  {
    id: "en-right-to-a-healthy-environment",
    title: "Right to a healthy environment",
    subtitle: "BRA · PRT · COL · ECU · ARG · AGO · MOZ · CPV · NOR · TUR",
    countries: ["BRA", "PRT", "COL", "ECU", "ARG", "AGO", "MOZ", "CPV", "NOR", "TUR"],
  },
  {
    id: "pt-america-latina-constituicoes-pos-1980",
    title: "América Latina pós-1980",
    subtitle: "BRA · COL · PER · ARG · ECU · BOL",
    countries: ["BRA", "COL", "PER", "ARG", "ECU", "BOL"],
  },
  {
    id: "pt-cplp-constituicoes-lusofonas",
    title: "Constituições lusófonas da CPLP",
    subtitle: "BRA · PRT · AGO · MOZ · CPV · GNB · STP · TLS",
    countries: ["BRA", "PRT", "AGO", "MOZ", "CPV", "GNB", "STP", "TLS"],
  },
  {
    id: "es-derecho-constitucional-comparado",
    title: "Derecho constitucional comparado",
    subtitle: "ESP · MEX · COL · PER · ARG · ECU · BOL",
    countries: ["ESP", "MEX", "COL", "PER", "ARG", "ECU", "BOL"],
  },
  {
    id: "es-busqueda-semantica-constituciones",
    title: "Búsqueda semántica",
    subtitle: "Dignidad · debido proceso · derechos sociales",
    countries: ["ESP", "MEX", "COL", "PER", "ARG", "ECU", "BOL"],
  },
  {
    id: "es-derecho-medio-ambiente-sano",
    title: "Medio ambiente sano",
    subtitle: "ESP · MEX · COL · ECU · ARG · BRA · PRT",
    countries: ["ESP", "MEX", "COL", "ECU", "ARG", "BRA", "PRT"],
  },
  {
    id: "es-constituciones-iberoamericanas-educacion",
    title: "Educación constitucional",
    subtitle: "España y América Latina hispanohablante",
    countries: ["ESP", "MEX", "COL", "PER", "ARG", "ECU", "BOL"],
  },
  {
    id: "it-diritto-costituzionale-comparato",
    title: "Diritto costituzionale comparato",
    subtitle: "ITA · DEU · FRA · ESP · PRT · BRA · COL",
    countries: ["ITA", "DEU", "FRA", "ESP", "PRT", "BRA", "COL"],
  },
  {
    id: "it-ricerca-semantica-costituzioni",
    title: "Ricerca semantica",
    subtitle: "Dignità · diritti sociali · controllo",
    countries: ["ITA", "DEU", "FRA", "ESP", "PRT", "BRA"],
  },
  {
    id: "it-germania-italia-clausole-eterne",
    title: "Germania · Italia · Brasile",
    subtitle: "Limiti alla revisione costituzionale",
    countries: ["DEU", "ITA", "BRA"],
  },
  {
    id: "it-corti-costituzionali-modelli-comparati",
    title: "Corti costituzionali",
    subtitle: "Modelli comparati di controllo",
    countries: ["ITA", "DEU", "FRA", "ESP", "PRT", "BRA", "COL", "USA"],
  },
  {
    id: "fr-droit-constitutionnel-compare",
    title: "Droit constitutionnel comparé",
    subtitle: "FRA · BEL · CHE · SEN · MAR · TUN · BRA",
    countries: ["FRA", "BEL", "CHE", "SEN", "MAR", "TUN", "BRA"],
  },
  {
    id: "fr-recherche-semantique-constitutions",
    title: "Recherche sémantique",
    subtitle: "Dignité · droits sociaux · institutions",
    countries: ["FRA", "BEL", "CHE", "SEN", "MAR", "BRA", "COL"],
  },
  {
    id: "fr-droit-environnement-sain",
    title: "Environnement sain",
    subtitle: "Droit · devoirs · ressources naturelles",
    countries: ["FRA", "BEL", "CHE", "BRA", "COL", "ECU", "NOR", "TUR"],
  },
  {
    id: "fr-constitutions-francophones-decentralisation",
    title: "Décentralisation francophone",
    subtitle: "Collectivités territoriales et autonomie locale",
    countries: ["FRA", "BEL", "CHE", "SEN", "MAR", "TUN", "CMR", "CIV"],
  },
  {
    id: "ja-hikaku-kenpo-ai",
    title: "AIセマンティック地図で読む比較憲法",
    subtitle: "JPN · KOR · DEU · ITA · BRA · USA · ZAF",
    countries: ["JPN", "KOR", "DEU", "ITA", "BRA", "USA", "ZAF"],
  },
  {
    id: "ja-imi-kensaku-kenpo",
    title: "憲法の意味検索",
    subtitle: "尊厳 · 社会権 · 適正手続",
    countries: ["JPN", "KOR", "DEU", "BRA", "USA", "ZAF"],
  },
  {
    id: "ja-constitutional-courts",
    title: "憲法裁判所と違憲審査",
    subtitle: "制度比較の入口",
    countries: ["JPN", "KOR", "DEU", "ITA", "BRA", "USA", "ZAF"],
  },
  {
    id: "ja-local-self-government",
    title: "地方自治の比較憲法",
    subtitle: "地方公共団体 · 自治権 · 分権",
    countries: ["JPN", "KOR", "DEU", "ITA", "FRA", "ESP"],
  },
  {
    id: "zh-bijiao-xianfa-ai",
    title: "用 AI 语义地图阅读比较宪法",
    subtitle: "CHN · JPN · KOR · SGP · IND · DEU · ZAF",
    countries: ["CHN", "JPN", "KOR", "SGP", "IND", "DEU", "ZAF"],
  },
  {
    id: "zh-yuyi-sousuo-xianfa",
    title: "宪法文本的语义搜索",
    subtitle: "尊严 · 程序 · 社会权利 · 国家义务",
    countries: ["CHN", "JPN", "KOR", "SGP", "IND", "ZAF"],
  },
  {
    id: "zh-environmental-rights",
    title: "环境权与国家义务",
    subtitle: "健康环境 · 保护义务 · 资源",
    countries: ["CHN", "JPN", "KOR", "SGP", "IND", "BRA", "ECU"],
  },
  {
    id: "zh-constitutional-terms-translation",
    title: "宪法术语翻译",
    subtitle: "权利 · 义务 · 尊严 · 法治",
    countries: ["CHN", "JPN", "KOR", "SGP", "IND", "DEU", "ZAF"],
  },
];

await mkdir(OUT_DIR, {recursive: true});

for (const preview of PREVIEWS) {
  const points = await loadPoints(preview.countries);
  const svg = renderPreview(preview, points);
  const outputPath = path.join(OUT_DIR, `${preview.id}.png`);
  const png = await sharp(Buffer.from(svg)).png({quality: 92}).toBuffer();
  await writeFile(outputPath, png);
  console.log(`wrote ${path.relative(ROOT, outputPath)}`);
}

async function loadPoints(countries) {
  const points = [];

  for (const [countryIndex, code] of countries.entries()) {
    const filePath = path.join(DATA_DIR, `${code}.json`);
    const rows = JSON.parse(await readFile(filePath, "utf8"));
    const stride = Math.max(1, Math.floor(rows.length / 120));
    for (let index = 0; index < rows.length; index += stride) {
      const row = rows[index];
      points.push({
        code,
        x: row.x,
        y: row.y,
        cluster: row.global_cluster,
        color: PALETTE[countryIndex % PALETTE.length],
      });
    }
  }

  return points;
}

function renderPreview(preview, points) {
  const plot = {
    left: 70,
    top: 96,
    width: 760,
    height: 450,
  };
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scaleX = (value) =>
    plot.left + ((value - minX) / Math.max(maxX - minX, 0.0001)) * plot.width;
  const scaleY = (value) =>
    plot.top + plot.height - ((value - minY) / Math.max(maxY - minY, 0.0001)) * plot.height;

  const dots = points
    .map((point) => {
      const opacity = point.cluster === -1 ? 0.28 : 0.72;
      const radius = point.cluster === -1 ? 2.2 : 3.3;
      return `<circle cx="${scaleX(point.x).toFixed(1)}" cy="${scaleY(point.y).toFixed(1)}" r="${radius}" fill="${point.color}" opacity="${opacity}"/>`;
    })
    .join("");
  const legend = preview.countries
    .map((code, index) => {
      const step = preview.countries.length > 8 ? 19 : 27;
      const y = 268 + index * step;
      return `
        <g transform="translate(34 ${y})">
          <circle cx="0" cy="0" r="6" fill="${PALETTE[index % PALETTE.length]}"/>
          <text x="17" y="5" font-size="17" font-family="Inter, Arial, sans-serif" fill="#dbeafe" font-weight="700">${code}</text>
        </g>`;
    })
    .join("");
  const titleLines = wrapWords(preview.title, 20, 2);
  const subtitleLines = wrapWords(preview.subtitle, 28, 3);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="48%" stop-color="#12312d"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      <radialGradient id="glow" cx="36%" cy="35%" r="62%">
        <stop offset="0%" stop-color="#34d399" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
      </radialGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#020617" flood-opacity="0.28"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <g opacity="0.22">
      ${gridLines(plot)}
    </g>
    <rect x="${plot.left}" y="${plot.top}" width="${plot.width}" height="${plot.height}" rx="24" fill="#020617" opacity="0.34" filter="url(#softShadow)"/>
    <g>${dots}</g>
    <g>
      <text x="72" y="62" font-size="24" font-family="Inter, Arial, sans-serif" fill="#a7f3d0" font-weight="800" letter-spacing="4">THE CONSTITUTIONAL ATLAS</text>
      <text x="72" y="590" font-size="20" font-family="Inter, Arial, sans-serif" fill="#475569" font-weight="700">Semantic map preview · static route seed</text>
    </g>
    <g transform="translate(875 78)">
      <rect x="0" y="0" width="270" height="470" rx="24" fill="#0f172a" opacity="0.9"/>
      ${renderLines(titleLines, {x: 34, y: 58, size: 27, lineHeight: 34, color: "#ffffff", weight: 800})}
      ${renderLines(subtitleLines, {x: 34, y: 122, size: 15, lineHeight: 22, color: "#cbd5e1", weight: 650})}
      <text x="34" y="242" font-size="13" font-family="Inter, Arial, sans-serif" fill="#94a3b8" font-weight="800" letter-spacing="3">COUNTRY SEED</text>
      ${legend}
    </g>
  </svg>`;
}

function gridLines(plot) {
  const lines = [];
  for (let index = 0; index <= 8; index += 1) {
    const x = plot.left + (plot.width / 8) * index;
    lines.push(`<line x1="${x}" y1="${plot.top}" x2="${x}" y2="${plot.top + plot.height}" stroke="#e2e8f0"/>`);
  }
  for (let index = 0; index <= 5; index += 1) {
    const y = plot.top + (plot.height / 5) * index;
    lines.push(`<line x1="${plot.left}" y1="${y}" x2="${plot.left + plot.width}" y2="${y}" stroke="#e2e8f0"/>`);
  }
  return lines.join("");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapWords(value, maxChars, maxLines) {
  const words = String(value).split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const truncated = lines.slice(0, maxLines);
  truncated[maxLines - 1] = `${truncated[maxLines - 1].replace(/[.,;:]$/, "")}...`;
  return truncated;
}

function renderLines(lines, options) {
  return `<text x="${options.x}" y="${options.y}" font-size="${options.size}" font-family="Inter, Arial, sans-serif" fill="${options.color}" font-weight="${options.weight}">
    ${lines.map((line, index) => `<tspan x="${options.x}" dy="${index === 0 ? 0 : options.lineHeight}">${escapeXml(line)}</tspan>`).join("")}
  </text>`;
}
