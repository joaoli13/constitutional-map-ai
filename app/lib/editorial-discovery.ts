import {buildAtlasQueryString, type AtlasLinkConfig} from "./atlas-deep-link.ts";
import type {AppLocale} from "../i18n/routing.ts";

export type DiscoveryCategory =
  | "pillar"
  | "semantic-search"
  | "country-comparison"
  | "theme"
  | "bloc-comparison";

export type DiscoverySourceLink = {
  label: string;
  href: string;
};

export type DiscoveryPreview = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type DiscoveryPageEntry = {
  id: string;
  locale: AppLocale;
  translationGroup: string;
  category: DiscoveryCategory;
  slugPath: string[];
  title: string;
  description: string;
  eyebrow: string;
  question: string;
  shortAnswer: string;
  context: string[];
  findings: [string, string, string];
  methodologyNote: string;
  scholarlyAngle: string;
  mapPreview: DiscoveryPreview;
  atlasLink: AtlasLinkConfig;
  hubLinks: string[];
  sourceLinks: DiscoverySourceLink[];
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  audienceSpecific?: boolean;
};

export type DiscoveryUiCopy = {
  atlasCta: string;
  contextLabel: string;
  findingsLabel: string;
  methodologyLabel: string;
  sourcesLabel: string;
  relatedLabel: string;
  openAtlasLabel: string;
  categoryLabel: Record<DiscoveryCategory, string>;
  readingTime: (minutes: number) => string;
};

const BASE_URL = "https://constitutionalmap.ai";
const GITHUB_URL = "https://github.com/joaoli13/constitutional-map-ai";
const CONSTITUTE_URL = "https://www.constituteproject.org/";
const PREVIEW_WIDTH = 1200;
const PREVIEW_HEIGHT = 630;
const FIRST_PUBLISHED_AT = "2026-05-02";
const LOCALIZED_EXPANSION_PUBLISHED_AT = "2026-05-03";

const COMMON_SOURCES_PT: DiscoverySourceLink[] = [
  {label: "Constitute Project", href: CONSTITUTE_URL},
  {label: "Código e metodologia no GitHub", href: GITHUB_URL},
];

const COMMON_SOURCES_EN: DiscoverySourceLink[] = [
  {label: "Constitute Project", href: CONSTITUTE_URL},
  {label: "Code and method on GitHub", href: GITHUB_URL},
];

const COMMON_SOURCES_ES: DiscoverySourceLink[] = [
  {label: "Constitute Project", href: CONSTITUTE_URL},
  {label: "Código y metodología en GitHub", href: GITHUB_URL},
];

const COMMON_SOURCES_IT: DiscoverySourceLink[] = [
  {label: "Constitute Project", href: CONSTITUTE_URL},
  {label: "Codice e metodologia su GitHub", href: GITHUB_URL},
];

const COMMON_SOURCES_FR: DiscoverySourceLink[] = [
  {label: "Constitute Project", href: CONSTITUTE_URL},
  {label: "Code et méthode sur GitHub", href: GITHUB_URL},
];

const COMMON_SOURCES_JA: DiscoverySourceLink[] = [
  {label: "Constitute Project", href: CONSTITUTE_URL},
  {label: "GitHub のコードと手法", href: GITHUB_URL},
];

const COMMON_SOURCES_ZH: DiscoverySourceLink[] = [
  {label: "Constitute Project", href: CONSTITUTE_URL},
  {label: "GitHub 上的代码与方法", href: GITHUB_URL},
];

const DISCOVERY_UI: Record<AppLocale, DiscoveryUiCopy> = {
  en: {
    atlasCta: "Open this analysis in the Atlas",
    contextLabel: "Research context",
    findingsLabel: "Three findings to test",
    methodologyLabel: "Method note",
    sourcesLabel: "Sources",
    relatedLabel: "Related discovery pages",
    openAtlasLabel: "Interactive map",
    categoryLabel: {
      "pillar": "Comparative hub",
      "semantic-search": "Semantic search",
      "country-comparison": "Country comparison",
      "theme": "Theme",
      "bloc-comparison": "Bloc comparison",
    },
    readingTime: (minutes) => `${minutes} min read`,
  },
  es: {
    atlasCta: "Abrir este análisis en el Atlas",
    contextLabel: "Contexto de investigación",
    findingsLabel: "Tres hallazgos para comprobar",
    methodologyLabel: "Nota metodológica",
    sourcesLabel: "Fuentes",
    relatedLabel: "Páginas relacionadas",
    openAtlasLabel: "Mapa interactivo",
    categoryLabel: {
      "pillar": "Hub comparativo",
      "semantic-search": "Búsqueda semántica",
      "country-comparison": "Comparación país-país",
      "theme": "Tema constitucional",
      "bloc-comparison": "Comparación por bloque",
    },
    readingTime: (minutes) => `${minutes} min de lectura`,
  },
  pt: {
    atlasCta: "Abrir esta análise no mapa",
    contextLabel: "Contexto da pesquisa",
    findingsLabel: "Três achados para testar",
    methodologyLabel: "Nota metodológica",
    sourcesLabel: "Fontes",
    relatedLabel: "Páginas relacionadas",
    openAtlasLabel: "Mapa interativo",
    categoryLabel: {
      "pillar": "Hub comparativo",
      "semantic-search": "Busca semântica",
      "country-comparison": "Comparação país-país",
      "theme": "Tema constitucional",
      "bloc-comparison": "Comparação por bloco",
    },
    readingTime: (minutes) => `${minutes} min de leitura`,
  },
  it: {
    atlasCta: "Apri questa analisi nell'Atlante",
    contextLabel: "Contesto della ricerca",
    findingsLabel: "Tre risultati da verificare",
    methodologyLabel: "Nota metodologica",
    sourcesLabel: "Fonti",
    relatedLabel: "Pagine correlate",
    openAtlasLabel: "Mappa interattiva",
    categoryLabel: {
      "pillar": "Hub comparativo",
      "semantic-search": "Ricerca semantica",
      "country-comparison": "Comparazione paese-paese",
      "theme": "Tema costituzionale",
      "bloc-comparison": "Comparazione per blocco",
    },
    readingTime: (minutes) => `${minutes} min di lettura`,
  },
  fr: {
    atlasCta: "Ouvrir cette analyse dans l'Atlas",
    contextLabel: "Contexte de recherche",
    findingsLabel: "Trois constats à vérifier",
    methodologyLabel: "Note méthodologique",
    sourcesLabel: "Sources",
    relatedLabel: "Pages liées",
    openAtlasLabel: "Carte interactive",
    categoryLabel: {
      "pillar": "Hub comparatif",
      "semantic-search": "Recherche sémantique",
      "country-comparison": "Comparaison pays-pays",
      "theme": "Thème constitutionnel",
      "bloc-comparison": "Comparaison par bloc",
    },
    readingTime: (minutes) => `${minutes} min de lecture`,
  },
  ja: {
    atlasCta: "Atlas でこの分析を開く",
    contextLabel: "調査の文脈",
    findingsLabel: "検証する3つの所見",
    methodologyLabel: "方法メモ",
    sourcesLabel: "出典",
    relatedLabel: "関連する発見ページ",
    openAtlasLabel: "インタラクティブ地図",
    categoryLabel: {
      "pillar": "比較ハブ",
      "semantic-search": "意味検索",
      "country-comparison": "国別比較",
      "theme": "憲法テーマ",
      "bloc-comparison": "地域比較",
    },
    readingTime: (minutes) => `${minutes}分で読めます`,
  },
  zh: {
    atlasCta: "在 Atlas 中打开此分析",
    contextLabel: "研究背景",
    findingsLabel: "三个可验证发现",
    methodologyLabel: "方法说明",
    sourcesLabel: "来源",
    relatedLabel: "相关发现页面",
    openAtlasLabel: "交互式地图",
    categoryLabel: {
      "pillar": "比较法入口",
      "semantic-search": "语义搜索",
      "country-comparison": "国家比较",
      "theme": "宪法主题",
      "bloc-comparison": "区域比较",
    },
    readingTime: (minutes) => `${minutes} 分钟阅读`,
  },
};

