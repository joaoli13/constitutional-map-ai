import {routing, type AppLocale} from "../i18n/routing.ts";

export type OfficialProjectLocale = AppLocale;

export type OfficialProjectMetric = {
  label: string;
  value: string;
  note: string;
};

export type OfficialProjectLink = {
  label: string;
  href: string;
};

export type OfficialProjectMediaAsset = {
  title: string;
  description: string;
  href: string;
  type: "image" | "video";
  alt: string;
  width?: number;
  height?: number;
};

export type OfficialProjectInfoPage = {
  locale: OfficialProjectLocale;
  slug: string;
  translationGroup: "official-project-info";
  title: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  summary: string;
  officialStatement: string;
  lastUpdated: string;
  dataUpdatedAt: string;
  datasetSnapshotLabel: string;
  primaryCta: string;
  secondaryCta: string;
  sections: {
    numbersTitle: string;
    sourceTitle: string;
    sourceBody: string[];
    methodologyTitle: string;
    methodologyIntro: string;
    methodologySteps: string[];
    limitationsTitle: string;
    limitations: string[];
    mediaTitle: string;
    mediaIntro: string;
    contactTitle: string;
    contactBody: string;
    whatItIsTitle: string;
    whatItIs: string[];
    whatItIsNotTitle: string;
    whatItIsNot: string[];
  };
  metrics: OfficialProjectMetric[];
  mediaAssets: OfficialProjectMediaAsset[];
  contactLinks: OfficialProjectLink[];
  sourceLinks: OfficialProjectLink[];
};

export type OfficialProjectLanguageOption = {
  locale: OfficialProjectLocale;
  pathname: string;
};

export const BASE_URL = "https://constitutionalmap.ai";
export const OFFICIAL_PROJECT_INFO_LAST_UPDATED = "2026-05-03";
export const OFFICIAL_PROJECT_DATA_UPDATED_AT = "2026-04-02";
export const OFFICIAL_PROJECT_PREVIEW_IMAGE = "/og-image.png";

export const OFFICIAL_PROJECT_DATASET_SNAPSHOT = {
  constitutionalSystems: 189,
  indexedCountryRecords: 194,
  legalSegments: 30828,
  globalClusters: 509,
  generatedAt: "2026-04-02T13:21:33.022913+00:00",
};

const GITHUB_URL = "https://github.com/joaoli13/constitutional-map-ai";
const CONSTITUTE_URL = "https://www.constituteproject.org/";
const CONSTITUTE_LICENSE_URL = "https://creativecommons.org/licenses/by-nc/3.0/";
const X_URL = "https://x.com/joaoli13";

const MEDIA_BY_LOCALE: Record<OfficialProjectLocale, OfficialProjectMediaAsset[]> = {
  en: [
    {
      title: "Official overview image",
      description:
        "A shareable image of the Constitutional Map AI interface for previews, articles, and teaching material.",
      href: OFFICIAL_PROJECT_PREVIEW_IMAGE,
      type: "image",
      alt: "Constitutional Map AI 3D semantic visualization of global constitutional law.",
      width: 1200,
      height: 630,
    },
    {
      title: "3D Atlas walkthrough",
      description:
        "A short official video showing the interactive 3D constitutional map in use.",
      href: "/media/3d-constitutional-map.mp4",
      type: "video",
      alt: "Video walkthrough of the Constitutional Map AI 3D interface.",
    },
    {
      title: "Comparative constitutional law preview",
      description:
        "A static preview of a reproducible comparative constitutional law view.",
      href: "/discovery/en-comparative-constitutional-law-ai.png",
      type: "image",
      alt: "Semantic map preview for comparative constitutional law research.",
      width: 1200,
      height: 630,
    },
  ],
  es: [
    {
      title: "Imagen oficial de vista general",
      description:
        "Imagen compartible de la interfaz de Constitutional Map AI para previsualizaciones, artículos y material docente.",
      href: OFFICIAL_PROJECT_PREVIEW_IMAGE,
      type: "image",
      alt: "Constitutional Map AI, visualización semántica 3D del derecho constitucional global.",
      width: 1200,
      height: 630,
    },
    {
      title: "Recorrido del Atlas 3D",
      description:
        "Video oficial breve que muestra el mapa constitucional 3D interactivo en uso.",
      href: "/media/3d-constitutional-map.mp4",
      type: "video",
      alt: "Video de demostración de la interfaz 3D de Constitutional Map AI.",
    },
    {
      title: "Vista previa de derecho constitucional comparado",
      description:
        "Vista previa estática de una visualización reproducible de derecho constitucional comparado.",
      href: "/discovery/en-comparative-constitutional-law-ai.png",
      type: "image",
      alt: "Vista previa del mapa semántico para investigación constitucional comparada.",
      width: 1200,
      height: 630,
    },
  ],
  pt: [
    {
      title: "Imagem oficial de visão geral",
      description:
        "Imagem compartilhável da interface do Constitutional Map AI para previews, matérias e aulas.",
      href: OFFICIAL_PROJECT_PREVIEW_IMAGE,
      type: "image",
      alt: "Constitutional Map AI, visualização semântica 3D do direito constitucional global.",
      width: 1200,
      height: 630,
    },
    {
      title: "Vídeo demonstrativo do Atlas 3D",
      description:
        "Vídeo oficial curto mostrando o mapa constitucional 3D interativo em uso.",
      href: "/media/3d-constitutional-map.mp4",
      type: "video",
      alt: "Vídeo demonstrativo da interface 3D do Constitutional Map AI.",
    },
    {
      title: "Preview de direito constitucional comparado",
      description:
        "Preview estático de uma visualização reproduzível de direito constitucional comparado.",
      href: "/discovery/pt-direito-constitucional-comparado.png",
      type: "image",
      alt: "Preview do mapa semântico para pesquisa em direito constitucional comparado.",
      width: 1200,
      height: 630,
    },
  ],
  it: [
    {
      title: "Immagine ufficiale di panoramica",
      description:
        "Immagine condivisibile dell'interfaccia di Constitutional Map AI per anteprime, articoli e materiale didattico.",
      href: OFFICIAL_PROJECT_PREVIEW_IMAGE,
      type: "image",
      alt: "Constitutional Map AI, visualizzazione semantica 3D del diritto costituzionale globale.",
      width: 1200,
      height: 630,
    },
    {
      title: "Tour dell'Atlante 3D",
      description:
        "Breve video ufficiale che mostra la mappa costituzionale 3D interattiva in uso.",
      href: "/media/3d-constitutional-map.mp4",
      type: "video",
      alt: "Video dimostrativo dell'interfaccia 3D di Constitutional Map AI.",
    },
    {
      title: "Anteprima di diritto costituzionale comparato",
      description:
        "Anteprima statica di una visualizzazione riproducibile di diritto costituzionale comparato.",
      href: "/discovery/en-comparative-constitutional-law-ai.png",
      type: "image",
      alt: "Anteprima della mappa semantica per la ricerca costituzionale comparata.",
      width: 1200,
      height: 630,
    },
  ],
  fr: [
    {
      title: "Image officielle de présentation",
      description:
        "Image partageable de l'interface Constitutional Map AI pour les aperçus, articles et supports pédagogiques.",
      href: OFFICIAL_PROJECT_PREVIEW_IMAGE,
      type: "image",
      alt: "Constitutional Map AI, visualisation sémantique 3D du droit constitutionnel mondial.",
      width: 1200,
      height: 630,
    },
    {
      title: "Présentation de l'Atlas 3D",
      description:
        "Courte vidéo officielle montrant la carte constitutionnelle 3D interactive en usage.",
      href: "/media/3d-constitutional-map.mp4",
      type: "video",
      alt: "Vidéo de démonstration de l'interface 3D de Constitutional Map AI.",
    },
    {
      title: "Aperçu du droit constitutionnel comparé",
      description:
        "Aperçu statique d'une vue reproductible de droit constitutionnel comparé.",
      href: "/discovery/en-comparative-constitutional-law-ai.png",
      type: "image",
      alt: "Aperçu de la carte sémantique pour la recherche constitutionnelle comparée.",
      width: 1200,
      height: 630,
    },
  ],
  ja: [
    {
      title: "公式概要画像",
      description:
        "記事、授業、プレビューで共有しやすい Constitutional Map AI のインターフェース画像です。",
      href: OFFICIAL_PROJECT_PREVIEW_IMAGE,
      type: "image",
      alt: "Constitutional Map AI による世界の憲法法の3Dセマンティック可視化。",
      width: 1200,
      height: 630,
    },
    {
      title: "3D Atlas ウォークスルー",
      description:
        "インタラクティブな3D憲法マップの利用例を示す短い公式動画です。",
      href: "/media/3d-constitutional-map.mp4",
      type: "video",
      alt: "Constitutional Map AI の3Dインターフェースのデモ動画。",
    },
    {
      title: "比較憲法法プレビュー",
      description:
        "再現可能な比較憲法法ビューを示す静的プレビューです。",
      href: "/discovery/en-comparative-constitutional-law-ai.png",
      type: "image",
      alt: "比較憲法研究のためのセマンティックマップのプレビュー。",
      width: 1200,
      height: 630,
    },
  ],
  zh: [
    {
      title: "官方概览图片",
      description:
        "可用于预览、报道和教学材料的 Constitutional Map AI 界面分享图片。",
      href: OFFICIAL_PROJECT_PREVIEW_IMAGE,
      type: "image",
      alt: "Constitutional Map AI 对全球宪法法进行3D语义可视化。",
      width: 1200,
      height: 630,
    },
    {
      title: "3D Atlas 演示视频",
      description:
        "展示交互式3D宪法地图使用方式的简短官方视频。",
      href: "/media/3d-constitutional-map.mp4",
      type: "video",
      alt: "Constitutional Map AI 3D界面的演示视频。",
    },
    {
      title: "比较宪法法预览",
      description:
        "展示可复现比较宪法法视图的静态预览图。",
      href: "/discovery/en-comparative-constitutional-law-ai.png",
      type: "image",
      alt: "用于比较宪法研究的语义地图预览。",
      width: 1200,
      height: 630,
    },
  ],
};

