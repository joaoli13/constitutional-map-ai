import type {AppLocale} from "@/i18n/routing";

export type BlogTutorialVideo = {
  title: string;
  url: string;
};

export type BlogTutorialSection = {
  title: string;
  paragraphs: string[];
  steps?: string[];
};

export type BlogTutorialEntry = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  readingMinutes: number;
  eyebrow: string;
  relatedVideos: BlogTutorialVideo[];
  sections: BlogTutorialSection[];
};

const PLAYLIST_URL =
  "https://www.youtube.com/playlist?list=PLJBMxTCVCi2NtUqcv9H2oU8QntVAa_nuh";
const MAP_VIDEO_URL = "https://www.youtube.com/watch?v=-Dtp-8Hmspg";

const BLOG_TUTORIALS_BY_LOCALE: Record<AppLocale, BlogTutorialEntry[]> = {
  en: [
    {
      slug: "getting-started-semantic-map",
      title: "Getting Started with the Semantic Map",
      summary:
        "A short walkthrough for selecting countries, reading point clusters, and understanding what semantic proximity means in practice.",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "Getting started",
      relatedVideos: [
        {
          title: "Country Selection and Semantic Map View",
          url: MAP_VIDEO_URL,
        },
        {
          title: "Official ConstitutionalMap AI tutorial playlist",
          url: PLAYLIST_URL,
        },
      ],
      sections: [
        {
          title: "What the map is actually showing",
          paragraphs: [
            "Each point in the 3D canvas stands for one constitutional article or a similar legal unit. Nearby points are not grouped by country first; they are grouped by semantic similarity.",
            "That means the best way to start is not to load everything at once. Select one or two countries and watch how their articles spread across the same global semantic space.",
          ],
        },
        {
          title: "A simple first workflow",
          paragraphs: [
            "Pick one country as your anchor and add a second country for contrast. This keeps the canvas legible and makes the first clusters easier to interpret.",
          ],
          steps: [
            "Open the atlas in your locale and select one country on the map.",
            "Add a second country with a different constitutional tradition.",
            "Look for dense regions before opening any article details.",
            "Switch color mode between countries and global clusters.",
          ],
        },
      ],
    },
    {
      slug: "comparing-countries-clearly",
      title: "Comparing Countries Without Getting Lost in 3D",
      summary:
        "A compact routine for keeping comparisons readable, moving between countries, and grounding visual impressions in real constitutional text.",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "Comparison",
      relatedVideos: [
        {
          title: "Official ConstitutionalMap AI tutorial playlist",
          url: PLAYLIST_URL,
        },
        {
          title: "Country Selection and Semantic Map View",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "Keep the comparison small at first",
          paragraphs: [
            "Large country sets usually make the first reading harder, not better. A pair or a small group is enough to see whether similarity is broad or concentrated in a few thematic clusters.",
            "Use one country as an anchor and change only one comparison variable at a time.",
          ],
        },
        {
          title: "A reliable comparison loop",
          paragraphs: [
            "The statistics panel and the article detail panel are there to slow you down in a good way. Use them to check whether the visual pattern is supported by the underlying text.",
          ],
          steps: [
            "Select two countries and review their coverage and entropy.",
            "Open one dense cluster and inspect two or three articles.",
            "Use the comparison flow to validate the initial visual impression.",
            "Swap one country and repeat the same sequence.",
          ],
        },
      ],
    },
    {
      slug: "validating-search-results",
      title: "From Search Result to Full Article",
      summary:
        "How to move from keyword or semantic search into the full constitutional text and confirm whether a promising result really supports your research claim.",
      publishedAt: "2026-03-30",
      readingMinutes: 5,
      eyebrow: "Search workflow",
      relatedVideos: [
        {
          title: "Official ConstitutionalMap AI tutorial playlist",
          url: PLAYLIST_URL,
        },
        {
          title: "Country Selection and Semantic Map View",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "Two entry points",
          paragraphs: [
            "Keyword search is better when you already know the expression or institution you want to test. Semantic search is better when you want conceptually related passages even if the wording changes across constitutions.",
            "In practice, the two modes work best together: exact search to anchor yourself, semantic search to widen the field.",
          ],
        },
        {
          title: "Validate before you conclude",
          paragraphs: [
            "The snippet is only a triage tool. The real validation happens when you open the full article and inspect nearby points in the same cluster.",
          ],
          steps: [
            "Run a short keyword or semantic query.",
            "Open a result that looks strong and read the full article.",
            "Check the global cluster and inspect nearby segments.",
            "Compare two or three full texts before keeping the claim.",
          ],
        },
      ],
    },
  ],
  es: [
    {
      slug: "getting-started-semantic-map",
      title: "Como empezar con el mapa semantico",
      summary:
        "Una guia breve para seleccionar paises, leer agrupamientos de puntos y entender que significa la proximidad semantica en la practica.",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "Inicio",
      relatedVideos: [
        {
          title: "Seleccion de paises y vista del mapa semantico",
          url: MAP_VIDEO_URL,
        },
        {
          title: "Playlist oficial de tutoriales de ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
      ],
      sections: [
        {
          title: "Que muestra realmente el mapa",
          paragraphs: [
            "Cada punto del canvas 3D representa un articulo constitucional o una unidad juridica equivalente. Los puntos cercanos no se agrupan primero por pais, sino por similitud semantica.",
            "Por eso conviene no cargar todo al mismo tiempo. Selecciona uno o dos paises y observa como sus articulos se distribuyen en el mismo espacio semantico global.",
          ],
        },
        {
          title: "Un primer flujo que funciona",
          paragraphs: [
            "Elige un pais como ancla y agrega un segundo pais para contraste. Asi el canvas sigue siendo legible y los primeros clusters son mas faciles de interpretar.",
          ],
          steps: [
            "Abre el atlas en tu idioma y selecciona un pais en el mapa.",
            "Agrega un segundo pais con una tradicion constitucional distinta.",
            "Observa las regiones densas antes de abrir detalles de articulos.",
            "Cambia el modo de color entre paises y clusters globales.",
          ],
        },
      ],
    },
    {
      slug: "comparing-countries-clearly",
      title: "Como comparar paises sin perderse en 3D",
      summary:
        "Una rutina compacta para mantener comparaciones legibles, cambiar de pais con control y apoyar la lectura visual en texto constitucional real.",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "Comparacion",
      relatedVideos: [
        {
          title: "Playlist oficial de tutoriales de ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
        {
          title: "Seleccion de paises y vista del mapa semantico",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "Empieza con comparaciones pequenas",
          paragraphs: [
            "Los conjuntos grandes suelen dificultar la primera lectura. Un par o un grupo pequeno basta para ver si la similitud es general o si aparece solo en algunos clusters tematicos.",
            "Usa un pais como referencia y cambia una sola variable por vez.",
          ],
        },
        {
          title: "Un ciclo de comparacion fiable",
          paragraphs: [
            "El panel de estadisticas y el panel de detalle estan para frenar las conclusiones apresuradas. Utilizalos para comprobar si el patron visual se sostiene en el texto.",
          ],
          steps: [
            "Selecciona dos paises y revisa cobertura y entropia.",
            "Abre un cluster denso e inspecciona dos o tres articulos.",
            "Usa el flujo de comparacion para validar la impresion inicial.",
            "Sustituye un pais y repite la misma secuencia.",
          ],
        },
      ],
    },
    {
      slug: "validating-search-results",
      title: "Del resultado de busqueda al articulo completo",
      summary:
        "Como pasar de la busqueda textual o semantica al texto constitucional completo y confirmar si un resultado realmente sostiene una hipotesis de investigacion.",
      publishedAt: "2026-03-30",
      readingMinutes: 5,
      eyebrow: "Busqueda",
      relatedVideos: [
        {
          title: "Playlist oficial de tutoriales de ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
        {
          title: "Seleccion de paises y vista del mapa semantico",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "Dos puertas de entrada",
          paragraphs: [
            "La busqueda textual sirve mejor cuando ya conoces el termino o la institucion que quieres probar. La busqueda semantica sirve mejor cuando buscas pasajes cercanos en sentido aunque cambie la redaccion.",
            "En la practica, los dos modos se complementan: una busqueda exacta te ancla y la semantica te ayuda a ampliar el campo.",
          ],
        },
        {
          title: "Valida antes de concluir",
          paragraphs: [
            "El snippet solo sirve para filtrar. La validacion real ocurre cuando abres el articulo completo y miras segmentos cercanos del mismo cluster.",
          ],
          steps: [
            "Lanza una consulta corta.",
            "Abre un resultado prometedor y lee el articulo completo.",
            "Comprueba el cluster global e inspecciona puntos cercanos.",
            "Compara dos o tres textos completos antes de cerrar la lectura.",
          ],
        },
      ],
    },
  ],
  pt: [
    {
      slug: "getting-started-semantic-map",
      title: "Como começar no mapa semântico",
      summary:
        "Um guia curto para selecionar países, ler agrupamentos de pontos e entender o que a proximidade semântica significa na prática.",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "Início",
      relatedVideos: [
        {
          title: "Seleção de países e visualização do mapa semântico",
          url: MAP_VIDEO_URL,
        },
        {
          title: "Playlist oficial de tutoriais do ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
      ],
      sections: [
        {
          title: "O que o mapa realmente mostra",
          paragraphs: [
            "Cada ponto do canvas 3D representa um artigo constitucional ou uma unidade jurídica equivalente. Pontos próximos não estão agrupados primeiro por país, mas por semelhança semântica.",
            "Por isso vale evitar carregar tudo de uma vez. Selecione um ou dois países e observe como os artigos se distribuem no mesmo espaço semântico global.",
          ],
        },
        {
          title: "Um primeiro fluxo que funciona",
          paragraphs: [
            "Escolha um país como âncora e adicione um segundo país para contraste. Assim o canvas continua legível e os primeiros clusters ficam mais fáceis de interpretar.",
          ],
          steps: [
            "Abra o atlas no seu idioma e selecione um país no mapa.",
            "Adicione um segundo país com tradição constitucional diferente.",
            "Observe as regiões mais densas antes de abrir artigos.",
            "Troque o modo de cor entre países e clusters globais.",
          ],
        },
      ],
    },
    {
      slug: "comparing-countries-clearly",
      title: "Como comparar países sem se perder no 3D",
      summary:
        "Uma rotina compacta para manter comparações legíveis, trocar de país com controle e apoiar a leitura visual em texto constitucional real.",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "Comparação",
      relatedVideos: [
        {
          title: "Playlist oficial de tutoriais do ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
        {
          title: "Seleção de países e visualização do mapa semântico",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "Comece com comparações pequenas",
          paragraphs: [
            "Conjuntos grandes costumam atrapalhar a primeira leitura. Um par ou um grupo pequeno basta para mostrar se a semelhança é ampla ou se aparece só em alguns clusters temáticos.",
            "Use um país como referência e mude apenas uma variável por vez.",
          ],
        },
        {
          title: "Um ciclo de comparação confiável",
          paragraphs: [
            "O painel de estatísticas e o painel de detalhe existem para desacelerar a conclusão apressada. Use os dois para verificar se o padrão visual se sustenta no texto.",
          ],
          steps: [
            "Selecione dois países e revise cobertura e entropia.",
            "Abra um cluster denso e leia dois ou três artigos.",
            "Use o fluxo de comparação para validar a impressão inicial.",
            "Troque um dos países e repita a mesma sequência.",
          ],
        },
      ],
    },
    {
      slug: "validating-search-results",
      title: "Do resultado de busca ao artigo completo",
      summary:
        "Como sair da busca textual ou semântica, abrir o texto constitucional completo e confirmar se um resultado realmente sustenta a sua leitura.",
      publishedAt: "2026-03-30",
      readingMinutes: 5,
      eyebrow: "Busca",
      relatedVideos: [
        {
          title: "Playlist oficial de tutoriais do ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
        {
          title: "Seleção de países e visualização do mapa semântico",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "Dois pontos de entrada",
          paragraphs: [
            "A busca textual funciona melhor quando você já conhece o termo ou a instituição que quer testar. A busca semântica funciona melhor quando você procura passagens próximas em sentido, mesmo com redações diferentes.",
            "Na prática, os dois modos se complementam: a busca exata âncora a leitura e a busca semântica amplia o campo.",
          ],
        },
        {
          title: "Valide antes de concluir",
          paragraphs: [
            "O snippet serve apenas para triagem. A validação real acontece quando você abre o artigo completo e olha segmentos próximos do mesmo cluster.",
          ],
          steps: [
            "Rode uma consulta curta.",
            "Abra um resultado promissor e leia o artigo completo.",
            "Verifique o cluster global e inspecione pontos próximos.",
            "Compare dois ou três textos completos antes de fechar a conclusão.",
          ],
        },
      ],
    },
  ],
  it: [
    {
      slug: "getting-started-semantic-map",
      title: "Come iniziare con la mappa semantica",
      summary:
        "Una guida breve per selezionare paesi, leggere i gruppi di punti e capire cosa significhi davvero la prossimita semantica.",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "Introduzione",
      relatedVideos: [
        {
          title: "Selezione dei paesi e vista della mappa semantica",
          url: MAP_VIDEO_URL,
        },
        {
          title: "Playlist ufficiale dei tutorial di ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
      ],
      sections: [
        {
          title: "Che cosa mostra davvero la mappa",
          paragraphs: [
            "Ogni punto nel canvas 3D rappresenta un articolo costituzionale o unita giuridica equivalente. I punti vicini non sono raggruppati prima per paese, ma per similarita semantica.",
            "Per questo conviene non caricare tutto subito. Seleziona uno o due paesi e osserva come i loro articoli si distribuiscono nello stesso spazio semantico globale.",
          ],
        },
        {
          title: "Un primo flusso utile",
          paragraphs: [
            "Scegli un paese come ancora e aggiungine un secondo per contrasto. In questo modo il canvas resta leggibile e i primi cluster sono piu facili da interpretare.",
          ],
          steps: [
            "Apri l'atlante nella tua lingua e seleziona un paese sulla mappa.",
            "Aggiungi un secondo paese con una tradizione costituzionale diversa.",
            "Osserva le zone piu dense prima di aprire gli articoli.",
            "Cambia la modalita colore tra paesi e cluster globali.",
          ],
        },
      ],
    },
    {
      slug: "comparing-countries-clearly",
      title: "Come confrontare paesi senza perdersi nel 3D",
      summary:
        "Una routine compatta per mantenere i confronti leggibili, cambiare paese con controllo e collegare l'impressione visiva al testo costituzionale.",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "Confronto",
      relatedVideos: [
        {
          title: "Playlist ufficiale dei tutorial di ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
        {
          title: "Selezione dei paesi e vista della mappa semantica",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "Inizia con confronti piccoli",
          paragraphs: [
            "Gruppi troppo ampi complicano la prima lettura. Una coppia o un piccolo gruppo basta per capire se la similarita e diffusa oppure concentrata in pochi cluster tematici.",
            "Usa un paese come riferimento e cambia una sola variabile alla volta.",
          ],
        },
        {
          title: "Un ciclo di confronto affidabile",
          paragraphs: [
            "Il pannello statistiche e il pannello dettaglio servono proprio a rallentare le conclusioni affrettate. Usali per verificare se il pattern visivo regge sul testo.",
          ],
          steps: [
            "Seleziona due paesi e controlla copertura ed entropia.",
            "Apri un cluster denso e leggi due o tre articoli.",
            "Usa il flusso di confronto per verificare la prima impressione.",
            "Sostituisci un paese e ripeti la stessa sequenza.",
          ],
        },
      ],
    },
    {
      slug: "validating-search-results",
      title: "Dal risultato di ricerca all'articolo completo",
      summary:
        "Come partire dalla ricerca testuale o semantica, aprire il testo costituzionale completo e verificare se un risultato sostiene davvero la tua ipotesi.",
      publishedAt: "2026-03-30",
      readingMinutes: 5,
      eyebrow: "Ricerca",
      relatedVideos: [
        {
          title: "Playlist ufficiale dei tutorial di ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
        {
          title: "Selezione dei paesi e vista della mappa semantica",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "Due punti di ingresso",
          paragraphs: [
            "La ricerca testuale funziona meglio quando conosci gia il termine o l'istituzione che vuoi verificare. La ricerca semantica e migliore quando cerchi passaggi vicini per significato, anche se la formulazione cambia.",
            "Nella pratica i due modi si completano: la ricerca esatta ti ancora, quella semantica allarga il campo.",
          ],
        },
        {
          title: "Verifica prima di concludere",
          paragraphs: [
            "Lo snippet serve solo a filtrare. La verifica reale avviene quando apri l'articolo completo e controlli segmenti vicini dello stesso cluster.",
          ],
          steps: [
            "Lancia una query breve.",
            "Apri un risultato promettente e leggi l'articolo completo.",
            "Controlla il cluster globale e osserva i punti vicini.",
            "Confronta due o tre testi completi prima di chiudere l'analisi.",
          ],
        },
      ],
    },
  ],
  fr: [
    {
      slug: "getting-started-semantic-map",
      title: "Bien debuter avec la carte semantique",
      summary:
        "Un guide court pour selectionner des pays, lire les regroupements de points et comprendre ce que signifie vraiment la proximite semantique.",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "Prise en main",
      relatedVideos: [
        {
          title: "Selection des pays et vue de la carte semantique",
          url: MAP_VIDEO_URL,
        },
        {
          title: "Playlist officielle des tutoriels ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
      ],
      sections: [
        {
          title: "Ce que la carte montre vraiment",
          paragraphs: [
            "Chaque point du canvas 3D represente un article constitutionnel ou une unite juridique equivalente. Les points proches ne sont pas d'abord rapproches par pays, mais par similarite semantique.",
            "Il vaut donc mieux ne pas tout charger d'un coup. Selectionnez un ou deux pays et observez comment leurs articles se repartissent dans le meme espace semantique global.",
          ],
        },
        {
          title: "Un premier parcours utile",
          paragraphs: [
            "Choisissez un pays d'ancrage puis ajoutez un second pays pour le contraste. Le canvas reste lisible et les premiers clusters deviennent plus faciles a interpreter.",
          ],
          steps: [
            "Ouvrez l'atlas dans votre langue et selectionnez un pays sur la carte.",
            "Ajoutez un second pays d'une autre tradition constitutionnelle.",
            "Reperez les zones denses avant d'ouvrir des articles.",
            "Changez le mode de couleur entre pays et clusters globaux.",
          ],
        },
      ],
    },
    {
      slug: "comparing-countries-clearly",
      title: "Comparer des pays sans se perdre dans la 3D",
      summary:
        "Une routine courte pour garder des comparaisons lisibles, changer de pays avec methode et relier l'impression visuelle au texte constitutionnel.",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "Comparaison",
      relatedVideos: [
        {
          title: "Playlist officielle des tutoriels ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
        {
          title: "Selection des pays et vue de la carte semantique",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "Commencez petit",
          paragraphs: [
            "Les grands ensembles rendent souvent la premiere lecture plus confuse. Un duo ou un petit groupe suffit pour voir si la similarite est diffuse ou concentree dans quelques clusters thematiques.",
            "Gardez un pays comme reference et ne changez qu'une variable a la fois.",
          ],
        },
        {
          title: "Une boucle de comparaison fiable",
          paragraphs: [
            "Le panneau de statistiques et le panneau de detail servent a ralentir les conclusions trop rapides. Utilisez-les pour verifier que le motif visuel tient dans le texte.",
          ],
          steps: [
            "Selectionnez deux pays et regardez couverture et entropie.",
            "Ouvrez un cluster dense et lisez deux ou trois articles.",
            "Utilisez le flux de comparaison pour tester votre premiere impression.",
            "Remplacez un pays et repetez la meme sequence.",
          ],
        },
      ],
    },
    {
      slug: "validating-search-results",
      title: "Du resultat de recherche a l'article complet",
      summary:
        "Comment partir d'une recherche textuelle ou semantique, ouvrir le texte constitutionnel complet et verifier si un resultat soutient vraiment votre hypothese.",
      publishedAt: "2026-03-30",
      readingMinutes: 5,
      eyebrow: "Recherche",
      relatedVideos: [
        {
          title: "Playlist officielle des tutoriels ConstitutionalMap AI",
          url: PLAYLIST_URL,
        },
        {
          title: "Selection des pays et vue de la carte semantique",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "Deux portes d'entree",
          paragraphs: [
            "La recherche textuelle fonctionne mieux quand vous connaissez deja l'expression ou l'institution a verifier. La recherche semantique est plus utile quand vous cherchez des passages proches par le sens malgre des formulations differentes.",
            "Dans la pratique, les deux modes se completent : la recherche exacte ancre l'analyse et la recherche semantique elargit le terrain.",
          ],
        },
        {
          title: "Verifier avant de conclure",
          paragraphs: [
            "L'extrait ne sert qu'au tri. La vraie verification commence quand vous ouvrez l'article complet et que vous examinez les segments voisins du meme cluster.",
          ],
          steps: [
            "Lancez une requete courte.",
            "Ouvrez un resultat prometteur et lisez l'article complet.",
            "Verifiez le cluster global et observez les points voisins.",
            "Comparez deux ou trois textes complets avant de retenir l'interpretation.",
          ],
        },
      ],
    },
  ],
  ja: [
    {
      slug: "getting-started-semantic-map",
      title: "セマンティックマップの始め方",
      summary:
        "国の選択、点群の読み方、そして意味的な近さが実際に何を示すのかを短く学ぶための入門記事です。",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "入門",
      relatedVideos: [
        {
          title: "国の選択とセマンティックマップ表示",
          url: MAP_VIDEO_URL,
        },
        {
          title: "ConstitutionalMap AI 公式チュートリアル再生リスト",
          url: PLAYLIST_URL,
        },
      ],
      sections: [
        {
          title: "このマップが示しているもの",
          paragraphs: [
            "3Dキャンバス上の各点は、憲法の条文またはそれに近い法的単位を表します。近い点は国籍でまとまっているのではなく、意味の近さで集まっています。",
            "そのため、最初から全部を表示するより、一つか二つの国を選んで同じグローバルな意味空間の中でどのように広がるかを見る方が理解しやすくなります。",
          ],
        },
        {
          title: "最初に試すとよい流れ",
          paragraphs: [
            "一つの国を基準にし、対照用にもう一つの国を加えてください。そうすると表示が読みやすくなり、最初のクラスターも解釈しやすくなります。",
          ],
          steps: [
            "自分の言語でアトラスを開き、地図上で一つの国を選択します。",
            "異なる憲法的伝統を持つ国をもう一つ追加します。",
            "条文を開く前に、点が密集している領域を確認します。",
            "色分けを国別表示とグローバルクラスター表示で切り替えます。",
          ],
        },
      ],
    },
    {
      slug: "comparing-countries-clearly",
      title: "3D空間で迷わずに国を比較する",
      summary:
        "比較を読みやすく保ち、国の切り替えを整理しながら、視覚的な印象を実際の憲法テキストに結び付けるための短い手順です。",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "比較",
      relatedVideos: [
        {
          title: "ConstitutionalMap AI 公式チュートリアル再生リスト",
          url: PLAYLIST_URL,
        },
        {
          title: "国の選択とセマンティックマップ表示",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "最初は小さく比較する",
          paragraphs: [
            "多くの国を一度に表示すると、最初の読解はかえって難しくなります。二か国、または小さなグループで十分です。",
            "一つの国を基準にして、一度に一つの変数だけを変えるのが有効です。",
          ],
        },
        {
          title: "信頼できる比較の流れ",
          paragraphs: [
            "統計パネルと詳細パネルは、早すぎる結論を避けるためにあります。視覚的なパターンがテキストでも成り立つか確認してください。",
          ],
          steps: [
            "二つの国を選び、カバレッジとエントロピーを確認します。",
            "密度の高いクラスターを開き、二つか三つの条文を読みます。",
            "比較フローを使って最初の印象を検証します。",
            "一方の国を入れ替えて同じ手順を繰り返します。",
          ],
        },
      ],
    },
    {
      slug: "validating-search-results",
      title: "検索結果から条文全文へ",
      summary:
        "キーワード検索やセマンティック検索から出発し、憲法条文の全文を開いて、その結果が本当に自分の仮説を支えるかを確かめる方法です。",
      publishedAt: "2026-03-30",
      readingMinutes: 5,
      eyebrow: "検索",
      relatedVideos: [
        {
          title: "ConstitutionalMap AI 公式チュートリアル再生リスト",
          url: PLAYLIST_URL,
        },
        {
          title: "国の選択とセマンティックマップ表示",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "二つの入口",
          paragraphs: [
            "キーワード検索は、確認したい語句や制度がすでに分かっているときに向いています。セマンティック検索は、表現が違っても意味の近い条文を探したいときに役立ちます。",
            "実際には、正確な検索で足場を作り、セマンティック検索で視野を広げる使い方が効果的です。",
          ],
        },
        {
          title: "結論の前に検証する",
          paragraphs: [
            "スニペットは絞り込み用に過ぎません。本当の検証は、条文全文を開き、同じクラスターの近くの点も読むところから始まります。",
          ],
          steps: [
            "短い検索語または質問を入力します。",
            "有望な結果を開いて条文全文を読みます。",
            "グローバルクラスターを確認し、近くの点も調べます。",
            "二つか三つの全文を比較してから結論を残します。",
          ],
        },
      ],
    },
  ],
  zh: [
    {
      slug: "getting-started-semantic-map",
      title: "如何开始阅读语义地图",
      summary:
        "一篇简短教程，帮助你选择国家、理解点群，并弄清语义接近在这个产品里到底意味着什么。",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "入门",
      relatedVideos: [
        {
          title: "国家选择与语义地图视图",
          url: MAP_VIDEO_URL,
        },
        {
          title: "ConstitutionalMap AI 官方教程播放列表",
          url: PLAYLIST_URL,
        },
      ],
      sections: [
        {
          title: "这张地图真正展示的是什么",
          paragraphs: [
            "3D 画布中的每个点代表一条宪法条文或相近的法律单元。点与点靠得近，并不是因为它们来自同一个国家，而是因为它们在语义上更接近。",
            "因此，开始时不要一次加载所有国家。先选一到两个国家，观察它们如何分布在同一个全球语义空间中。",
          ],
        },
        {
          title: "一个适合起步的流程",
          paragraphs: [
            "先选一个国家作为锚点，再加入第二个国家做对照。这样画布更容易阅读，最初几个聚类也更容易解释。",
          ],
          steps: [
            "在你的语言环境中打开 atlas，并在地图上选择一个国家。",
            "再加入一个宪法传统不同的国家。",
            "在打开条文之前先看点最密集的区域。",
            "在按国家着色和按全局聚类着色之间切换。",
          ],
        },
      ],
    },
    {
      slug: "comparing-countries-clearly",
      title: "如何在 3D 视图中清晰比较国家",
      summary:
        "一套简短流程，帮助你保持比较过程清晰、稳步切换国家，并把视觉印象落实到真正的宪法文本上。",
      publishedAt: "2026-03-30",
      readingMinutes: 4,
      eyebrow: "比较",
      relatedVideos: [
        {
          title: "ConstitutionalMap AI 官方教程播放列表",
          url: PLAYLIST_URL,
        },
        {
          title: "国家选择与语义地图视图",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "开始时先做小规模比较",
          paragraphs: [
            "一开始同时比较很多国家，往往会让阅读更困难而不是更清楚。两个国家，或者一个很小的组合，就足以判断相似性是普遍存在，还是只集中在少数主题聚类里。",
            "把一个国家当作参照，并且一次只改变一个变量。",
          ],
        },
        {
          title: "一个可靠的比较循环",
          paragraphs: [
            "统计面板和条文详情面板的作用，是帮助你避免过快下结论。用它们检查视觉上的模式是否真的能被文本支撑。",
          ],
          steps: [
            "选择两个国家，查看覆盖度和熵。",
            "打开一个密集聚类，阅读两到三条条文。",
            "使用比较流程验证最初的视觉印象。",
            "替换其中一个国家，并重复同样的步骤。",
          ],
        },
      ],
    },
    {
      slug: "validating-search-results",
      title: "从搜索结果到完整条文",
      summary:
        "如何从关键词搜索或语义搜索出发，打开完整宪法条文，并确认一个结果是否真的支持你的研究判断。",
      publishedAt: "2026-03-30",
      readingMinutes: 5,
      eyebrow: "搜索",
      relatedVideos: [
        {
          title: "ConstitutionalMap AI 官方教程播放列表",
          url: PLAYLIST_URL,
        },
        {
          title: "国家选择与语义地图视图",
          url: MAP_VIDEO_URL,
        },
      ],
      sections: [
        {
          title: "两个入口",
          paragraphs: [
            "当你已经知道要验证的术语或制度时，关键词搜索更合适。若你想找语义接近、但表述不同的段落，语义搜索更有用。",
            "实际使用中，最好把两者结合起来：先用精确搜索建立锚点，再用语义搜索扩大视野。",
          ],
        },
        {
          title: "先验证，再下结论",
          paragraphs: [
            "摘要片段只适合筛选。真正的验证发生在你打开完整条文，并继续查看同一聚类附近的其他段落时。",
          ],
          steps: [
            "输入一个简短的关键词或问题。",
            "打开一个看起来有力的结果并阅读全文。",
            "查看全局聚类，并检查附近的点。",
            "在形成判断之前，对比两到三篇完整文本。",
          ],
        },
      ],
    },
  ],
};

export function listBlogTutorials(locale: AppLocale) {
  return [...BLOG_TUTORIALS_BY_LOCALE[locale]].sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );
}

export function getBlogTutorialBySlug(locale: AppLocale, slug: string) {
  return (
    BLOG_TUTORIALS_BY_LOCALE[locale].find((entry) => entry.slug === slug) ?? null
  );
}

export function listBlogTutorialSlugs() {
  return BLOG_TUTORIALS_BY_LOCALE.en.map((entry) => entry.slug);
}

function isDirectYoutubeVideo(url: string) {
  try {
    const parsed = new URL(url);

    return parsed.hostname.includes("youtube.com") && parsed.pathname === "/watch";
  } catch {
    return false;
  }
}

export function getPrimaryRelatedVideo(entry: BlogTutorialEntry) {
  return entry.relatedVideos.find((video) => isDirectYoutubeVideo(video.url)) ?? null;
}