const DISCOVERY_PAGES: DiscoveryPageEntry[] = [
  {
    id: "pt-comparative-constitutional-law",
    locale: "pt",
    translationGroup: "comparative-constitutional-law",
    category: "pillar",
    slugPath: ["direito-constitucional-comparado"],
    title: "Direito constitucional comparado em um mapa semântico",
    description:
      "Veja como o The Constitutional Atlas transforma constituições de 190+ países em perguntas comparativas, clusters temáticos e rotas de pesquisa verificáveis.",
    eyebrow: "Direito constitucional comparado",
    question:
      "O que o direito constitucional comparado pode mostrar quando constituições inteiras são lidas como um espaço semântico comum?",
    shortAnswer:
      "Ele mostra que muitas convergências constitucionais aparecem por função jurídica, não por vocabulário idêntico. O mapa ajuda a sair da comparação palavra a palavra e a testar famílias de temas, instituições e direitos em escala global.",
    context: [
      "A página funciona como hub em português para pesquisas que começam amplas e depois descem para casos concretos: busca semântica, pares de países, temas institucionais e blocos regionais.",
      "O corpus público do Atlas reúne 30.828 segmentos constitucionais de 194 países, projetados em 3D por similaridade semântica. A leitura correta é exploratória: o mapa sugere caminhos, e o texto constitucional confirma ou corrige a hipótese.",
    ],
    findings: [
      "Países de tradições distintas frequentemente se aproximam quando tratam da mesma função constitucional, como controle de constitucionalidade, saúde, educação ou limites ao poder de reforma.",
      "A distância semântica ajuda a localizar outliers: dispositivos que usam vocabulário familiar, mas cumprem papel institucional diferente no desenho constitucional.",
      "Páginas filhas com perguntas estreitas geram leituras melhores que uma entrada genérica no mapa, porque cada CTA já abre países, busca e modo de cor coerentes com a hipótese.",
    ],
    methodologyNote:
      "Use esta página como índice de investigação. As inferências substantivas devem ser confirmadas no texto completo dos artigos, porque proximidade semântica não equivale a identidade normativa ou doutrinária.",
    scholarlyAngle:
      "Hub interno para direito constitucional comparado, com ênfase em perguntas estáveis e baixa polarização editorial.",
    mapPreview: preview("pt-direito-constitucional-comparado", "Dispersão global de segmentos constitucionais selecionados para pesquisa comparada"),
    atlasLink: {
      countries: ["BRA", "PRT", "DEU", "ITA", "COL", "ECU", "BOL"],
      semantic: "dignidade direitos sociais controle de constitucionalidade",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [
      "pt-busca-semantica-constituicoes",
      "pt-brasil-portugal-saude",
      "pt-brasil-alemanha-direitos-sociais",
      "pt-clausulas-petreas",
      "pt-controle-de-constitucionalidade",
      "pt-latam-pos-1980",
      "pt-cplp-constituicoes-lusofonas",
    ],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "en-comparative-constitutional-law-ai",
    locale: "en",
    translationGroup: "comparative-constitutional-law",
    category: "pillar",
    slugPath: ["comparative-constitutional-law-ai"],
    title: "Comparative constitutional law with AI semantic maps",
    description:
      "Explore how AI-assisted semantic comparison can surface institutional patterns across the world's constitutions without reducing the analysis to keyword matching.",
    eyebrow: "Comparative constitutional law",
    question:
      "How does AI-driven semantic comparison reveal patterns across world constitutions?",
    shortAnswer:
      "It lets researchers test constitutional functions across languages and drafting styles. Instead of asking only whether the same phrase appears, the Atlas asks which provisions behave similarly in the global semantic space.",
    context: [
      "This English hub points to narrower discovery pages for semantic search, country-pair comparison, structural themes, and bloc-level research questions.",
      "The Atlas is not a substitute for legal interpretation. It is a triage layer that helps scholars decide which countries, clusters, and provisions deserve close reading first.",
    ],
    findings: [
      "Semantic proximity often tracks institutional function more clearly than literal wording, especially in rights catalogues and judicial-review provisions.",
      "Country comparison works best when the first map state is small enough to inspect: two or three constitutional traditions before a wider bloc view.",
      "The strongest SEO and research pages are not product explanations; they are narrow constitutional questions with a reproducible Atlas state.",
    ],
    methodologyNote:
      "Treat the map as a research instrument. It ranks and visualizes similarity, but doctrinal conclusions still require reading the relevant constitutional text and legal context.",
    scholarlyAngle:
      "English-language hub for AI-assisted comparative constitutional-law research.",
    mapPreview: preview("en-comparative-constitutional-law-ai", "Semantic map preview for comparative constitutional law research"),
    atlasLink: {
      countries: ["DEU", "ITA", "BRA", "COL", "ECU", "ZAF"],
      semantic: "constitutional court social rights environment",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [
      "en-semantic-search-constitutions",
      "en-germany-italy-eternity-clauses",
      "en-right-to-a-healthy-environment",
    ],
    sourceLinks: COMMON_SOURCES_EN,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "pt-busca-semantica-constituicoes",
    locale: "pt",
    translationGroup: "semantic-search-constitutions",
    category: "semantic-search",
    slugPath: ["busca-semantica-constituicoes"],
    title: "Busca semântica em constituições: além da palavra exata",
    description:
      "Entenda como buscar conceitos constitucionais como dignidade da pessoa humana mesmo quando cada país usa uma redação diferente.",
    eyebrow: "Busca semântica",
    question:
      "Como encontrar dispositivos constitucionalmente próximos quando eles não usam a mesma expressão?",
    shortAnswer:
      "A busca semântica parte do sentido da pergunta. Uma consulta como “dignidade da pessoa humana” aproxima textos sobre fundamentos do Estado, igualdade, direitos sociais e proteção da pessoa mesmo quando a fórmula literal varia.",
    context: [
      "A busca textual continua útil para expressões fechadas. A busca semântica entra quando o pesquisador quer abrir o campo para redações equivalentes, traduções diferentes ou tradições jurídicas que organizam o mesmo tema em outro lugar da Constituição.",
      "O CTA desta página abre países que tornam a comparação didática: Brasil, Portugal, Alemanha, Espanha, Peru, Colômbia e Bolívia.",
    ],
    findings: [
      "Portugal e Alemanha usam a dignidade como fórmula estruturante logo no início do texto constitucional, enquanto outras constituições conectam a ideia a igualdade, proteção social ou integridade pessoal.",
      "A consulta semântica tende a recuperar vizinhanças úteis para leitura, não apenas ocorrências literais da palavra “dignidade”.",
      "Selecionar poucos países antes de buscar reduz ruído e facilita comparar o texto completo dos resultados.",
    ],
    methodologyNote:
      "A consulta sugerida não prova equivalência doutrinária entre sistemas. Ela cria uma lista inicial de dispositivos para leitura comparada e conferência no texto constitucional.",
    scholarlyAngle:
      "Showcase de busca semântica com termo constitucional clássico e estável no debate acadêmico lusófono.",
    mapPreview: preview("pt-busca-semantica-constituicoes", "Busca semântica por dignidade da pessoa humana no mapa constitucional"),
    atlasLink: {
      countries: ["BRA", "PRT", "DEU", "ESP", "PER", "COL", "BOL"],
      semantic: "dignidade da pessoa humana",
      color: "cluster",
      theme: "eternity-clauses",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "en-semantic-search-constitutions",
    locale: "en",
    translationGroup: "semantic-search-constitutions",
    category: "semantic-search",
    slugPath: ["semantic-search-constitutions"],
    title: "Semantic search for constitutions",
    description:
      "Use semantic search to find constitutional provisions about environmental rights, due process, dignity, and institutional design across different drafting traditions.",
    eyebrow: "Semantic search",
    question:
      "What changes when constitutional search is based on meaning rather than exact words?",
    shortAnswer:
      "A meaning-based query can connect provisions that describe the same constitutional problem with different vocabulary. That is especially useful for rights such as a healthy environment, due process, and dignity.",
    context: [
      "The example query opens a small set of countries with visible environmental-rights language and then colors the results by global cluster.",
      "This is useful for cold research traffic because the user starts from a concrete question, not from a blank map.",
    ],
    findings: [
      "Environmental-rights language appears in multiple constitutional families, including Latin American, European, Lusophone, and Nordic texts.",
      "Some constitutions frame the topic as an individual right; others pair it with duties of the state, citizens, or public authorities.",
      "Semantic search helps expose neighboring provisions about health, natural resources, public policy, and intergenerational protection.",
    ],
    methodologyNote:
      "Semantic retrieval broadens the candidate set. The final claim should be checked by reading the full provision and, where needed, the constitutional amendment or doctrinal history.",
    scholarlyAngle:
      "English showcase of semantic search using a low-polarization, high-growth constitutional-rights topic.",
    mapPreview: preview("en-semantic-search-constitutions", "Semantic search preview for the right to a healthy environment"),
    atlasLink: {
      countries: ["BRA", "PRT", "COL", "ECU", "ARG", "NOR", "TUR"],
      semantic: "right to a healthy environment",
      color: "cluster",
      theme: "right-to-a-healthy-environment",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_EN,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "pt-brasil-portugal-saude",
    locale: "pt",
    translationGroup: "brazil-portugal-health",
    category: "country-comparison",
    slugPath: ["comparar", "brasil-portugal-saude"],
    title: "Brasil e Portugal tratam saúde de forma semanticamente próxima?",
    description:
      "Compare o direito à saúde na Constituição brasileira de 1988 e na Constituição portuguesa de 1976 usando busca semântica e mapa 3D.",
    eyebrow: "Brasil × Portugal",
    question:
      "Brasil e Portugal tratam saúde como direito constitucional de maneira semanticamente próxima?",
    shortAnswer:
      "Sim, há aproximação relevante: ambos constitucionalizam saúde como direito e dever público. A diferença aparece no desenho institucional, na linguagem de sistema e na conexão com segurança social, políticas públicas e deveres de promoção.",
    context: [
      "O par é útil para usuários lusófonos porque reduz a barreira linguística e permite começar a leitura com dois textos conhecidos: Art. 196 da Constituição brasileira e Art. 64 da Constituição portuguesa.",
      "A comparação não deve parar na palavra “saúde”. O mapa ajuda a ver a vizinhança semântica com seguridade social, ambiente, consumidores, família e deveres estatais.",
    ],
    findings: [
      "O Brasil formula saúde como “direito de todos” e dever estatal garantido por políticas sociais e econômicas.",
      "Portugal combina direito à proteção da saúde com dever de defesa e promoção, aproximando o tema de organização pública e responsabilidade social.",
      "A seleção BR–PT mostra como uma mesma língua pode ocultar escolhas institucionais distintas dentro de uma área semântica comum.",
    ],
    methodologyNote:
      "A página usa a tradução disponível no corpus para orientar a comparação. Para citação jurídica final, confira a versão oficial de cada Constituição e o contexto doutrinário local.",
    scholarlyAngle:
      "Entrada lusófona concreta para direito à saúde e constitucionalismo social.",
    mapPreview: preview("pt-brasil-portugal-saude", "Comparação semântica entre Brasil e Portugal sobre direito à saúde"),
    atlasLink: {
      countries: ["BRA", "PRT"],
      semantic: "direito à saúde sistema público saúde",
      q: "health",
      color: "cluster",
      theme: "right-to-a-healthy-environment",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "en-germany-italy-eternity-clauses",
    locale: "en",
    translationGroup: "germany-italy-eternity-clauses",
    category: "country-comparison",
    slugPath: ["examples", "germany-italy-eternity-clauses"],
    title: "Germany, Italy, and eternity clauses",
    description:
      "Compare how Germany and Italy protect constitutional identity from ordinary amendment, with Brazil added as a third reference point.",
    eyebrow: "Germany × Italy",
    question:
      "How do Germany and Italy constitutionalize limits on constitutional amendment?",
    shortAnswer:
      "Germany states a broad eternity clause in Article 79(3), while Italy protects the republican form in Article 139. Adding Brazil shows a third drafting style: enumerated unamendable clauses in Article 60(4).",
    context: [
      "This comparison is useful because the countries do not use identical formulas. The semantic map places amendment limits, constitutional identity, dignity, federalism, and republican form near one another when their legal function overlaps.",
      "The CTA includes Brazil as a reference point because Brazilian scholarship often compares Article 60(4) with the German eternity clause.",
    ],
    findings: [
      "Germany's Article 79(3) is framed as a material limit on amendment affecting federal structure and the core principles of Articles 1 and 20.",
      "Italy's Article 139 is narrower in wording, protecting the republican form from constitutional amendment.",
      "Brazil provides a useful bridge case because its unamendable clauses list institutional and rights commitments rather than relying on a single formula.",
    ],
    methodologyNote:
      "The Atlas compares constitutional text. Doctrines such as India's basic-structure doctrine are relevant context, but they are not treated as textual provisions unless present in the corpus.",
    scholarlyAngle:
      "English country-pair page for the stable search term “eternity clauses”.",
    mapPreview: preview("en-germany-italy-eternity-clauses", "Germany, Italy, and Brazil plotted for eternity-clause comparison"),
    atlasLink: {
      countries: ["DEU", "ITA", "BRA"],
      semantic: "eternity clauses constitutional amendment republican form human dignity",
      q: "amendment",
      color: "cluster",
      theme: "eternity-clauses",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_EN,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "pt-brasil-alemanha-direitos-sociais",
    locale: "pt",
    translationGroup: "brazil-germany-social-rights",
    category: "country-comparison",
    slugPath: ["comparar", "brasil-alemanha-direitos-sociais"],
    title: "Brasil e Alemanha: dignidade, Estado social e direitos sociais",
    description:
      "Use o mapa semântico para comparar fundamentos constitucionais de dignidade, Estado social e proteção social na Alemanha e no Brasil.",
    eyebrow: "Brasil × Alemanha",
    question:
      "Como Brasil e Alemanha aproximam dignidade humana e constitucionalismo social?",
    shortAnswer:
      "A aproximação não é uma cópia textual. A Alemanha coloca dignidade e força vinculante dos direitos fundamentais no centro do texto; o Brasil combina dignidade, objetivos sociais, direitos fundamentais e uma ordem social extensa.",
    context: [
      "O par é clássico em debates sobre dignidade da pessoa humana, mínimo existencial e deveres positivos do Estado.",
      "O mapa não resolve a discussão dogmática, mas ajuda a encontrar onde cada Constituição posiciona fundamentos, direitos sociais, organização estatal e limites de reforma.",
    ],
    findings: [
      "Na Alemanha, dignidade aparece como núcleo textual explícito e ponto de partida para direitos fundamentais.",
      "No Brasil, a dignidade convive com objetivos constitucionais de justiça social e um catálogo amplo de direitos sociais.",
      "A comparação mostra como uma mesma categoria acadêmica pode se distribuir por artigos muito diferentes dentro de cada Constituição.",
    ],
    methodologyNote:
      "A página foi desenhada para pesquisa inicial. Leituras sobre Sarlet, Sarmento, Alexy e mínimo existencial entram como bibliografia externa, não como dado produzido automaticamente pelo Atlas.",
    scholarlyAngle:
      "Comparação acadêmica de alta demanda e baixa polarização sobre dignidade e constitucionalismo social.",
    mapPreview: preview("pt-brasil-alemanha-direitos-sociais", "Brasil e Alemanha no mapa semântico de dignidade e direitos sociais"),
    atlasLink: {
      countries: ["BRA", "DEU"],
      semantic: "dignidade humana Estado social direitos sociais mínimo existencial",
      q: "dignity",
      color: "cluster",
      theme: "eternity-clauses",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "pt-clausulas-petreas",
    locale: "pt",
    translationGroup: "eternity-clauses",
    category: "theme",
    slugPath: ["temas", "clausulas-petreas"],
    title: "Cláusulas pétreas e limites materiais ao poder de reforma",
    description:
      "Explore como constituições protegem certos compromissos contra emendas ordinárias: Brasil, Alemanha, Itália, Angola, Moçambique e outros casos.",
    eyebrow: "Tema constitucional",
    question:
      "Como constituições tornam certos compromissos resistentes ao poder de reforma?",
    shortAnswer:
      "Elas usam técnicas diferentes: listas de matérias intangíveis, proteção da forma republicana, preservação de princípios fundantes, limites circunstanciais e maiorias qualificadas.",
    context: [
      "O tema é estável em pesquisa constitucional porque conecta teoria do poder constituinte, democracia, direitos fundamentais e identidade constitucional.",
      "O mapa permite comparar a redação de limites materiais sem pressupor que todos os países usam a expressão brasileira “cláusulas pétreas”.",
    ],
    findings: [
      "Brasil, Alemanha e Itália exemplificam três estilos textuais: lista de matérias, núcleo de princípios e proteção da forma republicana.",
      "Constituições lusófonas africanas também apresentam limites materiais expressos, o que amplia a comparação para além do eixo Brasil–Europa.",
      "A busca por “amendment” e por termos semânticos de intangibilidade captura mais casos do que a busca literal por “eternity clause”.",
    ],
    methodologyNote:
      "O Atlas localiza textos constitucionais. Ele não incorpora automaticamente doutrinas judiciais que criam limites implícitos, salvo quando aparecem como texto constitucional no corpus.",
    scholarlyAngle:
      "Tema institucional forte para tráfego acadêmico e comparações de teoria constitucional.",
    mapPreview: preview("pt-clausulas-petreas", "Mapa de cláusulas pétreas e limites constitucionais de reforma"),
    atlasLink: {
      countries: ["BRA", "DEU", "ITA", "AGO", "MOZ", "GNB"],
      semantic: "cláusulas pétreas emendas constitucionais limites materiais",
      q: "amendment",
      color: "cluster",
      theme: "eternity-clauses",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "pt-controle-de-constitucionalidade",
    locale: "pt",
    translationGroup: "judicial-review-models",
    category: "theme",
    slugPath: ["temas", "controle-de-constitucionalidade"],
    title: "Controle de constitucionalidade: modelos difuso, concentrado e misto",
    description:
      "Compare como constituições descrevem tribunais constitucionais, cortes supremas e mecanismos de controle de constitucionalidade.",
    eyebrow: "Tema institucional",
    question:
      "Como diferentes constituições distribuem o controle de constitucionalidade entre cortes e procedimentos?",
    shortAnswer:
      "O texto constitucional revela desenhos variados: cortes constitucionais especializadas, supremas cortes com competência constitucional, controles preventivos e sistemas mistos.",
    context: [
      "Este é um dos temas mais úteis para tráfego acadêmico porque as expressões variam muito entre tradições kelsenianas, modelos difusos e sistemas híbridos.",
      "A busca semântica ajuda a encontrar dispositivos sobre tribunais, competência, revisão normativa e conflitos federativos mesmo quando a expressão “judicial review” não aparece.",
    ],
    findings: [
      "Portugal, Itália, Alemanha, Colômbia, Peru e Bolívia trazem linguagem explícita sobre tribunais constitucionais ou cortes com função constitucional.",
      "Brasil usa a centralidade do Supremo Tribunal Federal em vez de um tribunal constitucional separado, aproximando-se de modelos mistos.",
      "A Constituição dos EUA tem pouco texto sobre judicial review, o que mostra um limite importante da comparação puramente textual.",
    ],
    methodologyNote:
      "A página compara texto constitucional, não prática jurisprudencial. Países com doutrinas judiciais centrais podem parecer menos explícitos no mapa se a competência não estiver textualizada.",
    scholarlyAngle:
      "Tema estrutural, não partidário, com alto valor para graduação, pós-graduação e pesquisa comparada.",
    mapPreview: preview("pt-controle-de-constitucionalidade", "Modelos de controle de constitucionalidade no espaço semântico"),
    atlasLink: {
      countries: ["BRA", "PRT", "DEU", "ITA", "COL", "PER", "BOL", "USA"],
      semantic: "controle de constitucionalidade tribunal constitucional suprema corte",
      q: "constitutional court",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "en-right-to-a-healthy-environment",
    locale: "en",
    translationGroup: "right-to-a-healthy-environment",
    category: "theme",
    slugPath: ["themes", "right-to-a-healthy-environment"],
    title: "The constitutional right to a healthy environment",
    description:
      "Compare how constitutions protect environmental quality, health, natural resources, and duties toward future generations.",
    eyebrow: "Constitutional theme",
    question:
      "How do constitutions describe the right to a healthy environment?",
    shortAnswer:
      "Many constitutions now frame environmental protection as both a right and a duty. The strongest comparative signal is not one phrase, but a neighborhood of provisions about health, nature, public policy, and intergenerational protection.",
    context: [
      "This theme is growing but remains less partisan than many rights topics. It also demonstrates semantic search well because constitutional texts use varied formulas.",
      "The CTA opens countries with visible environmental language from Latin America, Europe, Lusophone Africa, Norway, and Turkey.",
    ],
    findings: [
      "Brazil, Portugal, Colombia, Ecuador, Argentina, Angola, Mozambique, Cape Verde, Norway, and Turkey all include environment-related constitutional language in different forms.",
      "Some texts emphasize an individual right; others combine rights with duties to defend, preserve, or improve the environment.",
      "The environmental cluster often borders health, public administration, land, natural resources, and development policy.",
    ],
    methodologyNote:
      "The page identifies textual patterns. It does not measure environmental enforcement, litigation success, or policy outcomes.",
    scholarlyAngle:
      "Low-polarization English theme page for a growing constitutional-rights query.",
    mapPreview: preview("en-right-to-a-healthy-environment", "Constitutional right to a healthy environment across selected countries"),
    atlasLink: {
      countries: ["BRA", "PRT", "COL", "ECU", "ARG", "AGO", "MOZ", "CPV", "NOR", "TUR"],
      semantic: "right to a healthy environment",
      q: "environment",
      color: "cluster",
      theme: "right-to-a-healthy-environment",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_EN,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "pt-latam-pos-1980",
    locale: "pt",
    translationGroup: "latin-america-post-1980",
    category: "bloc-comparison",
    slugPath: ["blocos", "america-latina-constituicoes-pos-1980"],
    title: "Constituições latino-americanas pós-1980 no mapa semântico",
    description:
      "Compare Brasil, Colômbia, Peru, Argentina, Equador e Bolívia como parte da onda democrática e do novo constitucionalismo latino-americano.",
    eyebrow: "América Latina pós-1980",
    question:
      "O que aproxima constituições latino-americanas adotadas ou reformadas depois das transições democráticas?",
    shortAnswer:
      "Elas combinam reconstrução institucional, catálogos de direitos, mecanismos de controle e temas sociais. A proximidade semântica ajuda a separar ondas políticas gerais de escolhas textuais concretas.",
    context: [
      "O recorte evita um bloco geopolítico contemporâneo e usa uma chave acadêmica mais limpa: constituições democráticas e reformas estruturais depois de 1980.",
      "O CTA abre Brasil, Colômbia, Peru, Argentina, Equador e Bolívia, permitindo comparar direitos, cortes, ambiente e organização do Estado.",
    ],
    findings: [
      "Colômbia, Equador e Bolívia tendem a exibir catálogos extensos e linguagem forte sobre direitos, participação e organização estatal.",
      "Brasil e Argentina oferecem pontos de comparação úteis por combinarem transição democrática com tradições federativas diferentes.",
      "A busca por tribunais constitucionais, ambiente e direitos sociais ajuda a distinguir convergências regionais de soluções nacionais específicas.",
    ],
    methodologyNote:
      "O rótulo “novo constitucionalismo latino-americano” é usado como contexto de pesquisa, não como classificação automática do Atlas.",
    scholarlyAngle:
      "Bloco regional neutro e estabelecido para pesquisa comparada em português.",
    mapPreview: preview("pt-america-latina-constituicoes-pos-1980", "Constituições latino-americanas pós-1980 no mapa semântico"),
    atlasLink: {
      preset: "latin-america-post-1980",
      semantic: "tribunal constitucional direitos sociais meio ambiente",
      color: "cluster",
      theme: "latin-america-post-1980",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "pt-cplp-constituicoes-lusofonas",
    locale: "pt",
    translationGroup: "cplp-lusophone-constitutions",
    category: "bloc-comparison",
    slugPath: ["blocos", "cplp-constituicoes-lusofonas"],
    title: "Constituições lusófonas da CPLP: língua comum, desenhos diferentes",
    description:
      "Compare Brasil, Portugal, Angola, Moçambique, Cabo Verde, Guiné-Bissau, São Tomé e Príncipe e Timor-Leste no mesmo mapa constitucional.",
    eyebrow: "CPLP",
    question:
      "Constituições em língua portuguesa se aproximam semanticamente por compartilharem idioma?",
    shortAnswer:
      "A língua comum ajuda a leitura, mas não determina o desenho constitucional. As constituições lusófonas aproximam-se em direitos sociais e deveres estatais, mas divergem em organização territorial, sistema de governo e limites de reforma.",
    context: [
      "Este recorte é forte para tráfego lusófono e menos explorado que comparações entre grandes blocos geopolíticos.",
      "O CTA usa países da CPLP presentes no corpus: Brasil, Portugal, Angola, Moçambique, Cabo Verde, Guiné-Bissau, São Tomé e Príncipe e Timor-Leste.",
    ],
    findings: [
      "Saúde, educação, ambiente e dignidade aparecem como temas recorrentes nas constituições lusófonas, ainda que com redações e densidades diferentes.",
      "A semelhança linguística não elimina diferenças institucionais relevantes, especialmente em revisão constitucional, poder local e desenho dos tribunais.",
      "O mapa permite testar se a proximidade vem do idioma, do tema ou de trajetórias constitucionais pós-autoritárias e pós-coloniais.",
    ],
    methodologyNote:
      "A comparação usa traduções e textos disponíveis no corpus. Para uso forense ou citação acadêmica final, confira a redação oficial e a versão temporal de cada Constituição.",
    scholarlyAngle:
      "Bloco lusófono neutro, específico e com alta utilidade para audiência PT-BR/PT-PT.",
    mapPreview: preview("pt-cplp-constituicoes-lusofonas", "Constituições lusófonas da CPLP no mapa semântico"),
    atlasLink: {
      preset: "CPLP",
      semantic: "saúde educação ambiente dignidade",
      color: "cluster",
      theme: "lusophone-constitutions",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_PT,
    publishedAt: FIRST_PUBLISHED_AT,
    updatedAt: FIRST_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "es-derecho-constitucional-comparado",
    locale: "es",
    translationGroup: "comparative-constitutional-law",
    category: "pillar",
    slugPath: ["derecho-constitucional-comparado"],
    title: "Derecho constitucional comparado en un mapa semántico",
    description:
      "Explore cómo el Atlas convierte constituciones de todo el mundo en preguntas comparativas, clústeres temáticos y rutas de investigación verificables.",
    eyebrow: "Derecho constitucional comparado",
    question:
      "¿Qué cambia cuando las constituciones se leen como un espacio semántico común?",
    shortAnswer:
      "La comparación deja de depender solo de palabras idénticas. El mapa permite probar funciones constitucionales semejantes en textos redactados con vocabularios, tradiciones y estructuras distintas.",
    context: [
      "Esta página funciona como punto de entrada en español para investigaciones amplias que luego bajan a temas concretos: búsqueda semántica, derechos, instituciones y bloques regionales.",
      "La lectura correcta es exploratoria. La proximidad en el mapa sugiere hipótesis; el texto completo de cada disposición confirma, matiza o corrige la comparación.",
    ],
    findings: [
      "Las constituciones pueden aproximarse por función jurídica aunque usen fórmulas muy diferentes para derechos, tribunales o deberes estatales.",
      "Las páginas con preguntas estrechas ayudan a reducir ruido porque abren el Atlas con países, consulta y modo de color coherentes con la hipótesis.",
      "El valor del mapa aumenta cuando se combina con lectura doctrinal y verificación de la versión constitucional aplicable.",
    ],
    methodologyNote:
      "Use el mapa como instrumento de orientación. La similitud semántica no equivale a identidad normativa ni sustituye la interpretación jurídica local.",
    scholarlyAngle:
      "Hub en español para investigación comparada de baja polarización editorial.",
    mapPreview: preview("es-derecho-constitucional-comparado", "Mapa semántico para derecho constitucional comparado en español"),
    atlasLink: {
      countries: ["ESP", "MEX", "COL", "PER", "ARG", "ECU", "BOL"],
      semantic: "derechos sociales tribunal constitucional educación medio ambiente",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [
      "es-busqueda-semantica-constituciones",
      "es-derecho-medio-ambiente-sano",
      "es-constituciones-iberoamericanas-educacion",
    ],
    sourceLinks: COMMON_SOURCES_ES,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "es-busqueda-semantica-constituciones",
    locale: "es",
    translationGroup: "semantic-search-constitutions",
    category: "semantic-search",
    slugPath: ["busqueda-semantica-constituciones"],
    title: "Búsqueda semántica en constituciones",
    description:
      "Use búsqueda por significado para encontrar disposiciones sobre dignidad, debido proceso y derechos sociales aunque no compartan la misma fórmula textual.",
    eyebrow: "Búsqueda semántica",
    question:
      "¿Cómo encontrar textos constitucionales cercanos cuando no usan las mismas palabras?",
    shortAnswer:
      "Una consulta semántica parte del sentido de la pregunta. Puede acercar disposiciones sobre dignidad, igualdad, protección social o garantías procesales aunque cada país organice el tema de otra manera.",
    context: [
      "La búsqueda textual sigue siendo útil para frases cerradas. La búsqueda semántica ayuda cuando el investigador quiere abrir el campo a traducciones, sinónimos o tradiciones jurídicas distintas.",
      "La selección inicial de países hispanohablantes hace más fácil revisar los resultados y comparar el texto completo antes de ampliar la muestra.",
    ],
    findings: [
      "La dignidad humana puede aparecer como fundamento del Estado, límite al poder público o principio vinculado a derechos sociales.",
      "La búsqueda semántica tiende a recuperar vecindarios de lectura, no solo apariciones literales de una palabra.",
      "Filtrar por pocos países al inicio ayuda a distinguir coincidencias útiles de resultados demasiado generales.",
    ],
    methodologyNote:
      "La consulta sugerida crea una lista inicial de disposiciones para lectura comparada; no prueba por sí sola equivalencia doctrinal entre sistemas.",
    scholarlyAngle:
      "Entrada en español para explicar la búsqueda semántica con temas constitucionales clásicos.",
    mapPreview: preview("es-busqueda-semantica-constituciones", "Búsqueda semántica por dignidad y derechos en constituciones"),
    atlasLink: {
      countries: ["ESP", "MEX", "COL", "PER", "ARG", "ECU", "BOL"],
      semantic: "dignidad humana debido proceso derechos sociales",
      q: "dignidad",
      color: "cluster",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_ES,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "es-derecho-medio-ambiente-sano",
    locale: "es",
    translationGroup: "right-to-a-healthy-environment",
    category: "theme",
    slugPath: ["temas", "derecho-a-un-medio-ambiente-sano"],
    title: "El derecho constitucional a un medio ambiente sano",
    description:
      "Compare cómo las constituciones describen calidad ambiental, salud, recursos naturales y deberes hacia generaciones futuras.",
    eyebrow: "Tema constitucional",
    question:
      "¿Cómo aparece el derecho a un medio ambiente sano en el texto constitucional comparado?",
    shortAnswer:
      "Muchas constituciones combinan un derecho individual o colectivo con deberes de protección, preservación y mejora. El patrón aparece mejor como vecindario semántico que como una sola frase.",
    context: [
      "El tema es útil para mostrar búsqueda semántica porque los textos usan fórmulas variadas: ambiente sano, equilibrio ecológico, recursos naturales, salud y deberes públicos.",
      "El CTA reúne ejemplos latinoamericanos, ibéricos y de otras regiones para que el usuario vea convergencias y diferencias de redacción.",
    ],
    findings: [
      "Algunos textos formulan el ambiente como derecho; otros lo vinculan a deberes del Estado, de la ciudadanía o de autoridades públicas.",
      "El clúster ambiental suele estar cerca de salud, desarrollo, recursos naturales y políticas públicas.",
      "La comparación textual no mide cumplimiento ambiental, pero ayuda a localizar compromisos constitucionales verificables.",
    ],
    methodologyNote:
      "El Atlas identifica patrones textuales. Las conclusiones sobre exigibilidad o resultados ambientales requieren fuentes jurídicas y empíricas adicionales.",
    scholarlyAngle:
      "Tema ambiental estable y de amplio interés para audiencias hispanohablantes.",
    mapPreview: preview("es-derecho-medio-ambiente-sano", "Derecho a un medio ambiente sano en el mapa constitucional"),
    atlasLink: {
      countries: ["ESP", "MEX", "COL", "ECU", "ARG", "BRA", "PRT"],
      semantic: "derecho a un medio ambiente sano",
      q: "environment",
      color: "cluster",
      theme: "right-to-a-healthy-environment",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_ES,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "es-constituciones-iberoamericanas-educacion",
    locale: "es",
    translationGroup: "ibero-american-education-rights",
    category: "bloc-comparison",
    slugPath: ["bloques", "constituciones-iberoamericanas-educacion"],
    title: "Educación en constituciones iberoamericanas",
    description:
      "Compare cómo España y constituciones latinoamericanas de habla hispana formulan educación, deberes estatales y acceso público.",
    eyebrow: "Iberoamérica",
    question:
      "¿Qué patrones aparecen al comparar el derecho a la educación en constituciones iberoamericanas?",
    shortAnswer:
      "La educación suele aparecer como derecho, deber público y mecanismo de ciudadanía. La diferencia está en la densidad del texto: gratuidad, obligatoriedad, autonomía, pluralismo y responsabilidad estatal.",
    context: [
      "El tema es específico para lectores en español y evita debates partidistas inmediatos al centrarse en diseño constitucional y políticas públicas de larga duración.",
      "La muestra abre España, México, Colombia, Perú, Argentina, Ecuador y Bolivia para comparar redacciones educativas sin asumir una única tradición regional.",
    ],
    findings: [
      "La educación aparece tanto como derecho individual como objetivo institucional de formación ciudadana.",
      "Los textos varían en la intensidad con que mencionan gratuidad, obligatoriedad, calidad y acceso igualitario.",
      "El mapa permite separar similitudes lingüísticas de decisiones constitucionales más precisas sobre deberes del Estado.",
    ],
    methodologyNote:
      "El recorte iberoamericano es editorial, no una clasificación automática. Para citas finales, revise la versión constitucional vigente de cada país.",
    scholarlyAngle:
      "Página específica para público hispanohablante sobre educación constitucional comparada.",
    mapPreview: preview("es-constituciones-iberoamericanas-educacion", "Educación en constituciones iberoamericanas"),
    atlasLink: {
      countries: ["ESP", "MEX", "COL", "PER", "ARG", "ECU", "BOL"],
      semantic: "derecho a la educación educación pública deber del Estado",
      q: "education",
      color: "cluster",
      theme: "education-rights",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_ES,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
    audienceSpecific: true,
  },
  {
    id: "it-diritto-costituzionale-comparato",
    locale: "it",
    translationGroup: "comparative-constitutional-law",
    category: "pillar",
    slugPath: ["diritto-costituzionale-comparato"],
    title: "Diritto costituzionale comparato in una mappa semantica",
    description:
      "Scopri come l'Atlante trasforma le costituzioni in domande comparative, cluster tematici e percorsi di ricerca verificabili.",
    eyebrow: "Diritto costituzionale comparato",
    question:
      "Che cosa mostra il diritto costituzionale comparato quando i testi sono letti come spazio semantico comune?",
    shortAnswer:
      "La mappa aiuta a confrontare funzioni costituzionali simili anche quando le formule testuali cambiano. È un livello di orientamento prima della lettura giuridica ravvicinata.",
    context: [
      "Questa pagina è l'hub in italiano per ricerche che partono da un quadro ampio e poi scendono verso dignità, diritti sociali, corti costituzionali e limiti alla revisione.",
      "L'Atlante non sostituisce l'interpretazione dottrinale. Suggerisce quali paesi, cluster e disposizioni meritano una verifica nel testo completo.",
    ],
    findings: [
      "La prossimità semantica spesso segue la funzione giuridica più della formulazione letterale.",
      "Le comparazioni più utili partono da pochi paesi e da una domanda concreta, non da una mappa globale indifferenziata.",
      "Le pagine figlie consentono di riaprire lo stesso stato dell'Atlante con query, paesi e colore già impostati.",
    ],
    methodologyNote:
      "La distanza semantica orienta la ricerca, ma non prova identità normativa. Ogni ipotesi va confermata nel testo e nel contesto giuridico nazionale.",
    scholarlyAngle:
      "Hub italiano per ricerche accademiche di diritto costituzionale comparato assistite dall'AI.",
    mapPreview: preview("it-diritto-costituzionale-comparato", "Mappa semantica per diritto costituzionale comparato in italiano"),
    atlasLink: {
      countries: ["ITA", "DEU", "FRA", "ESP", "PRT", "BRA", "COL"],
      semantic: "dignità diritti sociali corte costituzionale ambiente",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [
      "it-ricerca-semantica-costituzioni",
      "it-germania-italia-clausole-eterne",
      "it-corti-costituzionali-modelli-comparati",
    ],
    sourceLinks: COMMON_SOURCES_IT,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "it-ricerca-semantica-costituzioni",
    locale: "it",
    translationGroup: "semantic-search-constitutions",
    category: "semantic-search",
    slugPath: ["ricerca-semantica-costituzioni"],
    title: "Ricerca semantica nelle costituzioni",
    description:
      "Trova disposizioni su dignità, diritti sociali e istituzioni anche quando le costituzioni non usano le stesse parole.",
    eyebrow: "Ricerca semantica",
    question:
      "Come trovare disposizioni costituzionali vicine senza cercare solo la stessa formula?",
    shortAnswer:
      "La ricerca semantica parte dal significato della domanda. Può avvicinare testi su dignità, eguaglianza, Stato sociale e garanzie istituzionali anche con lessici diversi.",
    context: [
      "La ricerca testuale resta utile per espressioni precise. La ricerca semantica serve quando il problema giuridico è stabile ma cambia la formulazione costituzionale.",
      "La selezione proposta combina Italia, Germania, Francia, Spagna, Portogallo e Brasile per mostrare tradizioni costituzionali affini e diverse.",
    ],
    findings: [
      "Dignità e diritti sociali possono essere collocati in parti diverse della costituzione pur svolgendo funzioni comparabili.",
      "Una query semantica produce un insieme di candidati per la lettura, non una conclusione dottrinale automatica.",
      "La restrizione iniziale a pochi paesi rende più chiaro il passaggio dal risultato del mapa al testo completo.",
    ],
    methodologyNote:
      "La ricerca semantica amplia il campo dei candidati. La citazione giuridica richiede verifica della disposizione e della versione costituzionale pertinente.",
    scholarlyAngle:
      "Pagina italiana per introdurre la ricerca per significato su concetti costituzionali stabili.",
    mapPreview: preview("it-ricerca-semantica-costituzioni", "Ricerca semantica su dignità e diritti nelle costituzioni"),
    atlasLink: {
      countries: ["ITA", "DEU", "FRA", "ESP", "PRT", "BRA"],
      semantic: "dignità umana diritti sociali controllo costituzionale",
      q: "dignity",
      color: "cluster",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_IT,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "it-germania-italia-clausole-eterne",
    locale: "it",
    translationGroup: "germany-italy-eternity-clauses",
    category: "country-comparison",
    slugPath: ["esempi", "germania-italia-clausole-eterne"],
    title: "Germania, Italia e limiti alla revisione costituzionale",
    description:
      "Confronta il modo in cui Germania e Italia proteggono identità costituzionale, forma repubblicana e principi fondamentali dalla revisione ordinaria.",
    eyebrow: "Germania × Italia",
    question:
      "Come Germania e Italia costituzionalizzano i limiti alla revisione?",
    shortAnswer:
      "La Germania formula una clausola ampia nell'articolo 79(3), mentre l'Italia protegge la forma repubblicana nell'articolo 139. Il confronto mostra due tecniche testuali diverse per preservare impegni costituzionali.",
    context: [
      "Il tema è particolarmente rilevante per lettori italiani perché l'articolo 139 è breve ma ha forte valore sistematico nella teoria della revisione.",
      "L'Atlante aggiunge il Brasile come terzo punto di riferimento, utile per vedere una tecnica enumerativa di clausole non emendabili.",
    ],
    findings: [
      "La Germania collega i limiti alla revisione a dignità, federalismo e principi fondamentali.",
      "L'Italia usa una formula più concentrata, centrata sulla forma repubblicana.",
      "Il Brasile mostra una lista esplicita di materie protette, utile come ponte comparativo.",
    ],
    methodologyNote:
      "La pagina compara testo costituzionale. Le dottrine sui limiti impliciti alla revisione restano contesto esterno e devono essere verificate in fonti nazionali.",
    scholarlyAngle:
      "Pagina specifica per pubblico italiano su articolo 139, Germania e clausole non emendabili.",
    mapPreview: preview("it-germania-italia-clausole-eterne", "Germania, Italia e Brasile nel confronto sui limiti alla revisione"),
    atlasLink: {
      countries: ["DEU", "ITA", "BRA"],
      semantic: "clausole eterne revisione costituzionale forma repubblicana dignità",
      q: "amendment",
      color: "cluster",
      theme: "eternity-clauses",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_IT,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
    audienceSpecific: true,
  },
  {
    id: "it-corti-costituzionali-modelli-comparati",
    locale: "it",
    translationGroup: "judicial-review-models",
    category: "theme",
    slugPath: ["temi", "corti-costituzionali-modelli-comparati"],
    title: "Corti costituzionali e modelli di controllo",
    description:
      "Confronta corti costituzionali, corti supreme e competenze di controllo nei testi costituzionali.",
    eyebrow: "Tema istituzionale",
    question:
      "Come le costituzioni distribuiscono il controllo di costituzionalità tra corti e procedure?",
    shortAnswer:
      "I testi mostrano modelli specializzati, supremi, preventivi e misti. La mappa aiuta a trovare disposizioni funzionalmente vicine anche quando non usano la stessa espressione.",
    context: [
      "Il tema è stabile e utile per corsi di diritto pubblico comparato perché separa il testo costituzionale dalla pratica giurisprudenziale.",
      "La selezione include paesi europei e latinoamericani per visualizzare modelli kelseniani, corti supreme e sistemi ibridi.",
    ],
    findings: [
      "Italia e Germania rendono visibile il modello di corte costituzionale specializzata.",
      "Brasile e Stati Uniti mostrano il limite della sola lettura testuale quando la pratica giudiziaria è centrale.",
      "La ricerca semantica intercetta competenze, conflitti e revisione normativa anche senza la formula inglese judicial review.",
    ],
    methodologyNote:
      "L'Atlante compara disposizioni scritte. La prassi delle corti e la dottrina nazionale devono essere lette come livello successivo.",
    scholarlyAngle:
      "Tema istituzionale non polemico per pubblico italiano e comparatistico.",
    mapPreview: preview("it-corti-costituzionali-modelli-comparati", "Modelli di corti costituzionali nel mapa semantico"),
    atlasLink: {
      countries: ["ITA", "DEU", "FRA", "ESP", "PRT", "BRA", "COL", "USA"],
      semantic: "corte costituzionale controllo di costituzionalità corte suprema",
      q: "constitutional court",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_IT,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "fr-droit-constitutionnel-compare",
    locale: "fr",
    translationGroup: "comparative-constitutional-law",
    category: "pillar",
    slugPath: ["droit-constitutionnel-compare"],
    title: "Droit constitutionnel comparé dans une carte sémantique",
    description:
      "Découvrez comment l'Atlas transforme les constitutions en questions comparatives, clusters thématiques et parcours de recherche vérifiables.",
    eyebrow: "Droit constitutionnel comparé",
    question:
      "Que révèle le droit constitutionnel comparé quand les constitutions sont lues comme un espace sémantique commun ?",
    shortAnswer:
      "La carte met en évidence des proximités de fonction constitutionnelle plutôt que de simples correspondances lexicales. Elle aide à choisir les textes à lire avant de tirer une conclusion juridique.",
    context: [
      "Cette page sert de hub francophone pour passer d'une vue globale à des questions précises : recherche sémantique, droits environnementaux, institutions et décentralisation.",
      "L'Atlas est un outil de triage pour la recherche. Il signale des voisinages pertinents, mais la qualification juridique dépend du texte complet et du contexte national.",
    ],
    findings: [
      "Des constitutions de traditions différentes peuvent se rapprocher lorsqu'elles remplissent une même fonction institutionnelle.",
      "Les pages thématiques réduisent le bruit car elles ouvrent l'Atlas avec une hypothèse et une sélection de pays déjà définies.",
      "Les résultats les plus solides combinent carte, lecture de disposition et source constitutionnelle vérifiée.",
    ],
    methodologyNote:
      "La proximité sémantique n'est pas une identité normative. Elle sert à formuler des hypothèses de lecture comparée.",
    scholarlyAngle:
      "Hub francophone pour recherche comparée stable et non polémique.",
    mapPreview: preview("fr-droit-constitutionnel-compare", "Carte sémantique pour le droit constitutionnel comparé en français"),
    atlasLink: {
      countries: ["FRA", "BEL", "CHE", "SEN", "MAR", "TUN", "BRA"],
      semantic: "dignité droits sociaux cour constitutionnelle environnement",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [
      "fr-recherche-semantique-constitutions",
      "fr-droit-environnement-sain",
      "fr-constitutions-francophones-decentralisation",
    ],
    sourceLinks: COMMON_SOURCES_FR,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "fr-recherche-semantique-constitutions",
    locale: "fr",
    translationGroup: "semantic-search-constitutions",
    category: "semantic-search",
    slugPath: ["recherche-semantique-constitutions"],
    title: "Recherche sémantique dans les constitutions",
    description:
      "Trouvez des dispositions sur dignité, droits sociaux, garanties et institutions même lorsque les constitutions n'emploient pas les mêmes termes.",
    eyebrow: "Recherche sémantique",
    question:
      "Comment repérer des dispositions constitutionnelles proches sans chercher seulement le même mot ?",
    shortAnswer:
      "La recherche sémantique part du sens de la question. Elle rapproche des textes qui traitent d'un même problème constitutionnel avec des vocabulaires différents.",
    context: [
      "La recherche exacte reste adaptée aux expressions fermées. La recherche sémantique est utile pour explorer traductions, synonymes et architectures constitutionnelles différentes.",
      "La sélection initiale met en regard des textes européens, francophones et latino-américains pour montrer les limites d'une recherche purement lexicale.",
    ],
    findings: [
      "La dignité peut être formulée comme principe, droit, valeur ou limite à l'action publique.",
      "Les résultats sémantiques forment une liste de textes à lire, non une conclusion automatique.",
      "Le filtrage par pays rend la comparaison plus vérifiable pour un premier passage.",
    ],
    methodologyNote:
      "La recherche sémantique élargit le jeu de candidats. Toute conclusion doctrinale doit être confirmée dans le texte constitutionnel pertinent.",
    scholarlyAngle:
      "Introduction francophone à la recherche constitutionnelle par le sens.",
    mapPreview: preview("fr-recherche-semantique-constitutions", "Recherche sémantique de dignité et droits constitutionnels"),
    atlasLink: {
      countries: ["FRA", "BEL", "CHE", "SEN", "MAR", "BRA", "COL"],
      semantic: "dignité droits sociaux cour constitutionnelle environnement",
      q: "dignity",
      color: "cluster",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_FR,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "fr-droit-environnement-sain",
    locale: "fr",
    translationGroup: "right-to-a-healthy-environment",
    category: "theme",
    slugPath: ["themes", "droit-a-un-environnement-sain"],
    title: "Le droit constitutionnel à un environnement sain",
    description:
      "Comparez la manière dont les constitutions protègent qualité environnementale, santé, ressources naturelles et générations futures.",
    eyebrow: "Thème constitutionnel",
    question:
      "Comment les constitutions décrivent-elles le droit à un environnement sain ?",
    shortAnswer:
      "Beaucoup de textes combinent droit, devoir et objectif public. Le signal comparatif apparaît dans un voisinage de notions : santé, nature, ressources, développement et responsabilité intergénérationnelle.",
    context: [
      "Le thème est assez stable pour une première vague éditoriale et montre bien l'intérêt d'une recherche par signification.",
      "Le CTA ouvre des exemples européens, latino-américains et extra-européens pour comparer les formulations constitutionnelles.",
    ],
    findings: [
      "Certains textes mettent l'accent sur le droit subjectif, d'autres sur les obligations de protection.",
      "Le vocabulaire environnemental est souvent proche de la santé, de l'aménagement du territoire et des ressources naturelles.",
      "La carte ne mesure pas l'effectivité des politiques publiques, mais localise les engagements textuels.",
    ],
    methodologyNote:
      "La page compare des dispositions écrites. L'application juridictionnelle et les résultats environnementaux exigent des sources complémentaires.",
    scholarlyAngle:
      "Thème environnemental comparé pour un public francophone large.",
    mapPreview: preview("fr-droit-environnement-sain", "Droit à un environnement sain dans la carte constitutionnelle"),
    atlasLink: {
      countries: ["FRA", "BEL", "CHE", "BRA", "COL", "ECU", "NOR", "TUR"],
      semantic: "droit à un environnement sain",
      q: "environment",
      color: "cluster",
      theme: "right-to-a-healthy-environment",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_FR,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "fr-constitutions-francophones-decentralisation",
    locale: "fr",
    translationGroup: "francophone-decentralization",
    category: "bloc-comparison",
    slugPath: ["blocs", "constitutions-francophones-decentralisation"],
    title: "Décentralisation dans les constitutions francophones",
    description:
      "Comparez collectivités territoriales, autonomie locale et organisation territoriale dans des textes constitutionnels francophones.",
    eyebrow: "Espace francophone",
    question:
      "Que montrent les constitutions francophones sur décentralisation et autonomie locale ?",
    shortAnswer:
      "Les textes associent souvent collectivités territoriales, libre administration, compétences locales et unité de l'État. Les différences portent sur le degré d'autonomie et la précision des garanties.",
    context: [
      "Le sujet est spécifiquement utile au public francophone parce que le vocabulaire de collectivités territoriales, décentralisation et libre administration circule dans plusieurs ordres constitutionnels.",
      "La sélection évite un cadrage géopolitique et privilégie une question institutionnelle stable.",
    ],
    findings: [
      "La décentralisation peut être formulée comme principe d'organisation, garantie locale ou simple technique administrative.",
      "Les constitutions francophones partagent parfois un vocabulaire, mais pas nécessairement le même équilibre entre autonomie et unité.",
      "La carte aide à repérer les textes qui méritent une comparaison article par article.",
    ],
    methodologyNote:
      "Le bloc francophone est un recadrage éditorial. Il ne remplace pas l'analyse historique, administrative ou doctrinale de chaque système.",
    scholarlyAngle:
      "Page spécifique pour lecteurs francophones sur décentralisation constitutionnelle comparée.",
    mapPreview: preview("fr-constitutions-francophones-decentralisation", "Décentralisation dans des constitutions francophones"),
    atlasLink: {
      countries: ["FRA", "BEL", "CHE", "SEN", "MAR", "TUN", "CMR", "CIV"],
      semantic: "collectivités territoriales décentralisation autonomie locale",
      q: "local government",
      color: "cluster",
      theme: "local-self-government",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_FR,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
    audienceSpecific: true,
  },
  {
    id: "ja-hikaku-kenpo-ai",
    locale: "ja",
    translationGroup: "comparative-constitutional-law",
    category: "pillar",
    slugPath: ["hikaku-kenpo-ai"],
    title: "AIセマンティック地図で読む比較憲法",
    description:
      "世界の憲法を、語句の一致だけでなく意味の近さから比較するための入口ページです。",
    eyebrow: "比較憲法",
    question:
      "憲法全体を共通の意味空間として読むと、比較憲法には何が見えるのでしょうか。",
    shortAnswer:
      "地図は、同じ表現を使っていなくても似た憲法上の機能をもつ規定を近くに置きます。研究者はそこから国、テーマ、条文を選び、本文で仮説を確認できます。",
    context: [
      "このページは日本語の入口として、意味検索、違憲審査、地方自治などの具体的な比較ページへつなぎます。",
      "Atlas は法解釈を自動化するものではありません。近くに見える規定を、各国の憲法本文と制度文脈で読み直すための道具です。",
    ],
    findings: [
      "語句が異なっても、権利保障、裁判所、地方自治などの機能が近い規定は同じ領域に現れます。",
      "最初から全世界を見るより、少数の国と明確な問いから始める方が検証しやすくなります。",
      "地図の近さは研究仮説であり、規範内容の同一性ではありません。",
    ],
    methodologyNote:
      "意味的近接は比較の出発点です。最終的な引用や評価には、条文の全文、改正時点、国内法学の文脈を確認してください。",
    scholarlyAngle:
      "日本語読者向けの比較憲法ハブ。",
    mapPreview: preview("ja-hikaku-kenpo-ai", "日本語の比較憲法向けセマンティック地図"),
    atlasLink: {
      countries: ["JPN", "KOR", "DEU", "ITA", "BRA", "USA", "ZAF"],
      semantic: "憲法裁判所 社会権 環境 地方自治",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [
      "ja-imi-kensaku-kenpo",
      "ja-constitutional-courts",
      "ja-local-self-government",
    ],
    sourceLinks: COMMON_SOURCES_JA,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "ja-imi-kensaku-kenpo",
    locale: "ja",
    translationGroup: "semantic-search-constitutions",
    category: "semantic-search",
    slugPath: ["imi-kensaku-kenpo"],
    title: "憲法の意味検索",
    description:
      "人間の尊厳、社会権、適正手続などを、完全一致ではなく意味の近さで探します。",
    eyebrow: "意味検索",
    question:
      "同じ言葉を使わない憲法規定を、どのように見つけられるでしょうか。",
    shortAnswer:
      "意味検索は問いの内容から出発します。翻訳や表現が異なっても、同じ憲法上の問題を扱う規定を候補として集め、次に読む条文を絞ることができます。",
    context: [
      "完全一致検索は特定の語句を探すときに有効です。意味検索は、概念が各国で別の場所や語彙で書かれる場合に役立ちます。",
      "日本、韓国、ドイツ、ブラジル、米国、南アフリカを小さな初期集合として開き、候補を本文で確認します。",
    ],
    findings: [
      "尊厳や適正手続は、権利章典、司法制度、国家義務の近くに現れることがあります。",
      "意味検索の結果は読むべき候補であり、法的結論そのものではありません。",
      "国を絞ると、表示された近接関係を条文単位で検証しやすくなります。",
    ],
    methodologyNote:
      "検索結果は翻訳された憲法テキストにも依存します。引用や授業利用では、必要に応じて公定訳または原文を確認してください。",
    scholarlyAngle:
      "日本語で意味検索の使い方を説明する入口ページ。",
    mapPreview: preview("ja-imi-kensaku-kenpo", "憲法テキストの意味検索プレビュー"),
    atlasLink: {
      countries: ["JPN", "KOR", "DEU", "BRA", "USA", "ZAF"],
      semantic: "人間の尊厳 社会権 適正手続",
      q: "dignity",
      color: "cluster",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_JA,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "ja-constitutional-courts",
    locale: "ja",
    translationGroup: "judicial-review-models",
    category: "theme",
    slugPath: ["themes", "constitutional-courts"],
    title: "憲法裁判所と違憲審査モデル",
    description:
      "憲法裁判所、最高裁判所、違憲審査権限の書き方を比較します。",
    eyebrow: "制度テーマ",
    question:
      "各国の憲法は、違憲審査をどの裁判所や手続に配分しているのでしょうか。",
    shortAnswer:
      "専門の憲法裁判所を置く国もあれば、最高裁判所や通常裁判所に憲法判断を委ねる国もあります。本文にどこまで明示されるかも制度差の一部です。",
    context: [
      "このテーマは、政治的争点よりも制度設計に焦点を置くため、比較憲法の導入として扱いやすいものです。",
      "日本、韓国、ドイツ、イタリア、ブラジル、米国、南アフリカを並べ、明文規定と判例法中心の制度の違いを確認します。",
    ],
    findings: [
      "ドイツやイタリアでは専門的な憲法裁判所モデルが本文上も見えやすくなります。",
      "米国や日本は、違憲審査の実際が本文だけでは十分に説明されない例を示します。",
      "意味検索は、権限、裁判所、法律審査、憲法紛争に関する近い規定を集めます。",
    ],
    methodologyNote:
      "このページは憲法本文の比較です。判例法上の発展や裁判所の実務は、別の資料で確認する必要があります。",
    scholarlyAngle:
      "日本語読者向けの違憲審査モデル比較。",
    mapPreview: preview("ja-constitutional-courts", "憲法裁判所と違憲審査モデルの比較"),
    atlasLink: {
      countries: ["JPN", "KOR", "DEU", "ITA", "BRA", "USA", "ZAF"],
      semantic: "違憲審査 憲法裁判所 最高裁判所",
      q: "constitutional court",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_JA,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "ja-local-self-government",
    locale: "ja",
    translationGroup: "local-self-government-comparative",
    category: "theme",
    slugPath: ["topics", "local-self-government"],
    title: "地方自治を憲法で比較する",
    description:
      "地方公共団体、自治権、地方政府、分権に関する憲法上の書き方を比較します。",
    eyebrow: "地方自治",
    question:
      "地方自治は、各国の憲法でどのように保障または設計されているのでしょうか。",
    shortAnswer:
      "地方自治は、自治権、地方公共団体、住民参加、国と地方の権限配分として書かれます。国によって、保障の強さと制度の具体性が大きく異なります。",
    context: [
      "日本語読者にとって地方自治は憲法学と行政法をつなぐ安定したテーマです。現在の党派的争点ではなく、制度設計として扱えます。",
      "日本、韓国、ドイツ、イタリア、フランス、スペインを並べ、地方自治の語彙と制度的位置づけを比較します。",
    ],
    findings: [
      "地方自治は、権利保障よりも国家組織や行政構造の近くに現れることが多くあります。",
      "同じ地方自治でも、分権、自治体、地域、住民参加などの語彙が国ごとに異なります。",
      "意味地図は、国と地方の関係を読むための条文候補を絞り込むのに役立ちます。",
    ],
    methodologyNote:
      "地方自治の実効性は憲法本文だけでは判断できません。地方制度法、財政制度、判例を合わせて読む必要があります。",
    scholarlyAngle:
      "日本語読者に特に有用な地方自治の比較憲法ページ。",
    mapPreview: preview("ja-local-self-government", "地方自治と自治体制度の憲法比較"),
    atlasLink: {
      countries: ["JPN", "KOR", "DEU", "ITA", "FRA", "ESP"],
      semantic: "地方自治 地方公共団体 自治権",
      q: "local self-government",
      color: "cluster",
      theme: "local-self-government",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_JA,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
    audienceSpecific: true,
  },
  {
    id: "zh-bijiao-xianfa-ai",
    locale: "zh",
    translationGroup: "comparative-constitutional-law",
    category: "pillar",
    slugPath: ["bijiao-xianfa-ai"],
    title: "用 AI 语义地图阅读比较宪法",
    description:
      "从语义相似度出发，比较世界各国宪法中的权利、机构、国家义务和制度设计。",
    eyebrow: "比较宪法",
    question:
      "如果把宪法文本放在同一个语义空间中，比较宪法能看到什么？",
    shortAnswer:
      "地图把功能相近的宪法规定放在邻近区域，即使它们使用不同的词语或翻译。研究者可以先发现候选文本，再回到完整条文和制度背景中验证。",
    context: [
      "本页是中文入口，连接到语义搜索、环境权以及宪法术语翻译等更具体的发现页面。",
      "Atlas 不是自动法律解释工具。它用于形成可检查的比较假设，并帮助用户决定下一步要阅读哪些条文。",
    ],
    findings: [
      "权利、义务、法院和地方制度等功能相近的规定，常常比字面词语更能显示比较关系。",
      "用少量国家和清晰问题开始，比直接查看全球地图更容易验证。",
      "语义距离是研究线索，不是规范内容相同的证明。",
    ],
    methodologyNote:
      "语义相似度只是比较研究的起点。正式引用或教学使用时，应核对相关宪法文本、版本和本国法背景。",
    scholarlyAngle:
      "中文比较宪法和 AI 语义地图入口。",
    mapPreview: preview("zh-bijiao-xianfa-ai", "中文比较宪法语义地图预览"),
    atlasLink: {
      countries: ["CHN", "JPN", "KOR", "SGP", "IND", "DEU", "ZAF"],
      semantic: "宪法法院 社会权利 环境 地方自治",
      color: "cluster",
      theme: "judicial-review-models",
    },
    hubLinks: [
      "zh-yuyi-sousuo-xianfa",
      "zh-environmental-rights",
      "zh-constitutional-terms-translation",
    ],
    sourceLinks: COMMON_SOURCES_ZH,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "zh-yuyi-sousuo-xianfa",
    locale: "zh",
    translationGroup: "semantic-search-constitutions",
    category: "semantic-search",
    slugPath: ["yuyi-sousuo-xianfa"],
    title: "宪法文本的语义搜索",
    description:
      "按含义查找人的尊严、正当程序、社会权利和国家义务，而不只依赖完全相同的词语。",
    eyebrow: "语义搜索",
    question:
      "当宪法文本没有使用同一个术语时，如何找到相近的规定？",
    shortAnswer:
      "语义搜索从问题的含义出发。它可以把处理同一宪法问题的条文聚集起来，即使这些条文来自不同语言、传统或翻译体系，并帮助安排下一步阅读。",
    context: [
      "精确搜索适合寻找固定词组。语义搜索更适合概念稳定但表述变化较大的主题。",
      "本页用中国、日本、韩国、新加坡、印度和南非作为小样本，便于先检查候选条文。",
    ],
    findings: [
      "尊严、程序保障和社会权利可能分布在权利章、国家目标或公共权力限制附近。",
      "语义搜索给出的是候选文本集合，不是自动法律结论。",
      "先限制国家集合，可以降低噪音并提高条文核对效率。",
    ],
    methodologyNote:
      "结果会受到翻译文本和分段方式影响。严肃引用时应回到权威版本或原文确认，并说明所使用的文本版本。",
    scholarlyAngle:
      "中文用户理解语义搜索的基础入口。",
    mapPreview: preview("zh-yuyi-sousuo-xianfa", "宪法语义搜索预览"),
    atlasLink: {
      countries: ["CHN", "JPN", "KOR", "SGP", "IND", "ZAF"],
      semantic: "人的尊严 正当程序 社会权利 国家义务",
      q: "dignity",
      color: "cluster",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_ZH,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 4,
  },
  {
    id: "zh-environmental-rights",
    locale: "zh",
    translationGroup: "right-to-a-healthy-environment",
    category: "theme",
    slugPath: ["themes", "environmental-rights"],
    title: "宪法中的环境权与国家义务",
    description:
      "比较各国宪法如何表述健康环境、环境保护、自然资源和面向未来世代的义务。",
    eyebrow: "宪法主题",
    question:
      "宪法文本如何规定健康环境权和环境保护义务？",
    shortAnswer:
      "许多宪法把环境保护写成权利、国家目标或公共义务。比较时最重要的不是单一词语，而是健康、自然、资源、发展和代际责任组成的语义邻域。",
    context: [
      "环境主题相对稳定，也能清楚展示语义搜索如何跨越不同表述。",
      "CTA 选取亚洲、拉美和欧洲案例，方便比较权利表述和国家义务的不同写法。",
    ],
    findings: [
      "有的宪法强调个人或集体权利，有的更强调国家和公民的保护义务。",
      "环境条款常与健康、资源、发展政策和公共行政相邻。",
      "地图定位的是文本承诺，并不衡量政策执行效果。",
    ],
    methodologyNote:
      "本页比较的是宪法文本。环境诉讼、政策成效和执行能力需要额外资料验证，不能由语义距离直接推出。",
    scholarlyAngle:
      "中文环境宪法比较主题页。",
    mapPreview: preview("zh-environmental-rights", "宪法环境权和国家义务语义地图"),
    atlasLink: {
      countries: ["CHN", "JPN", "KOR", "SGP", "IND", "BRA", "ECU"],
      semantic: "健康环境权 环境保护 国家义务",
      q: "environment",
      color: "cluster",
      theme: "right-to-a-healthy-environment",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_ZH,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
  },
  {
    id: "zh-constitutional-terms-translation",
    locale: "zh",
    translationGroup: "constitutional-terms-translation",
    category: "semantic-search",
    slugPath: ["topics", "constitutional-terms-translation"],
    title: "宪法术语翻译如何影响比较",
    description:
      "观察权利、义务、尊严、法治和宪法法院等术语在翻译文本中的语义位置。",
    eyebrow: "术语与翻译",
    question:
      "在跨语言比较中，宪法术语的翻译会怎样影响搜索和解读？",
    shortAnswer:
      "同一个中文术语可能对应多个外文表达，外文同义词也可能被翻成不同中文。语义地图可以帮助识别术语附近的权利、义务和制度语境，再回到原文核对。",
    context: [
      "这是专门面向中文读者的页面，因为跨语言阅读常常从翻译术语开始，但不能停留在词对词替换。",
      "页面使用东亚和其他法系样本，展示权利、义务、尊严、法治和宪法法院如何在语义空间中形成不同邻域。",
    ],
    findings: [
      "术语相同不一定表示制度功能相同，术语不同也不一定表示主题无关。",
      "语义搜索能显示一个概念周围的条文环境，例如权利保障、国家义务或法院权限。",
      "翻译问题应通过回看完整条文和必要时查阅原文来处理。",
    ],
    methodologyNote:
      "Atlas 使用可用文本和翻译来构建语义空间。术语比较是研究线索，不是权威翻译表。",
    scholarlyAngle:
      "面向中文读者的宪法术语和翻译方法页。",
    mapPreview: preview("zh-constitutional-terms-translation", "宪法术语翻译与语义邻域"),
    atlasLink: {
      countries: ["CHN", "JPN", "KOR", "SGP", "IND", "DEU", "ZAF"],
      semantic: "权利 义务 尊严 法治 宪法法院",
      q: "rights duties",
      color: "cluster",
      theme: "translation-methodology",
    },
    hubLinks: [],
    sourceLinks: COMMON_SOURCES_ZH,
    publishedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    updatedAt: LOCALIZED_EXPANSION_PUBLISHED_AT,
    readingMinutes: 5,
    audienceSpecific: true,
  },
];

export function listDiscoveryPages(locale?: AppLocale): DiscoveryPageEntry[] {
  const entries = locale
    ? DISCOVERY_PAGES.filter((entry) => entry.locale === locale)
    : DISCOVERY_PAGES;
  return [...entries].sort((left, right) => {
    const localeOrder = left.locale.localeCompare(right.locale);
    if (localeOrder !== 0) {
      return localeOrder;
    }
    return buildDiscoveryPath(left).localeCompare(buildDiscoveryPath(right));
  });
}

export function getDiscoveryPage(
  locale: AppLocale,
  slugPath: string[],
): DiscoveryPageEntry | null {
  const normalizedPath = slugPath.join("/");
  return (
    DISCOVERY_PAGES.find(
      (entry) =>
        entry.locale === locale && entry.slugPath.join("/") === normalizedPath,
    ) ?? null
  );
}

export function getDiscoveryPageById(id: string): DiscoveryPageEntry | null {
  return DISCOVERY_PAGES.find((entry) => entry.id === id) ?? null;
}

export function getDiscoveryUi(locale: AppLocale): DiscoveryUiCopy {
  return DISCOVERY_UI[locale];
}

export function buildDiscoveryPath(entry: DiscoveryPageEntry): string {
  return `/${entry.locale}/${entry.slugPath.join("/")}`;
}

export function buildDiscoveryUrl(entry: DiscoveryPageEntry): string {
  return `${BASE_URL}${buildDiscoveryPath(entry)}`;
}

export function buildDiscoveryAtlasHref(entry: DiscoveryPageEntry): string {
  const query = buildAtlasQueryString(entry.atlasLink);
  return query ? `/${entry.locale}?${query}` : `/${entry.locale}`;
}

export function listDiscoveryStaticParams() {
  return DISCOVERY_PAGES.map((entry) => ({
    locale: entry.locale,
    slug: entry.slugPath,
  }));
}

export function getDiscoveryAlternates(entry: DiscoveryPageEntry) {
  const translatedEntries = DISCOVERY_PAGES.filter(
    (candidate) => candidate.translationGroup === entry.translationGroup,
  );
  const languages = Object.fromEntries(
    translatedEntries.map((candidate) => [
      candidate.locale,
      buildDiscoveryPath(candidate),
    ]),
  ) as Partial<Record<AppLocale, string>>;
  const englishEntry = translatedEntries.find((candidate) => candidate.locale === "en");

  return {
    languages: englishEntry
      ? {...languages, "x-default": buildDiscoveryPath(englishEntry)}
      : languages,
    absoluteLanguages: Object.fromEntries(
      Object.entries(
        englishEntry
          ? {...languages, "x-default": buildDiscoveryPath(englishEntry)}
          : languages,
      ).map(([locale, path]) => [locale, `${BASE_URL}${path}`]),
    ),
  };
}

export function getDiscoveryChildPages(
  entry: DiscoveryPageEntry,
): DiscoveryPageEntry[] {
  return entry.hubLinks
    .map((id) => getDiscoveryPageById(id))
    .filter((page): page is DiscoveryPageEntry => Boolean(page));
}

function preview(id: string, alt: string): DiscoveryPreview {
  return {
    src: `/discovery/${id}.png`,
    alt,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
  };
}