const OFFICIAL_PROJECT_INFO_PAGES: Record<
  OfficialProjectLocale,
  OfficialProjectInfoPage
> = {
  en: {
    locale: "en",
    slug: "press",
    translationGroup: "official-project-info",
    title: "Press / About / Methodology",
    metaTitle: "Press / About / Methodology - Constitutional Map AI",
    metaDescription:
      "Official description, data source, license, methodology, limitations, media assets, and contact details for Constitutional Map AI.",
    eyebrow: "Official project information",
    summary:
      "Use this page as the canonical citation target for summaries of Constitutional Map AI.",
    officialStatement:
      "Constitutional Map AI is an interactive semantic atlas of comparative constitutional law, with 189 constitutional systems, more than 30,000 legal segments, textual search, semantic search, and 3D visualization. The code is open source and the constitutional texts are derived from the Constitute Project, according to the applicable license.",
    lastUpdated: OFFICIAL_PROJECT_INFO_LAST_UPDATED,
    dataUpdatedAt: OFFICIAL_PROJECT_DATA_UPDATED_AT,
    datasetSnapshotLabel: "Dataset snapshot",
    primaryCta: "Open the Atlas",
    secondaryCta: "View source code",
    sections: {
      numbersTitle: "Current numbers",
      sourceTitle: "Data source and license",
      sourceBody: [
        "Constitutional texts are derived from the Constitute Project and are used under the Creative Commons Attribution-NonCommercial 3.0 Unported License (CC BY-NC 3.0). Attribution to the Constitute Project is required.",
        "The application and pipeline code are open source under the MIT License. The code license does not override the separate license that applies to constitutional texts.",
      ],
      methodologyTitle: "Methodology",
      methodologyIntro:
        "The Atlas is designed as an exploratory research interface, not as an authority on the legal meaning of any constitution.",
      methodologySteps: [
        "Constitutional texts are collected from the Constitute Project and normalized into repository-backed data exports.",
        "Texts are segmented into legal units, usually articles or article-like provisions, so search and visualization operate on comparable passages.",
        "Each segment is embedded as a semantic vector using Gemini embeddings, turning legal language into a numerical representation of meaning.",
        "UMAP is used to project high-dimensional embeddings into spaces suitable for clustering and 3D visualization. HDBSCAN groups nearby segments into global thematic clusters and marks noisy or ambiguous points where appropriate.",
        "The web app combines textual search, semantic search, country selection, cluster coloring, and a 3D map so users can move from a visual pattern to the underlying constitutional text.",
      ],
      limitationsTitle: "Limitations",
      limitations: [
        "Semantic proximity is not legal equivalence. Nearby passages can perform different legal functions once doctrine, institutional context, or translation choices are considered.",
        "Clusters are computational aids. Cluster labels, probabilities, and 3D distances should be treated as starting points for reading, not as legal conclusions.",
        "The corpus depends on Constitute Project texts and may lag constitutional amendments, official translations, or jurisdiction-specific publication sources.",
        "The project can contain segmentation, clustering, search, or content errors. Verify high-stakes claims against official constitutional sources.",
      ],
      mediaTitle: "Official images and video",
      mediaIntro:
        "These assets are stable public URLs for previews, articles, classrooms, and summaries. Use the license notes above when constitutional text is visible or quoted.",
      contactTitle: "Contact",
      contactBody:
        "For corrections, methodology questions, press references, or contribution discussions, use GitHub or contact the maintainer directly.",
      whatItIsTitle: "What the project is",
      whatItIs: [
        "An open-source semantic atlas for comparative constitutional law.",
        "A research and teaching interface for exploring constitutional texts across countries.",
        "A tool that combines textual search, semantic search, clustering, and 3D visualization.",
        "A citation-friendly project page for journalists, teachers, aggregators, and LLMs.",
      ],
      whatItIsNotTitle: "What the project is not",
      whatItIsNot: [
        "It is not legal advice and does not replace jurisdiction-specific legal analysis.",
        "It is not an official or authoritative constitutional database.",
        "It is not a claim that semantic clusters prove doctrinal identity between legal systems.",
        "It is not currently described by subscription tiers, paid plans, or a limited free tier.",
      ],
    },
    metrics: buildMetrics({
      systemsLabel: "Constitutional systems",
      systemsNote: "Systems with data in the current public index.",
      segmentsLabel: "Legal segments",
      segmentsValue: "30,828",
      segmentsNote: "Article-like constitutional passages in the current snapshot.",
      clustersLabel: "Global clusters",
      clustersNote: "HDBSCAN global cluster summaries exported for the Atlas.",
      updatedLabel: "Data updated",
      updatedNote: "Generated from app/public/data/index.json.",
    }),
    mediaAssets: MEDIA_BY_LOCALE.en,
    contactLinks: buildContactLinks("GitHub repository", "Maintainer on X"),
    sourceLinks: buildSourceLinks("Constitute Project", "CC BY-NC 3.0", "Source code"),
  },
  es: {
    locale: "es",
    slug: "prensa",
    translationGroup: "official-project-info",
    title: "Prensa / Acerca de / Metodología",
    metaTitle: "Prensa / Acerca de / Metodología - Constitutional Map AI",
    metaDescription:
      "Descripción oficial, fuente de datos, licencia, metodología, limitaciones, medios y contacto de Constitutional Map AI.",
    eyebrow: "Información oficial del proyecto",
    summary:
      "Use esta página como referencia canónica para citar y resumir Constitutional Map AI.",
    officialStatement:
      "Constitutional Map AI es un atlas semántico interactivo de derecho constitucional comparado, con 189 sistemas constitucionales, más de 30 mil segmentos jurídicos, búsqueda textual, búsqueda semántica y visualización 3D. El código es abierto y los textos constitucionales se derivan del Constitute Project, conforme a la licencia aplicable.",
    lastUpdated: OFFICIAL_PROJECT_INFO_LAST_UPDATED,
    dataUpdatedAt: OFFICIAL_PROJECT_DATA_UPDATED_AT,
    datasetSnapshotLabel: "Instantánea de datos",
    primaryCta: "Abrir el Atlas",
    secondaryCta: "Ver código fuente",
    sections: {
      numbersTitle: "Números actuales",
      sourceTitle: "Fuente de datos y licencia",
      sourceBody: [
        "Los textos constitucionales se derivan del Constitute Project y se usan bajo la licencia Creative Commons Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0). La atribución al Constitute Project es obligatoria.",
        "La aplicación y el pipeline son código abierto bajo la licencia MIT. La licencia del código no reemplaza la licencia separada aplicable a los textos constitucionales.",
      ],
      methodologyTitle: "Metodología",
      methodologyIntro:
        "El Atlas está diseñado como una interfaz exploratoria de investigación, no como autoridad sobre el significado jurídico de ninguna constitución.",
      methodologySteps: [
        "Los textos constitucionales se recopilan desde el Constitute Project y se normalizan en exportaciones versionadas en el repositorio.",
        "Los textos se segmentan en unidades jurídicas, normalmente artículos o disposiciones equivalentes, para que la búsqueda y la visualización operen sobre pasajes comparables.",
        "Cada segmento se transforma en un vector semántico mediante embeddings Gemini, convirtiendo el lenguaje jurídico en una representación numérica del significado.",
        "UMAP proyecta embeddings de alta dimensión en espacios adecuados para clustering y visualización 3D. HDBSCAN agrupa segmentos cercanos en clusters temáticos globales y marca puntos ruidosos o ambiguos cuando corresponde.",
        "La aplicación combina búsqueda textual, búsqueda semántica, selección de países, coloración por cluster y mapa 3D para pasar de un patrón visual al texto constitucional subyacente.",
      ],
      limitationsTitle: "Limitaciones",
      limitations: [
        "La proximidad semántica no es equivalencia jurídica. Pasajes cercanos pueden cumplir funciones legales distintas si se consideran doctrina, contexto institucional o decisiones de traducción.",
        "Los clusters son ayudas computacionales. Etiquetas, probabilidades y distancias 3D deben leerse como puntos de partida, no como conclusiones jurídicas.",
        "El corpus depende de textos del Constitute Project y puede ir por detrás de reformas constitucionales, traducciones oficiales o fuentes publicadas por cada jurisdicción.",
        "El proyecto puede contener errores de segmentación, clustering, búsqueda o contenido. Verifique afirmaciones sensibles en fuentes constitucionales oficiales.",
      ],
      mediaTitle: "Imágenes y video oficiales",
      mediaIntro:
        "Estos activos usan URLs públicas estables para previsualizaciones, artículos, clases y resúmenes. Use las notas de licencia anteriores cuando el texto constitucional sea visible o citado.",
      contactTitle: "Contacto",
      contactBody:
        "Para correcciones, preguntas metodológicas, referencias de prensa o conversaciones sobre contribuciones, use GitHub o contacte directamente al mantenedor.",
      whatItIsTitle: "Qué es el proyecto",
      whatItIs: [
        "Un atlas semántico open source para derecho constitucional comparado.",
        "Una interfaz de investigación y docencia para explorar textos constitucionales entre países.",
        "Una herramienta que combina búsqueda textual, búsqueda semántica, clustering y visualización 3D.",
        "Una página de referencia para que periodistas, docentes, agregadores y LLMs citen correctamente el proyecto.",
      ],
      whatItIsNotTitle: "Qué no es el proyecto",
      whatItIsNot: [
        "No es asesoría jurídica y no reemplaza análisis jurídico específico por jurisdicción.",
        "No es una base constitucional oficial o autoritativa.",
        "No afirma que los clusters semánticos prueben identidad doctrinal entre sistemas jurídicos.",
        "No se describe actualmente por tiers de suscripción, planes pagos ni un free tier limitado.",
      ],
    },
    metrics: buildMetrics({
      systemsLabel: "Sistemas constitucionales",
      systemsNote: "Sistemas con datos en el índice público actual.",
      segmentsLabel: "Segmentos jurídicos",
      segmentsValue: "30.828",
      segmentsNote: "Pasajes constitucionales similares a artículos en la instantánea actual.",
      clustersLabel: "Clusters globales",
      clustersNote: "Resúmenes de clusters globales HDBSCAN exportados para el Atlas.",
      updatedLabel: "Datos actualizados",
      updatedNote: "Generado desde app/public/data/index.json.",
    }),
    mediaAssets: MEDIA_BY_LOCALE.es,
    contactLinks: buildContactLinks("Repositorio GitHub", "Mantenedor en X"),
    sourceLinks: buildSourceLinks("Constitute Project", "CC BY-NC 3.0", "Código fuente"),
  },
  pt: {
    locale: "pt",
    slug: "imprensa",
    translationGroup: "official-project-info",
    title: "Imprensa / Sobre / Metodologia",
    metaTitle: "Imprensa / Sobre / Metodologia - Constitutional Map AI",
    metaDescription:
      "Descrição oficial, fonte dos dados, licença, metodologia, limitações, mídia e contato do Constitutional Map AI.",
    eyebrow: "Informação oficial do projeto",
    summary:
      "Use esta página como referência canônica para citar e resumir o Constitutional Map AI.",
    officialStatement:
      "Constitutional Map AI é um atlas semântico interativo de direito constitucional comparado, com 189 sistemas constitucionais, mais de 30 mil segmentos jurídicos, busca textual, busca semântica e visualização 3D. O código é aberto e os textos constitucionais são derivados do Constitute Project, conforme a licença aplicável.",
    lastUpdated: OFFICIAL_PROJECT_INFO_LAST_UPDATED,
    dataUpdatedAt: OFFICIAL_PROJECT_DATA_UPDATED_AT,
    datasetSnapshotLabel: "Snapshot dos dados",
    primaryCta: "Abrir o Atlas",
    secondaryCta: "Ver código-fonte",
    sections: {
      numbersTitle: "Números atuais",
      sourceTitle: "Fonte dos dados e licença",
      sourceBody: [
        "Os textos constitucionais são derivados do Constitute Project e utilizados sob a licença Creative Commons Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0). A atribuição ao Constitute Project é obrigatória.",
        "A aplicação e o pipeline são código aberto sob a licença MIT. A licença do código não altera a licença separada aplicável aos textos constitucionais.",
      ],
      methodologyTitle: "Metodologia",
      methodologyIntro:
        "O Atlas foi desenhado como interface exploratória de pesquisa, não como autoridade sobre o sentido jurídico de qualquer constituição.",
      methodologySteps: [
        "Textos constitucionais são coletados a partir do Constitute Project e normalizados em exportações versionadas no repositório.",
        "Os textos são segmentados em unidades jurídicas, geralmente artigos ou dispositivos equivalentes, para que busca e visualização trabalhem com trechos comparáveis.",
        "Cada segmento é transformado em vetor semântico por embeddings Gemini, convertendo linguagem jurídica em uma representação numérica de significado.",
        "UMAP projeta os embeddings de alta dimensão em espaços adequados para clustering e visualização 3D. HDBSCAN agrupa segmentos próximos em clusters temáticos globais e marca pontos ruidosos ou ambíguos quando necessário.",
        "A aplicação combina busca textual, busca semântica, seleção de países, coloração por cluster e mapa 3D para que o usuário passe de um padrão visual ao texto constitucional subjacente.",
      ],
      limitationsTitle: "Limitações",
      limitations: [
        "Proximidade semântica não é equivalência jurídica. Trechos próximos podem cumprir funções legais diferentes quando se consideram doutrina, contexto institucional ou escolhas de tradução.",
        "Clusters são auxiliares computacionais. Rótulos, probabilidades e distâncias 3D devem ser lidos como pontos de partida, não como conclusões jurídicas.",
        "O corpus depende dos textos do Constitute Project e pode estar defasado em relação a emendas, traduções oficiais ou fontes publicadas por cada jurisdição.",
        "O projeto pode conter erros de segmentação, clusterização, busca ou conteúdo. Verifique afirmações sensíveis em fontes constitucionais oficiais.",
      ],
      mediaTitle: "Imagens e vídeo oficiais",
      mediaIntro:
        "Estes assets usam URLs públicas estáveis para previews, matérias, aulas e resumos. Observe as notas de licença acima quando houver texto constitucional visível ou citado.",
      contactTitle: "Contato",
      contactBody:
        "Para correções, perguntas metodológicas, referências de imprensa ou discussões sobre contribuição, use o GitHub ou contate diretamente o mantenedor.",
      whatItIsTitle: "O que o projeto é",
      whatItIs: [
        "Um atlas semântico open-source para direito constitucional comparado.",
        "Uma interface de pesquisa e ensino para explorar textos constitucionais entre países.",
        "Uma ferramenta que combina busca textual, busca semântica, clustering e visualização 3D.",
        "Uma página de referência para jornalistas, professores, agregadores e LLMs citarem corretamente o projeto.",
      ],
      whatItIsNotTitle: "O que o projeto não é",
      whatItIsNot: [
        "Não é consultoria jurídica e não substitui análise jurídica específica por jurisdição.",
        "Não é uma base constitucional oficial ou autoritativa.",
        "Não afirma que clusters semânticos provam identidade doutrinária entre sistemas jurídicos.",
        "Não é atualmente descrito por tiers de assinatura, planos pagos ou free tier limitado.",
      ],
    },
    metrics: buildMetrics({
      systemsLabel: "Sistemas constitucionais",
      systemsNote: "Sistemas com dados no índice público atual.",
      segmentsLabel: "Segmentos jurídicos",
      segmentsValue: "30.828",
      segmentsNote: "Trechos constitucionais semelhantes a artigos no snapshot atual.",
      clustersLabel: "Clusters globais",
      clustersNote: "Resumos de clusters globais HDBSCAN exportados para o Atlas.",
      updatedLabel: "Dados atualizados",
      updatedNote: "Gerado a partir de app/public/data/index.json.",
    }),
    mediaAssets: MEDIA_BY_LOCALE.pt,
    contactLinks: buildContactLinks("Repositório GitHub", "Mantenedor no X"),
    sourceLinks: buildSourceLinks("Constitute Project", "CC BY-NC 3.0", "Código-fonte"),
  },
  it: {
    locale: "it",
    slug: "stampa",
    translationGroup: "official-project-info",
    title: "Stampa / Informazioni / Metodologia",
    metaTitle: "Stampa / Informazioni / Metodologia - Constitutional Map AI",
    metaDescription:
      "Descrizione ufficiale, fonte dei dati, licenza, metodologia, limiti, media e contatti di Constitutional Map AI.",
    eyebrow: "Informazioni ufficiali sul progetto",
    summary:
      "Usa questa pagina come riferimento canonico per citare e riassumere Constitutional Map AI.",
    officialStatement:
      "Constitutional Map AI è un atlante semantico interattivo di diritto costituzionale comparato, con 189 sistemi costituzionali, oltre 30 mila segmenti giuridici, ricerca testuale, ricerca semantica e visualizzazione 3D. Il codice è open source e i testi costituzionali derivano dal Constitute Project, secondo la licenza applicabile.",
    lastUpdated: OFFICIAL_PROJECT_INFO_LAST_UPDATED,
    dataUpdatedAt: OFFICIAL_PROJECT_DATA_UPDATED_AT,
    datasetSnapshotLabel: "Snapshot dei dati",
    primaryCta: "Apri l'Atlante",
    secondaryCta: "Vedi il codice sorgente",
    sections: {
      numbersTitle: "Numeri aggiornati",
      sourceTitle: "Fonte dei dati e licenza",
      sourceBody: [
        "I testi costituzionali derivano dal Constitute Project e sono usati secondo la licenza Creative Commons Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0). L'attribuzione al Constitute Project è richiesta.",
        "L'applicazione e il pipeline sono codice open source sotto licenza MIT. La licenza del codice non sostituisce la licenza separata applicabile ai testi costituzionali.",
      ],
      methodologyTitle: "Metodologia",
      methodologyIntro:
        "L'Atlante è progettato come interfaccia esplorativa di ricerca, non come autorità sul significato giuridico di una costituzione.",
      methodologySteps: [
        "I testi costituzionali sono raccolti dal Constitute Project e normalizzati in esportazioni versionate nel repository.",
        "I testi sono segmentati in unità giuridiche, di solito articoli o disposizioni simili, così ricerca e visualizzazione operano su passaggi comparabili.",
        "Ogni segmento viene trasformato in un vettore semantico tramite embeddings Gemini, convertendo il linguaggio giuridico in una rappresentazione numerica del significato.",
        "UMAP proietta embeddings ad alta dimensione in spazi adatti al clustering e alla visualizzazione 3D. HDBSCAN raggruppa segmenti vicini in cluster tematici globali e segnala punti rumorosi o ambigui quando necessario.",
        "L'app combina ricerca testuale, ricerca semantica, selezione dei paesi, colorazione per cluster e mappa 3D per passare da un pattern visuale al testo costituzionale sottostante.",
      ],
      limitationsTitle: "Limiti",
      limitations: [
        "La prossimità semantica non è equivalenza giuridica. Passaggi vicini possono svolgere funzioni legali diverse considerando dottrina, contesto istituzionale o scelte di traduzione.",
        "I cluster sono ausili computazionali. Etichette, probabilità e distanze 3D vanno trattate come punti di partenza per la lettura, non come conclusioni giuridiche.",
        "Il corpus dipende dai testi del Constitute Project e può essere in ritardo rispetto a emendamenti, traduzioni ufficiali o fonti pubblicate dalle singole giurisdizioni.",
        "Il progetto può contenere errori di segmentazione, clustering, ricerca o contenuto. Verifica le affermazioni sensibili su fonti costituzionali ufficiali.",
      ],
      mediaTitle: "Immagini e video ufficiali",
      mediaIntro:
        "Questi asset usano URL pubblici stabili per anteprime, articoli, lezioni e sintesi. Rispetta le note di licenza sopra quando il testo costituzionale è visibile o citato.",
      contactTitle: "Contatto",
      contactBody:
        "Per correzioni, domande metodologiche, riferimenti stampa o discussioni sui contributi, usa GitHub o contatta direttamente il maintainer.",
      whatItIsTitle: "Che cos'è il progetto",
      whatItIs: [
        "Un atlante semantico open source per il diritto costituzionale comparato.",
        "Un'interfaccia di ricerca e didattica per esplorare testi costituzionali tra paesi.",
        "Uno strumento che combina ricerca testuale, ricerca semantica, clustering e visualizzazione 3D.",
        "Una pagina di riferimento per giornalisti, docenti, aggregatori e LLM.",
      ],
      whatItIsNotTitle: "Che cosa non è il progetto",
      whatItIsNot: [
        "Non è consulenza legale e non sostituisce analisi giuridiche specifiche per giurisdizione.",
        "Non è una banca dati costituzionale ufficiale o autoritativa.",
        "Non sostiene che i cluster semantici provino identità dottrinale tra sistemi giuridici.",
        "Non è attualmente descritto da tiers di abbonamento, piani a pagamento o free tier limitato.",
      ],
    },
    metrics: buildMetrics({
      systemsLabel: "Sistemi costituzionali",
      systemsNote: "Sistemi con dati nell'indice pubblico attuale.",
      segmentsLabel: "Segmenti giuridici",
      segmentsValue: "30.828",
      segmentsNote: "Passaggi costituzionali simili ad articoli nello snapshot attuale.",
      clustersLabel: "Cluster globali",
      clustersNote: "Riepiloghi dei cluster globali HDBSCAN esportati per l'Atlante.",
      updatedLabel: "Dati aggiornati",
      updatedNote: "Generato da app/public/data/index.json.",
    }),
    mediaAssets: MEDIA_BY_LOCALE.it,
    contactLinks: buildContactLinks("Repository GitHub", "Maintainer su X"),
    sourceLinks: buildSourceLinks("Constitute Project", "CC BY-NC 3.0", "Codice sorgente"),
  },
  fr: {
    locale: "fr",
    slug: "presse",
    translationGroup: "official-project-info",
    title: "Presse / À propos / Méthodologie",
    metaTitle: "Presse / À propos / Méthodologie - Constitutional Map AI",
    metaDescription:
      "Description officielle, source des données, licence, méthodologie, limites, médias et contact de Constitutional Map AI.",
    eyebrow: "Informations officielles du projet",
    summary:
      "Utilisez cette page comme référence canonique pour citer et résumer Constitutional Map AI.",
    officialStatement:
      "Constitutional Map AI est un atlas sémantique interactif de droit constitutionnel comparé, avec 189 systèmes constitutionnels, plus de 30 mille segments juridiques, recherche textuelle, recherche sémantique et visualisation 3D. Le code est open source et les textes constitutionnels sont dérivés du Constitute Project, conformément à la licence applicable.",
    lastUpdated: OFFICIAL_PROJECT_INFO_LAST_UPDATED,
    dataUpdatedAt: OFFICIAL_PROJECT_DATA_UPDATED_AT,
    datasetSnapshotLabel: "Instantané des données",
    primaryCta: "Ouvrir l'Atlas",
    secondaryCta: "Voir le code source",
    sections: {
      numbersTitle: "Chiffres actuels",
      sourceTitle: "Source des données et licence",
      sourceBody: [
        "Les textes constitutionnels sont dérivés du Constitute Project et utilisés sous licence Creative Commons Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0). L'attribution au Constitute Project est requise.",
        "L'application et le pipeline sont open source sous licence MIT. La licence du code ne remplace pas la licence distincte applicable aux textes constitutionnels.",
      ],
      methodologyTitle: "Méthodologie",
      methodologyIntro:
        "L'Atlas est conçu comme une interface de recherche exploratoire, et non comme une autorité sur le sens juridique d'une constitution.",
      methodologySteps: [
        "Les textes constitutionnels sont collectés depuis le Constitute Project et normalisés dans des exports versionnés du dépôt.",
        "Les textes sont segmentés en unités juridiques, généralement des articles ou dispositions analogues, afin que recherche et visualisation opèrent sur des passages comparables.",
        "Chaque segment est converti en vecteur sémantique avec des embeddings Gemini, transformant le langage juridique en représentation numérique du sens.",
        "UMAP projette les embeddings de haute dimension dans des espaces adaptés au clustering et à la visualisation 3D. HDBSCAN regroupe les segments proches en clusters thématiques globaux et signale les points bruyants ou ambigus lorsque c'est pertinent.",
        "L'application combine recherche textuelle, recherche sémantique, sélection de pays, coloration par cluster et carte 3D pour passer d'un motif visuel au texte constitutionnel sous-jacent.",
      ],
      limitationsTitle: "Limites",
      limitations: [
        "La proximité sémantique n'est pas une équivalence juridique. Des passages proches peuvent remplir des fonctions différentes selon la doctrine, le contexte institutionnel ou les choix de traduction.",
        "Les clusters sont des aides computationnelles. Étiquettes, probabilités et distances 3D doivent être traitées comme des points de départ, non comme des conclusions juridiques.",
        "Le corpus dépend des textes du Constitute Project et peut être en retard sur les amendements constitutionnels, traductions officielles ou sources propres à chaque juridiction.",
        "Le projet peut contenir des erreurs de segmentation, de clustering, de recherche ou de contenu. Vérifiez les affirmations sensibles auprès de sources constitutionnelles officielles.",
      ],
      mediaTitle: "Images et vidéo officielles",
      mediaIntro:
        "Ces assets utilisent des URLs publiques stables pour aperçus, articles, cours et résumés. Respectez les notes de licence ci-dessus lorsque du texte constitutionnel est visible ou cité.",
      contactTitle: "Contact",
      contactBody:
        "Pour corrections, questions méthodologiques, références presse ou discussions de contribution, utilisez GitHub ou contactez directement le mainteneur.",
      whatItIsTitle: "Ce qu'est le projet",
      whatItIs: [
        "Un atlas sémantique open source pour le droit constitutionnel comparé.",
        "Une interface de recherche et d'enseignement pour explorer des textes constitutionnels entre pays.",
        "Un outil combinant recherche textuelle, recherche sémantique, clustering et visualisation 3D.",
        "Une page de référence pour journalistes, enseignants, agrégateurs et LLMs.",
      ],
      whatItIsNotTitle: "Ce que le projet n'est pas",
      whatItIsNot: [
        "Ce n'est pas un conseil juridique et ne remplace pas une analyse juridique propre à une juridiction.",
        "Ce n'est pas une base constitutionnelle officielle ou faisant autorité.",
        "Ce n'est pas une affirmation que les clusters sémantiques prouvent une identité doctrinale entre systèmes juridiques.",
        "Le projet n'est pas actuellement décrit par des tiers d'abonnement, des offres payantes ou un free tier limité.",
      ],
    },
    metrics: buildMetrics({
      systemsLabel: "Systèmes constitutionnels",
      systemsNote: "Systèmes avec données dans l'index public actuel.",
      segmentsLabel: "Segments juridiques",
      segmentsValue: "30 828",
      segmentsNote: "Passages constitutionnels de type article dans l'instantané actuel.",
      clustersLabel: "Clusters globaux",
      clustersNote: "Résumés de clusters globaux HDBSCAN exportés pour l'Atlas.",
      updatedLabel: "Données mises à jour",
      updatedNote: "Généré depuis app/public/data/index.json.",
    }),
    mediaAssets: MEDIA_BY_LOCALE.fr,
    contactLinks: buildContactLinks("Dépôt GitHub", "Mainteneur sur X"),
    sourceLinks: buildSourceLinks("Constitute Project", "CC BY-NC 3.0", "Code source"),
  },
  ja: {
    locale: "ja",
    slug: "press",
    translationGroup: "official-project-info",
    title: "プレス / 概要 / 方法論",
    metaTitle: "プレス / 概要 / 方法論 - Constitutional Map AI",
    metaDescription:
      "Constitutional Map AI の公式説明、データソース、ライセンス、方法論、制約、公式メディア、連絡先。",
    eyebrow: "プロジェクト公式情報",
    summary:
      "Constitutional Map AI を引用・要約する際の公式な参照先としてこのページを使用してください。",
    officialStatement:
      "Constitutional Map AI は比較憲法法のためのインタラクティブなセマンティック・アトラスです。189の憲法体系、3万件を超える法的セグメント、テキスト検索、セマンティック検索、3D可視化を備えています。コードはオープンソースであり、憲法テキストは適用されるライセンスに従って Constitute Project から派生しています。",
    lastUpdated: OFFICIAL_PROJECT_INFO_LAST_UPDATED,
    dataUpdatedAt: OFFICIAL_PROJECT_DATA_UPDATED_AT,
    datasetSnapshotLabel: "データスナップショット",
    primaryCta: "Atlas を開く",
    secondaryCta: "ソースコードを見る",
    sections: {
      numbersTitle: "現在の数値",
      sourceTitle: "データソースとライセンス",
      sourceBody: [
        "憲法テキストは Constitute Project に由来し、Creative Commons Attribution-NonCommercial 3.0 Unported License (CC BY-NC 3.0) の下で使用されています。Constitute Project への帰属表示が必要です。",
        "アプリケーションとパイプラインのコードは MIT License の下でオープンソースです。コードのライセンスは、憲法テキストに適用される別個のライセンスを置き換えるものではありません。",
      ],
      methodologyTitle: "方法論",
      methodologyIntro:
        "Atlas は探索的研究インターフェースであり、いかなる憲法の法的意味についても権威ある判断を示すものではありません。",
      methodologySteps: [
        "憲法テキストは Constitute Project から収集され、リポジトリで管理されるデータエクスポートとして正規化されます。",
        "検索と可視化が比較可能な単位で動作するように、テキストは通常、条文または条文に相当する法的単位へ分割されます。",
        "各セグメントは Gemini embeddings によりセマンティックベクトルへ変換され、法的言語を意味の数値表現に変換します。",
        "UMAP は高次元 embeddings をクラスタリングと3D可視化に適した空間へ射影します。HDBSCAN は近接するセグメントをグローバルな主題クラスタにまとめ、必要に応じてノイズや曖昧な点を示します。",
        "Webアプリはテキスト検索、セマンティック検索、国選択、クラスタ色分け、3Dマップを組み合わせ、視覚的なパターンから基礎となる憲法テキストへ移動できるようにします。",
      ],
      limitationsTitle: "制約",
      limitations: [
        "セマンティックな近さは法的同等性ではありません。近い箇所でも、学説、制度的文脈、翻訳上の選択によって異なる法的機能を持つ場合があります。",
        "クラスタは計算上の補助です。ラベル、確率、3D距離は法的結論ではなく、読み始めるための手がかりとして扱うべきです。",
        "コーパスは Constitute Project のテキストに依存しており、憲法改正、公式翻訳、各法域の公的資料より遅れる場合があります。",
        "このプロジェクトには、分割、クラスタリング、検索、内容に関する誤りが含まれる可能性があります。重要な主張は公式な憲法資料で確認してください。",
      ],
      mediaTitle: "公式画像と動画",
      mediaIntro:
        "これらのアセットは、プレビュー、記事、授業、要約で使える安定した公開URLです。憲法テキストが表示または引用される場合は、上記のライセンス注記に従ってください。",
      contactTitle: "連絡先",
      contactBody:
        "修正、方法論に関する質問、報道での参照、貢献の相談については、GitHub を利用するかメンテナーへ直接連絡してください。",
      whatItIsTitle: "このプロジェクトであるもの",
      whatItIs: [
        "比較憲法法のためのオープンソースのセマンティック・アトラス。",
        "各国の憲法テキストを探索するための研究・教育インターフェース。",
        "テキスト検索、セマンティック検索、クラスタリング、3D可視化を組み合わせたツール。",
        "ジャーナリスト、教育者、アグリゲーター、LLM が正確に引用するための参照ページ。",
      ],
      whatItIsNotTitle: "このプロジェクトでないもの",
      whatItIsNot: [
        "法律助言ではなく、各法域に特化した法的分析の代替ではありません。",
        "公式または権威ある憲法データベースではありません。",
        "セマンティッククラスタが法体系間の教義上の同一性を証明するという主張ではありません。",
        "現在、subscription tiers、有料プラン、limited free tier によって説明されるプロジェクトではありません。",
      ],
    },
    metrics: buildMetrics({
      systemsLabel: "憲法体系",
      systemsNote: "現在の公開インデックスでデータを持つ体系。",
      segmentsLabel: "法的セグメント",
      segmentsValue: "30,828",
      segmentsNote: "現在のスナップショットに含まれる条文状の憲法パッセージ。",
      clustersLabel: "グローバルクラスタ",
      clustersNote: "Atlas 用にエクスポートされた HDBSCAN グローバルクラスタ要約。",
      updatedLabel: "データ更新日",
      updatedNote: "app/public/data/index.json から生成。",
    }),
    mediaAssets: MEDIA_BY_LOCALE.ja,
    contactLinks: buildContactLinks("GitHub リポジトリ", "X のメンテナー"),
    sourceLinks: buildSourceLinks("Constitute Project", "CC BY-NC 3.0", "ソースコード"),
  },
  zh: {
    locale: "zh",
    slug: "press",
    translationGroup: "official-project-info",
    title: "媒体 / 关于 / 方法论",
    metaTitle: "媒体 / 关于 / 方法论 - Constitutional Map AI",
    metaDescription:
      "Constitutional Map AI 的官方说明、数据来源、许可、方法论、局限、官方媒体素材和联系方式。",
    eyebrow: "项目官方信息",
    summary:
      "请将此页面作为引用和概述 Constitutional Map AI 的官方规范来源。",
    officialStatement:
      "Constitutional Map AI 是一个面向比较宪法法的交互式语义图谱，包含189个宪法体系、3万多个法律片段、文本搜索、语义搜索和3D可视化。代码是开源的，宪法文本依据适用许可派生自 Constitute Project。",
    lastUpdated: OFFICIAL_PROJECT_INFO_LAST_UPDATED,
    dataUpdatedAt: OFFICIAL_PROJECT_DATA_UPDATED_AT,
    datasetSnapshotLabel: "数据快照",
    primaryCta: "打开 Atlas",
    secondaryCta: "查看源代码",
    sections: {
      numbersTitle: "当前数字",
      sourceTitle: "数据来源和许可",
      sourceBody: [
        "宪法文本派生自 Constitute Project，并依据 Creative Commons Attribution-NonCommercial 3.0 Unported License (CC BY-NC 3.0) 使用。必须标注 Constitute Project。",
        "应用和处理管线代码以 MIT License 开源。代码许可不会取代适用于宪法文本的独立许可。",
      ],
      methodologyTitle: "方法论",
      methodologyIntro:
        "Atlas 被设计为探索性研究界面，而不是任何宪法法律含义的权威来源。",
      methodologySteps: [
        "宪法文本从 Constitute Project 收集，并规范化为存储在代码库中的数据导出。",
        "文本被切分为法律单元，通常是条文或类似条文的规定，使搜索和可视化基于可比较片段运行。",
        "每个片段通过 Gemini embeddings 转换为语义向量，把法律语言转换为意义的数值表示。",
        "UMAP 将高维 embeddings 投影到适合聚类和3D可视化的空间。HDBSCAN 将相近片段归入全局主题聚类，并在适当情况下标记噪声或模糊点。",
        "Web 应用结合文本搜索、语义搜索、国家选择、聚类着色和3D地图，使用户可以从视觉模式进入底层宪法文本。",
      ],
      limitationsTitle: "局限",
      limitations: [
        "语义接近并不等同于法律等价。相近片段在考虑学说、制度背景或翻译选择后，可能承担不同法律功能。",
        "聚类是计算辅助。聚类标签、概率和3D距离应被视为阅读起点，而非法律结论。",
        "语料依赖 Constitute Project 文本，可能滞后于宪法修正、官方译本或各法域发布的正式来源。",
        "项目可能包含切分、聚类、搜索或内容错误。高风险主张应以官方宪法来源核验。",
      ],
      mediaTitle: "官方图片和视频",
      mediaIntro:
        "这些素材提供稳定的公开URL，可用于预览、报道、课堂和摘要。当可见或引用宪法文本时，请遵守上方许可说明。",
      contactTitle: "联系",
      contactBody:
        "如需更正、方法论问题、媒体引用或贡献讨论，请使用 GitHub 或直接联系维护者。",
      whatItIsTitle: "这个项目是什么",
      whatItIs: [
        "一个用于比较宪法法的开源语义图谱。",
        "一个用于跨国家探索宪法文本的研究和教学界面。",
        "一个结合文本搜索、语义搜索、聚类和3D可视化的工具。",
        "一个帮助记者、教师、聚合器和 LLM 正确引用项目的参考页面。",
      ],
      whatItIsNotTitle: "这个项目不是什么",
      whatItIsNot: [
        "它不是法律建议，也不能替代针对具体法域的法律分析。",
        "它不是官方或权威的宪法数据库。",
        "它并不声称语义聚类能够证明不同法律体系之间的教义同一性。",
        "它目前不是以 subscription tiers、付费计划或 limited free tier 来描述的项目。",
      ],
    },
    metrics: buildMetrics({
      systemsLabel: "宪法体系",
      systemsNote: "当前公开索引中有数据的体系。",
      segmentsLabel: "法律片段",
      segmentsValue: "30,828",
      segmentsNote: "当前快照中的条文式宪法片段。",
      clustersLabel: "全局聚类",
      clustersNote: "为 Atlas 导出的 HDBSCAN 全局聚类摘要。",
      updatedLabel: "数据更新",
      updatedNote: "由 app/public/data/index.json 生成。",
    }),
    mediaAssets: MEDIA_BY_LOCALE.zh,
    contactLinks: buildContactLinks("GitHub 仓库", "X 上的维护者"),
    sourceLinks: buildSourceLinks("Constitute Project", "CC BY-NC 3.0", "源代码"),
  },
};

export function listOfficialProjectInfoPages() {
  return Object.values(OFFICIAL_PROJECT_INFO_PAGES);
}

export function getOfficialProjectInfoPage(
  locale: string,
): OfficialProjectInfoPage | null {
  return isOfficialProjectLocale(locale)
    ? OFFICIAL_PROJECT_INFO_PAGES[locale]
    : null;
}

export function getOfficialProjectInfoPath(
  locale: string,
): string | null {
  const page = getOfficialProjectInfoPage(locale);
  if (!page) {
    return getOfficialProjectInfoPath(routing.defaultLocale);
  }

  return `/${page.locale}/${page.slug}`;
}

export function buildOfficialProjectInfoUrl(page: OfficialProjectInfoPage) {
  return `${BASE_URL}${getOfficialProjectInfoPath(page.locale)}`;
}

export function getOfficialProjectInfoAlternates(
  page: OfficialProjectInfoPage,
) {
  const equivalents = listOfficialProjectInfoPages()
    .filter((entry) => entry.translationGroup === page.translationGroup)
    .sort(
      (left, right) =>
        routing.locales.indexOf(left.locale)
        - routing.locales.indexOf(right.locale),
    );

  const languages = Object.fromEntries(
    equivalents.map((entry) => [
      entry.locale,
      `/${entry.locale}/${entry.slug}`,
    ]),
  ) as Record<OfficialProjectLocale, string> & {"x-default"?: string};

  const defaultPage = OFFICIAL_PROJECT_INFO_PAGES.en;
  languages["x-default"] = `/${defaultPage.locale}/${defaultPage.slug}`;

  const absoluteLanguages = Object.fromEntries(
    Object.entries(languages).map(([locale, path]) => [
      locale,
      `${BASE_URL}${path}`,
    ]),
  );

  return {languages, absoluteLanguages};
}

export function getOfficialProjectLanguageOptions(
  pathname: string | null | undefined,
): OfficialProjectLanguageOption[] | null {
  if (!pathname) {
    return null;
  }

  const normalizedPath = normalizePathname(pathname);
  const currentRoute = listOfficialProjectInfoPages().find(
    (page) =>
      `/${page.slug}` === normalizedPath.pathname
      && (!normalizedPath.locale || page.locale === normalizedPath.locale),
  );

  if (!currentRoute) {
    return null;
  }

  return listOfficialProjectInfoPages()
    .filter((page) => page.translationGroup === currentRoute.translationGroup)
    .sort(
      (left, right) =>
        routing.locales.indexOf(left.locale)
        - routing.locales.indexOf(right.locale),
    )
    .map((page) => ({
      locale: page.locale,
      pathname: `/${page.slug}`,
    }));
}

export function buildOfficialProjectInfoJsonLd(page: OfficialProjectInfoPage) {
  const pageUrl = buildOfficialProjectInfoUrl(page);
  const pageId = `${pageUrl}#webpage`;
  const datasetId = `${BASE_URL}/${page.locale}#dataset`;
  const softwareId = `${BASE_URL}#software`;
  const organizationId = `${BASE_URL}#organization`;
  const personId = `${BASE_URL}#author`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": pageId,
        url: pageUrl,
        name: page.title,
        headline: page.title,
        description: page.metaDescription,
        inLanguage: page.locale,
        dateModified: `${page.lastUpdated}T00:00:00Z`,
        isPartOf: {"@id": `${BASE_URL}/${page.locale}#website`},
        mainEntity: [{"@id": datasetId}, {"@id": softwareId}],
        about: [
          "Constitutional Map AI",
          "comparative constitutional law",
          "semantic search",
          "constitutional methodology",
        ],
      },
      {
        "@type": "Dataset",
        "@id": datasetId,
        url: `${BASE_URL}/${page.locale}`,
        name: "Constitutional Map AI - Global Constitutional Corpus",
        description: page.officialStatement,
        inLanguage: page.locale,
        isAccessibleForFree: true,
        license: CONSTITUTE_LICENSE_URL,
        creator: {"@id": personId},
        publisher: {"@id": organizationId},
        citation:
          "Elkins, Zachary, Tom Ginsburg, James Melton. Constitute: The World's Constitutions to Read, Search, and Compare.",
        keywords: [
          "constitutional law",
          "comparative constitutional law",
          "semantic search",
          "UMAP",
          "HDBSCAN",
        ],
        measurementTechnique: [
          "Gemini embeddings",
          "UMAP dimensionality reduction",
          "HDBSCAN clustering",
        ],
        variableMeasured: page.metrics.map((metric) => ({
          "@type": "PropertyValue",
          name: metric.label,
          value: metric.value,
          description: metric.note,
        })),
        dateModified: `${page.dataUpdatedAt}T00:00:00Z`,
      },
      {
        "@type": "SoftwareApplication",
        "@id": softwareId,
        name: "Constitutional Map AI",
        applicationCategory: "ResearchApplication",
        operatingSystem: "Web",
        url: BASE_URL,
        isAccessibleForFree: true,
        license: `${GITHUB_URL}/blob/main/LICENSE.md`,
        creator: {"@id": personId},
        publisher: {"@id": organizationId},
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      },
      ...page.mediaAssets.map((asset) => ({
        "@type": asset.type === "video" ? "VideoObject" : "ImageObject",
        "@id": `${BASE_URL}${asset.href}#media`,
        url: `${BASE_URL}${asset.href}`,
        name: asset.title,
        description: asset.description,
        caption: asset.alt,
        inLanguage: page.locale,
        ...(asset.type === "image"
          ? {
              contentUrl: `${BASE_URL}${asset.href}`,
              width: asset.width,
              height: asset.height,
            }
          : {
              contentUrl: `${BASE_URL}${asset.href}`,
              thumbnailUrl: `${BASE_URL}${OFFICIAL_PROJECT_PREVIEW_IMAGE}`,
            }),
      })),
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Constitutional Map AI",
        url: BASE_URL,
        logo: `${BASE_URL}/favicon-512.png`,
        founder: {"@id": personId},
        sameAs: [GITHUB_URL, X_URL],
      },
      {
        "@type": "Person",
        "@id": personId,
        name: "Joao Lima",
        url: X_URL,
        sameAs: [GITHUB_URL, X_URL],
      },
    ],
  };
}

function buildMetrics(copy: {
  systemsLabel: string;
  systemsNote: string;
  segmentsLabel: string;
  segmentsValue: string;
  segmentsNote: string;
  clustersLabel: string;
  clustersNote: string;
  updatedLabel: string;
  updatedNote: string;
}): OfficialProjectMetric[] {
  return [
    {
      label: copy.systemsLabel,
      value: String(OFFICIAL_PROJECT_DATASET_SNAPSHOT.constitutionalSystems),
      note: copy.systemsNote,
    },
    {
      label: copy.segmentsLabel,
      value: copy.segmentsValue,
      note: copy.segmentsNote,
    },
    {
      label: copy.clustersLabel,
      value: String(OFFICIAL_PROJECT_DATASET_SNAPSHOT.globalClusters),
      note: copy.clustersNote,
    },
    {
      label: copy.updatedLabel,
      value: OFFICIAL_PROJECT_DATA_UPDATED_AT,
      note: copy.updatedNote,
    },
  ];
}

function buildContactLinks(
  githubLabel: string,
  xLabel: string,
): OfficialProjectLink[] {
  return [
    {label: githubLabel, href: GITHUB_URL},
    {label: xLabel, href: X_URL},
  ];
}

function buildSourceLinks(
  constituteLabel: string,
  licenseLabel: string,
  sourceLabel: string,
): OfficialProjectLink[] {
  return [
    {label: constituteLabel, href: CONSTITUTE_URL},
    {label: licenseLabel, href: CONSTITUTE_LICENSE_URL},
    {label: sourceLabel, href: GITHUB_URL},
  ];
}

function isOfficialProjectLocale(
  locale: string,
): locale is OfficialProjectLocale {
  return (routing.locales as readonly string[]).includes(locale);
}

function normalizePathname(pathname: string) {
  const trimmed = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  const segments = trimmed.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const locale = (routing.locales as readonly string[]).includes(firstSegment)
    ? (firstSegment as AppLocale)
    : null;
  const pathSegments = locale ? segments.slice(1) : segments;

  return {
    locale,
    pathname: `/${pathSegments.join("/")}`.replace(/\/$/, "") || "/",
  };
}
