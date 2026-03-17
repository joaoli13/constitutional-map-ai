# The Constitutional Atlas — Product Requirements Document

**Versão:** 1.2
**Data:** 2026-03-17
**Autor:** Claude (Anthropic) — gerado a pedido do usuário
**Status:** Draft

---

## 1. Visão Geral

**Nome:** The Constitutional Atlas
**Subtítulo:** *A semantic map of the world's constitutions*

O **The Constitutional Atlas** é uma plataforma de análise semântica comparativa das constituições vigentes de todos os países do mundo. O projeto extrai, segmenta, vetoriza e clusteriza os textos constitucionais a partir do repositório público do [Constitute Project](https://www.constituteproject.org/constitutions?lang=en&status=in_force), gerando uma visualização 3D interativa que permite explorar a cobertura semântica de cada país no espaço de embeddings.

### 1.1 Objetivo

Permitir que pesquisadores, juristas, cientistas políticos e curiosos possam **visualizar e comparar a cobertura semântica** das constituições do mundo, identificando:

- Quais regiões do espaço semântico cada país cobre
- Sobreposições e lacunas entre constituições
- Agrupamentos temáticos emergentes (direitos fundamentais, organização do Estado, economia, etc.)
- Outliers — dispositivos constitucionais semanticamente únicos

### 1.2 Idiomas do Portal

O web app (M5) é multilíngue. O idioma padrão é **inglês**; os idiomas suportados no lançamento (v1) são:

| Código | Idioma | Status |
|--------|--------|--------|
| `en` | English | default |
| `es` | Español | v1 |
| `pt` | Português | v1 |

Toda string visível ao usuário (labels, tooltips, textos de UI, mensagens de erro, citação do Constitute Project) deve ser externalizada para arquivos de tradução. O idioma é detectado pelo browser (`Accept-Language`) e pode ser alterado manualmente pelo usuário; a preferência é persistida em `localStorage`.

### 1.3 Público-alvo

- Pesquisadores em direito constitucional comparado
- Cientistas políticos e internacionalistas
- Cientistas de dados com interesse em NLP jurídico
- Organizações internacionais (ONU, IDEA, Venice Commission)

### 1.4 Licenciamento dos Dados-Fonte

O Constitute Project disponibiliza seus dados sob licença **Creative Commons Attribution-NonCommercial 3.0 Unported**. Algumas traduções em inglês são fornecidas com permissão da HeinOnline e da Oxford Constitutions of the World. O uso neste projeto deve respeitar a cláusula de uso não-comercial.

**Citação obrigatória:**
> Elkins, Zachary, Tom Ginsburg, James Melton. *Constitute: The World's Constitutions to Read, Search, and Compare*. Online at constituteproject.org.

---

## 2. Arquitetura Geral

O projeto é dividido em duas fases bem delimitadas:

- **Pipeline offline (M1–M4.5):** Executado localmente ou em CI. Processa, vetoriza, clusteriza e exporta os dados. Não faz parte do deploy na Vercel.
- **Web app (M5):** Next.js deployado na Vercel. Consome os artefatos JSON gerados pelo pipeline e o banco Neon para busca semântica.

```
── PIPELINE OFFLINE (Python) ─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐  │
│  │  M1: Scraper │────▸│ M2: Segmenta │────▸│ M3: Embedder │────▸│ M4: Cluster  │────▸│ M4.5: Exporter   │  │
│  │  (Web Scrap) │     │    dor       │     │  (Gemini)    │     │ (UMAP+HDBSC) │     │ (Parquet → JSON  │  │
│  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     │  + Neon ingest)  │  │
│         │                    │                    │                    │              └────────┬─────────┘  │
│         ▼                    ▼                    ▼                    ▼                       │            │
│    raw_html/             articles/           embeddings/          clusters/                    │            │
│    raw_text/             *.csv               *.parquet            *.parquet                    │            │
└─────────────────────────────────────────────────────────────────────────────────────────────── │ ───────────┘
                                                                                                 │
                           ┌─────────────────────────────────────────────┐                      │
                           │              Artefatos de deploy             │◀─────────────────────┘
                           │  app/public/data/index.json                 │
                           │  app/public/data/clusters.json              │
                           │  app/public/data/countries/{CODE}.json      │
                           │  Neon DB (tabela articles — busca full-text) │
                           └────────────────────┬────────────────────────┘
                                                │
                                                ▼
                           ┌─────────────────────────────────────────────┐
                           │           WEB APP — Vercel (Next.js)         │
                           │  CDN: JSON estático (países, clusters)       │
                           │  Route Handler: /api/search → Neon           │
                           │  Route Handler: /api/compare → cálculo       │
                           └─────────────────────────────────────────────┘
```

### 2.1 Stack Tecnológica

#### Pipeline (offline — Python)

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | Python 3.11+ |
| Web scraping | `httpx` + `beautifulsoup4` + `playwright` (fallback JS-rendered) |
| Segmentação | `regex` + heurísticas customizadas por padrão constitucional |
| Embeddings | Google Gemini API — `gemini-embedding-001` (768d) / `gemini-embedding-2-preview` (768–3072d) |
| Redução dimensional | `umap-learn` (UMAP) |
| Clusterização | `hdbscan` (HDBSCAN com core-SG) |
| Armazenamento intermediário | Apache Parquet via `pyarrow` / CSV |
| Exportação | JSON estático por país + ingestão no Neon via `psycopg2` |

#### Web App (Vercel — TypeScript)

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14+ (App Router) |
| Linguagem | TypeScript |
| Visualização 3D | `@react-three/fiber` + `@react-three/drei` + Three.js |
| Mapa-múndi | `react-simple-maps` + TopoJSON (Natural Earth 110m) |
| UI | Tailwind CSS + shadcn/ui |
| Estado global | Zustand |
| Charts | Recharts |
| API (serverless) | Next.js Route Handlers |
| Dados estáticos | JSON por país em `public/data/` — servidos pelo CDN da Vercel |
| Busca full-text | Neon (PostgreSQL serverless) via `@neondatabase/serverless` |
| Deploy | Vercel |

---

## 3. Módulos Detalhados

---

### 3.1 Módulo 1 — Web Scraper (`m1_scraper`)

#### 3.1.1 Objetivo
Fazer download dos textos completos das constituições vigentes dos ~193 países soberanos listados no Constitute Project. Priorizar textos em inglês sempre que disponíveis.

#### 3.1.2 Fonte de Dados

- **URL base:** `https://www.constituteproject.org`
- **Listagem:** `/constitutions?lang=en&status=in_force`
- **Texto individual:** `/constitution/{Country}_{Year}?lang=en` (padrão observado, ex: `/constitution/Egypt_2014?lang=en`)
- **API alternativa:** O Constitute Project oferece uma API pública documentada em sua página de dados. Investigar endpoints REST disponíveis antes de recorrer a scraping direto.

#### 3.1.3 Estratégia de Coleta

1. **Fase 1 — Descoberta:** Coletar a lista completa de países/constituições vigentes com metadados (nome do país, ano de promulgação/última emenda, idiomas disponíveis).
2. **Fase 2 — Download:** Para cada constituição:
   - Tentar primeiro a versão em inglês (`lang=en`)
   - Se indisponível em inglês, baixar na língua original (registrar o idioma no metadado)
   - Extrair o corpo do texto constitucional (excluindo navegação, headers, footers do site)
3. **Fase 3 — Persistência:** Salvar cada texto como arquivo individual em `data/raw/{country_code}_{year}.txt` com metadados em `data/raw/metadata.json`

#### 3.1.4 Requisitos Técnicos

- **Rate limiting:** Máximo 1 requisição a cada 2 segundos (respeitar `robots.txt` e Terms of Service)
- **Retry com backoff exponencial:** 3 tentativas com delays de 5s, 15s, 45s
- **User-Agent:** Identificar-se como ferramenta acadêmica/pesquisa
- **Cache local:** Não re-baixar textos já obtidos (verificar por hash SHA-256)
- **Fallback Playwright:** Para páginas com renderização JavaScript obrigatória, usar Playwright em modo headless
- **Logging:** Registrar sucesso/falha por país, tempo de resposta, idioma obtido

#### 3.1.5 Schema de Saída — `metadata.json`

```json
{
  "country_name": "Brazil",
  "country_code": "BRA",
  "iso_alpha2": "BR",
  "region": "South America",
  "sub_region": "Latin America and the Caribbean",
  "constitution_year": 1988,
  "last_amendment_year": 2023,
  "language": "en",
  "source_url": "https://www.constituteproject.org/constitution/Brazil_2023?lang=en",
  "file_path": "data/raw/BRA_2023.txt",
  "sha256": "a1b2c3...",
  "scraped_at": "2026-03-17T14:30:00Z",
  "status": "success"
}
```

#### 3.1.6 Tratamento de Exceções

| Cenário | Ação |
|---------|------|
| País sem texto em inglês | Baixar na língua original, marcar `language` adequadamente |
| Página retorna 404/403 | Marcar `status: "not_found"`, tentar URL alternativa |
| Texto vazio ou muito curto (<500 chars) | Marcar `status: "suspicious"`, revisar manualmente |
| Timeout | Retry com backoff; após 3 falhas, marcar `status: "timeout"` |

---

### 3.2 Módulo 2 — Segmentador (`m2_segmenter`)

#### 3.2.1 Objetivo

Segmentar cada texto constitucional em seus dispositivos individuais (artigos, seções ou equivalentes), produzindo um CSV estruturado por país.

#### 3.2.2 Desafios de Segmentação

Constituições do mundo seguem **tradições jurídicas distintas** com padrões de numeração variados:

| Tradição | Padrão típico | Exemplo |
|----------|---------------|---------|
| Civil law (continental) | `Article 1`, `Art. 1`, `Artigo 1` | Brasil, França, Alemanha |
| Common law | `Section 1`, `s. 1` | Austrália, Índia, Nigéria |
| Islâmica/mista | `Article 1` (em tradução) | Irã, Arábia Saudita |
| Customary/híbrida | Variável | Butão, Tonga |
| Numeração com ponto | `1.`, `1.1.`, `Article 1.` | Suíça, África do Sul |
| Capítulos sem artigos | `Chapter I`, `Part I` | Algumas constituições curtas |

#### 3.2.3 Estratégia de Segmentação

```
Pipeline de segmentação:
1. Pré-processamento → normalizar encoding (UTF-8), remover artefatos HTML residuais
2. Detecção de padrão → regex multi-padrão para identificar delimitadores de artigo
3. Segmentação → split no delimitador detectado
4. Pós-processamento → limpeza de whitespace, merge de parágrafos órfãos
5. Validação → verificar se número de segmentos é plausível (5–500 por país)
```

**Regex patterns prioritários (em ordem de tentativa):**

```python
PATTERNS = [
    r'^Article\s+(\d+[A-Za-z]?[\.\-]?\d*)',         # Article 1, Article 14A
    r'^Art\.\s*(\d+[A-Za-z]?[\.\-]?\d*)',            # Art. 1, Art. 14-A
    r'^Section\s+(\d+[A-Za-z]?[\.\-]?\d*)',          # Section 1
    r'^§\s*(\d+[A-Za-z]?[\.\-]?\d*)',                # § 1
    r'^(\d+)\.\s',                                    # 1. (numeração direta)
    r'^Chapter\s+([IVXLCDM]+|\d+)',                   # Chapter I (fallback)
    r'^Part\s+([IVXLCDM]+|\d+)',                      # Part I (fallback)
]
```

#### 3.2.4 Schema de Saída — CSV

**Arquivo:** `data/articles/{country_code}_{year}.csv`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `NomeDoPais` | string | Nome do país em inglês (ex: "Brazil") |
| `Data` | string | Ano da constituição / última emenda (ex: "2023") |
| `NrDispositivo` | string | Identificador do artigo/seção (ex: "Article 5", "Section 12") |
| `Texto` | string | Texto integral do dispositivo, limpo e normalizado |

**Exemplo de registro:**

```csv
NomeDoPais,Data,NrDispositivo,Texto
Brazil,2023,Article 1,"The Federative Republic of Brazil, formed by the indissoluble union of the states and municipalities and of the Federal District, is a legal democratic state and is founded on: I - sovereignty; II - citizenship; III - the dignity of the human person; IV - the social values of work and of free enterprise; V - political pluralism."
Brazil,2023,Article 2,"The Legislative, the Executive and the Judiciary are the powers of the Union, independent and harmonious among themselves."
```

#### 3.2.5 Validações

- **Mínimo de segmentos por país:** 5 (alertar se menos)
- **Máximo de tokens por segmento:** 8.000 (limite do modelo de embedding); segmentos maiores devem ser subdivididos em parágrafos
- **Detecção de duplicatas:** Verificar se há segmentos com texto idêntico no mesmo país
- **Cobertura:** Verificar se a soma dos caracteres dos segmentos ≈ tamanho total do documento original (tolerância de ±5%)

#### 3.2.6 Arquivo Consolidado

Além dos CSVs individuais, gerar um arquivo consolidado:

**`data/articles/all_articles.csv`** — contendo todos os dispositivos de todos os países (estimativa: ~30.000–50.000 registros)

---

### 3.3 Módulo 3 — Embedder (`m3_embedder`)

#### 3.3.1 Objetivo

Calcular vetores de embedding para cada segmento constitucional usando o modelo Gemini da Google.

#### 3.3.2 Modelo

- **Modelo primário:** `gemini-embedding-001` (GA, text-only)
- **Modelo alternativo:** `gemini-embedding-2-preview` (multimodal, Public Preview — março 2026)
- **Dimensões de saída:** 768 (recomendado para balancear qualidade vs. custo de armazenamento e processamento UMAP)
  - Alternativa: 1536 ou 3072 para maior resolução semântica, configurável
- **Task type:** `RETRIEVAL_DOCUMENT` (otimizado para indexação de documentos)
- **Max input tokens:** 8.192 tokens por requisição (gemini-embedding-001 aceita 1 texto por request)

#### 3.3.3 Estratégia de Processamento

```
Pipeline de embedding:
1. Carregar all_articles.csv
2. Para cada segmento:
   a. Verificar se embedding já existe no cache
   b. Preparar payload com task_type e output_dimensionality
   c. Chamar API Gemini Embedding
   d. Salvar vetor no buffer
3. Persistir embeddings em Parquet com metadados
```

#### 3.3.4 Chamada à API

```python
# Exemplo via Google Generative AI SDK
import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)

result = genai.embed_content(
    model="models/gemini-embedding-001",
    content="The Federative Republic of Brazil...",
    task_type="RETRIEVAL_DOCUMENT",
    output_dimensionality=768
)
embedding_vector = result['embedding']  # list[float] de 768 dimensões
```

#### 3.3.5 Rate Limiting e Custos

| Parâmetro | Valor |
|-----------|-------|
| Rate limit (free tier) | ~1.500 requests/min |
| Rate limit (paid tier) | Configurável, até 10.000 RPM |
| Estimativa de segmentos | ~30.000–50.000 |
| Tempo estimado (free tier) | ~20–35 min |
| Custo estimado (paid tier) | Consultar pricing atualizado; embeddings são significativamente mais baratos que geração |

**Estratégia de throttling:**
- Batch de até 100 requests em paralelo (respeitando RPM)
- Retry com backoff exponencial em caso de 429 (rate limit) ou 500
- Checkpoint a cada 1.000 segmentos processados

#### 3.3.6 Schema de Saída — Parquet

**Arquivo:** `data/embeddings/embeddings.parquet`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `country_code` | string | Código ISO 3166-1 alpha-3 |
| `country_name` | string | Nome do país |
| `year` | int | Ano da constituição |
| `article_id` | string | Identificador do dispositivo |
| `text` | string | Texto do dispositivo |
| `embedding` | list[float] | Vetor de 768 (ou N) dimensões |
| `model` | string | Nome do modelo utilizado |
| `dimensions` | int | Número de dimensões |
| `embedded_at` | datetime | Timestamp do processamento |

#### 3.3.7 Validações

- **Norma do vetor:** Verificar que todos os vetores são unitários (norma L2 ≈ 1.0) — vetores Gemini já são normalizados
- **Dimensionalidade:** Confirmar que todos têm exatamente N dimensões
- **NaN/Inf check:** Rejeitar e reprocessar vetores com valores inválidos
- **Estatísticas:** Gerar relatório de cobertura (países processados, falhas, tempo total)

---

### 3.4 Módulo 4 — Clusterizador (`m4_clusterer`)

#### 3.4.1 Objetivo

Reduzir a dimensionalidade dos embeddings via UMAP e aplicar clusterização HDBSCAN com a variante core-SG (Sub-Graph), agrupando dispositivos constitucionais por proximidade semântica.

#### 3.4.2 Pipeline

```
Pipeline de clusterização:
1. Carregar embeddings.parquet
2. UMAP: reduzir de 768D → 3D (para visualização) e 768D → 50D (para clusterização)
3. HDBSCAN: aplicar sobre os 50D com parâmetros core-SG
4. Rotulagem: atribuir labels de cluster a cada segmento
5. Persistência: salvar projeções 3D + labels em Parquet
```

#### 3.4.3 UMAP — Redução Dimensional

```python
import umap

# Projeção para clusterização (alta dimensionalidade preserva estrutura)
reducer_cluster = umap.UMAP(
    n_components=50,
    n_neighbors=30,
    min_dist=0.0,
    metric='cosine',
    random_state=42
)
embeddings_50d = reducer_cluster.fit_transform(embeddings_768d)

# Projeção para visualização 3D
reducer_viz = umap.UMAP(
    n_components=3,
    n_neighbors=15,
    min_dist=0.1,
    metric='cosine',
    random_state=42
)
embeddings_3d = reducer_viz.fit_transform(embeddings_768d)
```

**Parâmetros justificados:**

| Parâmetro | Valor (cluster) | Valor (viz) | Justificativa |
|-----------|----------------|-------------|---------------|
| `n_components` | 50 | 3 | 50D preserva estrutura para HDBSCAN; 3D para renderização |
| `n_neighbors` | 30 | 15 | 30 captura estrutura global; 15 balanceia local/global para viz |
| `min_dist` | 0.0 | 0.1 | 0.0 favorece clusters densos; 0.1 evita sobreposição visual |
| `metric` | cosine | cosine | Embeddings normalizados → cosine é natural |

#### 3.4.4 HDBSCAN — Clusterização

```python
import hdbscan

clusterer = hdbscan.HDBSCAN(
    min_cluster_size=10,
    min_samples=5,
    metric='euclidean',          # sobre os 50D UMAP
    cluster_selection_method='eom',  # Excess of Mass
    algorithm='best',
    core_dist_n_jobs=-1,
    prediction_data=True         # habilita soft clustering
)
labels = clusterer.fit_predict(embeddings_50d)
```

**Sobre HDBSCAN-core-SG (Sub-Graph):**

A variante core-SG otimiza o cálculo do core-distance graph usando uma estrutura de subgrafo esparso, sendo mais eficiente computacionalmente para datasets de ~30k–50k pontos. Configurar via:

```python
# Se usando implementação com suporte a core-SG
clusterer = hdbscan.HDBSCAN(
    min_cluster_size=10,
    min_samples=5,
    algorithm='boruvka_kdtree',  # aproveita estrutura de subgrafo
    approx_min_span_tree=True,   # habilita aproximação via sub-graph
    core_dist_n_jobs=-1
)
```

#### 3.4.5 Clusterização por País

Além da clusterização global, executar **clusterização individual por país**:

```python
for country in countries:
    country_mask = df['country_code'] == country
    country_embeddings = embeddings_50d[country_mask]
    
    # HDBSCAN por país (parâmetros ajustados para menor escala)
    country_clusterer = hdbscan.HDBSCAN(
        min_cluster_size=3,      # menor porque há poucos artigos por país
        min_samples=2,
        metric='euclidean'
    )
    country_labels = country_clusterer.fit_predict(country_embeddings)
```

Isso permite visualizar **quais áreas semânticas cada país individualmente cobre** e quão internamente diversificada é cada constituição.

#### 3.4.6 Schema de Saída — Parquet

**Arquivo:** `data/clusters/clustered.parquet`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `country_code` | string | Código ISO |
| `country_name` | string | Nome do país |
| `region` | string | Região geográfica (para filtros do World Map) |
| `article_id` | string | Identificador do dispositivo |
| `text` | string | Texto do dispositivo (truncado a 500 chars para o viz) |
| `x` | float | Coordenada UMAP 3D — eixo X |
| `y` | float | Coordenada UMAP 3D — eixo Y |
| `z` | float | Coordenada UMAP 3D — eixo Z |
| `global_cluster` | int | Label do cluster global (-1 = noise) |
| `country_cluster` | int | Label do cluster intra-país (-1 = noise) |
| `cluster_probability` | float | Probabilidade de pertencer ao cluster (0–1) |

#### 3.4.7 Estatísticas de Saída

Gerar relatório `data/clusters/cluster_report.json`:

```json
{
  "total_points": 42000,
  "total_clusters_global": 85,
  "noise_points_global": 1200,
  "noise_ratio_global": 0.028,
  "clusters_per_country": {
    "BRA": 12,
    "USA": 8,
    "DEU": 14,
    ...
  },
  "largest_cluster": {
    "id": 3,
    "size": 2100,
    "top_countries": ["IND", "BRA", "ZAF", "DEU"],
    "sample_texts": ["Right to equality...", "Freedom of speech..."]
  }
}
```

---

### 3.5 Módulo 4.5 — Exportador (`m4_5_exporter`)

#### 3.5.1 Objetivo

Converter os artefatos Parquet gerados pelo M4 nos formatos consumíveis pelo web app (Next.js): arquivos JSON estáticos para o CDN da Vercel e ingestão no banco Neon para a funcionalidade de busca.

Este módulo é a **ponte entre o pipeline Python e o deploy Vercel**. Deve ser reexecutado sempre que o pipeline for reprocessado.

#### 3.5.2 Saída JSON Estática

Os arquivos são gerados em `app/public/data/` para que o Next.js os sirva diretamente pelo CDN da Vercel sem custo de função serverless.

**`app/public/data/index.json`** — carregado na inicialização do app (~100KB)

```json
{
  "generated_at": "2026-03-17T14:30:00Z",
  "pipeline_version": "1.0.0",
  "total_countries": 190,
  "total_articles": 42000,
  "countries": [
    {
      "code": "BRA",
      "iso_alpha2": "BR",
      "name": "Brazil",
      "region": "South America",
      "sub_region": "Latin America and the Caribbean",
      "constitution_year": 1988,
      "last_amendment_year": 2023,
      "article_count": 250,
      "cluster_count": 12,
      "semantic_coverage": 0.71,
      "semantic_entropy": 3.42,
      "has_data": true
    }
  ]
}
```

**`app/public/data/clusters.json`** — clusters globais (~200KB)

```json
{
  "total_clusters": 85,
  "noise_ratio": 0.028,
  "clusters": [
    {
      "id": 3,
      "size": 2100,
      "label": null,
      "top_countries": ["IND", "BRA", "ZAF", "DEU"],
      "centroid": [0.12, -0.45, 0.88],
      "sample_texts": ["Right to equality...", "Freedom of speech..."]
    }
  ]
}
```

**`app/public/data/countries/{CODE}.json`** — pontos 3D por país, carregados sob demanda (~50–200KB cada)

```json
{
  "code": "BRA",
  "name": "Brazil",
  "articles": [
    {
      "id": "BRA_2023_Art1",
      "article_id": "Article 1",
      "text_snippet": "The Federative Republic of Brazil, formed by the indissoluble union...",
      "x": 0.123,
      "y": -0.456,
      "z": 0.789,
      "global_cluster": 3,
      "country_cluster": 1,
      "cluster_probability": 0.92
    }
  ]
}
```

> **Estimativa de volume:** 193 arquivos × ~150KB médio = ~29MB total no CDN. Lazy loading por país: apenas os países selecionados no mapa são carregados.

#### 3.5.3 Ingestão no Neon (busca full-text)

Além dos JSON estáticos, o exportador ingere os textos completos dos artigos no Neon para suportar o endpoint `/api/search`.

**Schema da tabela `articles`:**

```sql
CREATE TABLE articles (
  id            TEXT PRIMARY KEY,          -- "BRA_2023_Art1"
  country_code  TEXT NOT NULL,
  country_name  TEXT NOT NULL,
  region        TEXT,
  article_id    TEXT NOT NULL,             -- "Article 1"
  year          INTEGER,
  text          TEXT NOT NULL,             -- texto integral
  text_snippet  TEXT,                      -- primeiros 200 chars (para resultados)
  global_cluster INTEGER,
  x             REAL,
  y             REAL,
  z             REAL
);

-- Índices para busca e filtragem
CREATE INDEX idx_articles_country ON articles(country_code);
CREATE INDEX idx_articles_cluster ON articles(global_cluster);
CREATE INDEX idx_articles_fts ON articles USING GIN(to_tsvector('english', text));
```

**Script de ingestão:**

```python
import psycopg2
import pandas as pd

df = pd.read_parquet("data/clusters/clustered.parquet")

conn = psycopg2.connect(os.environ["NEON_DATABASE_URL"])
cur = conn.cursor()

# Upsert em lotes de 500
for batch in chunked(df.itertuples(), 500):
    cur.executemany("""
        INSERT INTO articles (id, country_code, country_name, region, article_id, year,
                              text, text_snippet, global_cluster, x, y, z)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            text = EXCLUDED.text,
            global_cluster = EXCLUDED.global_cluster,
            x = EXCLUDED.x, y = EXCLUDED.y, z = EXCLUDED.z
    """, [(row.id, row.country_code, ...) for row in batch])

conn.commit()
```

#### 3.5.4 Validações

- Verificar que todos os 193 países com `has_data: true` têm arquivo `{CODE}.json` gerado
- Confirmar que o total de registros no Neon bate com o total de artigos no Parquet (tolerância 0%)
- Verificar que nenhum `text_snippet` está vazio (mínimo 20 chars)
- Gerar log de execução com contagens por país e tempo total

---

### 3.6 Módulo 5 — Visualizador (`m5_visualizer`)

#### 3.6.1 Objetivo

Aplicação web interativa com visualização 3D que permite explorar o espaço semântico das constituições, selecionando e comparando países em tempo real. Deployada na Vercel; sem servidor Python em runtime.

#### 3.6.2 Tecnologia

| Componente | Tecnologia |
|-----------|-----------|
| Framework | Next.js 14+ (App Router) com TypeScript |
| 3D Engine | Three.js via `@react-three/fiber` |
| Controles 3D | `@react-three/drei` (OrbitControls, Html overlays) |
| World Map | `react-simple-maps` + TopoJSON (Natural Earth 110m) |
| UI | Tailwind CSS + shadcn/ui |
| Estado global | Zustand |
| Charts auxiliares | Recharts |
| API | Next.js Route Handlers (serverless) |
| Dados estáticos | JSON em `public/data/` — CDN da Vercel, sem custo de função |
| Busca full-text | Neon PostgreSQL via `@neondatabase/serverless` (HTTP driver) |
| Deploy | Vercel |

#### 3.6.3 Layout da Interface

A interface é organizada em **dois painéis principais** — o World Map (seleção geográfica) na parte superior e o Canvas 3D (exploração semântica) na parte inferior — conectados por um painel lateral de controle.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER: The Constitutional Atlas                           [?] [⚙]    │
├─────────────────────────────────────────────┬───────────────────────────┤
│                                             │                           │
│           WORLD MAP (react-simple-maps)     │   PAINEL DE CONTROLE      │
│           ┌───────────────────────────┐     │                           │
│           │  ██ ███  ░░   ██ ░░░  ██ │     │   Selecionados: 4/193     │
│           │ ██░░░░░░░░░░  ░███ ░██░░ │     │   ● Brazil                │
│           │  ░░░██░  ░░░██  ░███░░░░ │     │   ● Germany               │
│           │   ░░░░░░░   ░░░░░░██░░░  │     │   ● India                 │
│           │     ░░░░░░  ░░░ ░░░░     │     │   ● South Africa          │
│           │       ░░░░    ░░░        │     │   [Limpar seleção]        │
│           └───────────────────────────┘     │                           │
│   [Zoom +/-] [Reset] [Região ▼]            │   Presets:                │
│                                             │   [G7] [G20] [BRICS]     │
│                                             │   [EU] [ASEAN] [AU]      │
│                                             │   [Todos] [Nenhum]       │
│                                             │                           │
│                                             │   Buscar: [__________]   │
├─────────────────────────────────────────────┴───────────────────────────┤
│                                                                         │
│                        CANVAS 3D (Three.js)                             │
│                                                                         │
│             ·  · ·    ·  ··      ·   ··                                 │
│           · ·   ·· ·  ·      ·· ·   ·                                  │
│             ··· ·  ···    · ···  ··                                     │
│          ·   · ·  · ···     ·  ··· ·                                   │
│            ·· ···  ·      ··  ·  ·                                     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  PAINEL INFERIOR: Detalhes do ponto selecionado / cluster               │
│  País: Brazil | Art. 5 | "All persons are equal before the law..."     │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 3.6.4 Funcionalidades

**F0 — World Map: Seleção Geográfica de Países (Painel Superior)**

O mapa-múndi interativo é o **mecanismo primário de seleção de países**. Implementado com `react-simple-maps` e dados TopoJSON do Natural Earth (110m), oferece uma experiência intuitiva de seleção geográfica.

**Comportamento de seleção:**
- **Click em um país:** Alterna seleção (toggle) — clica para selecionar, clica de novo para desselecionar
- **Múltipla seleção:** Cada click adiciona ou remove independentemente, sem necessidade de tecla modificadora (Ctrl/Shift)
- **Hover:** Tooltip com nome do país + número de dispositivos constitucionais + ano da constituição
- **Países sem dados:** Renderizados em cinza claro com cursor `not-allowed` e tooltip explicativo ("Texto constitucional não disponível")

**Feedback visual no mapa:**
- **Não selecionado (com dados):** Preenchimento cinza médio (`#D1D5DB`), borda fina
- **Selecionado:** Preenchimento na **cor atribuída ao país** (mesma cor usada nos pontos 3D), borda branca destacada com `stroke-width: 2`
- **Hover (não selecionado):** Elevação sutil de opacidade + borda de destaque
- **Hover (selecionado):** Leve escurecimento da cor para indicar que click vai desselecionar

**Sincronização bidirecional com o Canvas 3D:**
- Selecionar no mapa → pontos do país aparecem no Canvas 3D com a mesma cor
- Desselecionar no mapa → pontos do país somem (ou ficam fantasma com opacidade 0.05) no Canvas 3D
- A animação de transição (fade in/out dos pontos) deve ser suave (~300ms)

**Controles do mapa:**
- **Zoom:** Scroll ou botões +/- (zoom range: 1x a 8x)
- **Pan:** Drag para mover o mapa
- **Reset:** Botão para voltar à visão inicial (zoom 1x, centrado)
- **Projeção:** `geoMercator` (padrão) com opção de alternar para `geoEqualEarth` (preserva áreas — mais justo para comparação geográfica)

**Seleção por região (atalhos geográficos):**
- Dropdown ou botões para selecionar todos os países de uma região de uma vez
- Regiões: África, Américas (Norte/Central/Sul), Ásia, Europa, Oceania, Oriente Médio & Norte da África
- A seleção regional é aditiva (não substitui a seleção existente); um botão "Apenas esta região" permite substituir

**Presets de grupo geopolítico:**
- **G7:** USA, CAN, GBR, FRA, DEU, ITA, JPN
- **G20:** G7 + BRA, ARG, AUS, CHN, IND, IDN, KOR, MEX, RUS, SAU, ZAF, TUR, EU
- **BRICS:** BRA, RUS, IND, CHN, ZAF (+ novos membros: EGY, ETH, IRN, SAU, ARE)
- **EU:** 27 estados-membros
- **ASEAN:** 10 membros do Sudeste Asiático
- **AU (União Africana):** 55 estados-membros
- **Todos / Nenhum:** Selecionar ou limpar todos

**Paleta de cores:**
- Geração automática via HSL com espaçamento máximo de matiz para os países selecionados
- Máximo de ~20 cores distinguíveis simultaneamente; se mais de 20 países selecionados, agrupar por região com variações de luminosidade
- As cores são atribuídas dinamicamente a cada mudança de seleção, garantindo máximo contraste entre os países ativos

**Responsividade do mapa:**
- Em telas ≥ 1440px: mapa e painel de controle lado a lado (layout do diagrama acima)
- Em telas 1024–1439px: mapa ocupa largura total, painel de controle colapsa para barra horizontal abaixo do mapa
- Em telas < 1024px: mapa oculto por padrão, acessível via botão "Selecionar no mapa"; seleção via lista como fallback

**F1 — Painel de Controle Lateral**
- Lista textual dos países selecionados (com cor e ícone de bandeira opcional)
- Busca por nome (filtro em tempo real) — funciona tanto para selecionar no mapa quanto para scroll na lista
- Contagem de seleção: "4 de 193 países selecionados"
- Botões de preset (G7, G20, BRICS, EU, ASEAN, AU, Todos, Nenhum)
- Ordenação: alfabética, por número de dispositivos, por região

**F2 — Visualização 3D (Canvas Central)**
- Cada ponto representa um dispositivo constitucional (artigo/seção)
- Cor do ponto = país correspondente
- Tamanho do ponto: proporcional ao `cluster_probability` (pontos mais "confiantes" são maiores)
- Opacidade: pontos de países não selecionados ficam com opacidade 0.05 (fantasmas)
- Controles de câmera: rotação (drag), zoom (scroll), pan (shift+drag)
- Animação de rotação lenta automática (toggle on/off)

**F3 — Interação com Pontos**
- **Hover:** Tooltip mostrando país + número do artigo + primeiras 100 chars do texto
- **Click:** Painel inferior expande mostrando texto completo do dispositivo
- **Double-click:** Centraliza câmera no ponto clicado

**F4 — Clusters**
- Opção de colorir por **cluster global** em vez de por país
- Visualização de "convex hull" translúcido envolvendo cada cluster
- Toggle para mostrar/esconder labels de cluster
- Labels dos clusters: gerar automaticamente via LLM (prompt com os 5 textos mais centrais de cada cluster)

**F5 — Modo Comparação**
- Selecionar exatamente 2 países
- Visualização lado-a-lado: split screen com dois canvas sincronizados
- Highlight das zonas de sobreposição e zonas exclusivas de cada país
- Métricas comparativas: índice de Jaccard nos clusters, distância média entre centróides

**F6 — Estatísticas**
- Número de dispositivos por país
- Distribuição de clusters por país (gráfico de barras)
- Cobertura semântica: % dos clusters globais que o país toca
- Entropia semântica: quão disperso é o país no espaço (maior = mais diverso)

**F7 — Exportação**
- Exportar seleção como CSV (pontos selecionados com coordenadas 3D e clusters)
- Exportar screenshot do canvas como PNG
- Exportar dados de comparação como JSON

#### 3.6.5 Performance

- **Renderização:** Usar `InstancedMesh` do Three.js para renderizar até 50.000 pontos com boa performance
- **LOD (Level of Detail):** Pontos distantes da câmera são renderizados menores / com menos detalhe
- **Lazy loading:** Carregar dados por país sob demanda via `fetch('/data/countries/{CODE}.json')` — não carregar todos os 50.000 pontos na inicialização
- **Web Workers:** Cálculos de filtragem e estatísticas em thread separada
- **Target:** 60 FPS com até 10.000 pontos visíveis simultaneamente; 30 FPS com 50.000

#### 3.6.6 API — Next.js Route Handlers (Vercel)

A maioria das rotas é resolvida por arquivos JSON estáticos no CDN — sem função serverless. Apenas as rotas que exigem computação ou consulta ao banco são implementadas como Route Handlers.

| Rota | Tipo | Implementação |
|------|------|---------------|
| `GET /data/index.json` | Estático | `public/data/index.json` — CDN |
| `GET /data/clusters.json` | Estático | `public/data/clusters.json` — CDN |
| `GET /data/countries/{CODE}.json` | Estático | `public/data/countries/` — CDN, lazy load |
| `GET /api/search?q=...&country=...` | Route Handler | Query no Neon via `to_tsvector` + filtros opcionais |
| `GET /api/compare?a=BRA&b=USA` | Route Handler | Calcula Jaccard + distâncias a partir dos JSON já carregados no cliente; pode ser client-side |
| `GET /api/stats` | Estático | Gerado pelo M4.5, servido como JSON |

**`GET /api/search` — especificação:**

```
Query params:
  q          string  obrigatório  — termo(s) de busca
  country    string  opcional     — filtrar por ISO alpha-3 (ex: BRA)
  cluster    int     opcional     — filtrar por cluster global
  limit      int     opcional     — máximo de resultados (default: 20, max: 100)

Response 200:
  {
    "query": "freedom of speech",
    "total": 142,
    "results": [
      {
        "id": "USA_1992_Art1",
        "country_code": "USA",
        "country_name": "United States",
        "article_id": "Amendment I",
        "text_snippet": "Congress shall make no law...abridging the freedom of speech",
        "global_cluster": 7,
        "x": 0.12, "y": -0.45, "z": 0.88,
        "rank": 0.98
      }
    ]
  }
```

**Implementação no Neon:**

```sql
SELECT id, country_code, country_name, article_id, text_snippet,
       global_cluster, x, y, z,
       ts_rank(to_tsvector('english', text), query) AS rank
FROM articles, plainto_tsquery('english', $1) query
WHERE to_tsvector('english', text) @@ query
  AND ($2::text IS NULL OR country_code = $2)
  AND ($3::int  IS NULL OR global_cluster = $3)
ORDER BY rank DESC
LIMIT $4;
```

---

## 4. Estrutura de Diretórios do Projeto

```
the-constitutional-atlas/
├── README.md
├── the-constitutional-atlas.prd.md      # Este documento
├── .env.example                         # Template de variáveis de ambiente
│
├── pipeline/                            # Python — execução offline (M1–M4.5)
│   ├── pyproject.toml                   # Dependências Python (uv / pip)
│   ├── src/
│   │   ├── m1_scraper/
│   │   │   ├── __init__.py
│   │   │   ├── scraper.py               # Lógica principal de scraping
│   │   │   ├── url_builder.py           # Construção de URLs do Constitute
│   │   │   ├── parser.py                # Extração de texto das páginas
│   │   │   └── config.py                # Configurações de scraping
│   │   │
│   │   ├── m2_segmenter/
│   │   │   ├── __init__.py
│   │   │   ├── segmenter.py             # Pipeline de segmentação
│   │   │   ├── patterns.py              # Regex patterns por tradição jurídica
│   │   │   ├── validators.py            # Validações de qualidade
│   │   │   └── csv_writer.py            # Exportação para CSV
│   │   │
│   │   ├── m3_embedder/
│   │   │   ├── __init__.py
│   │   │   ├── embedder.py              # Pipeline de embedding
│   │   │   ├── gemini_client.py         # Wrapper da API Gemini
│   │   │   ├── batch_processor.py       # Processamento em lotes
│   │   │   └── cache.py                 # Cache de embeddings já calculados
│   │   │
│   │   ├── m4_clusterer/
│   │   │   ├── __init__.py
│   │   │   ├── clusterer.py             # Pipeline UMAP + HDBSCAN
│   │   │   ├── umap_reducer.py          # Configuração UMAP
│   │   │   ├── hdbscan_runner.py        # Configuração HDBSCAN core-SG
│   │   │   ├── country_clusters.py      # Clusterização por país
│   │   │   └── report_generator.py      # Relatório de estatísticas
│   │   │
│   │   ├── m4_5_exporter/
│   │   │   ├── __init__.py
│   │   │   ├── json_writer.py           # Gera index.json, clusters.json e countries/{CODE}.json
│   │   │   ├── neon_ingest.py           # Ingestão no Neon via psycopg2
│   │   │   └── validator.py             # Verifica integridade dos artefatos gerados
│   │   │
│   │   └── shared/
│   │       ├── constants.py             # Constantes compartilhadas
│   │       ├── models.py                # Pydantic models
│   │       └── country_codes.py         # Mapeamento ISO 3166
│   │
│   ├── data/                            # Artefatos intermediários (não versionados)
│   │   ├── raw/                         # M1: textos brutos
│   │   ├── articles/                    # M2: CSVs segmentados
│   │   ├── embeddings/                  # M3: Parquet com vetores
│   │   └── clusters/                    # M4: Parquet com clusters + relatório
│   │
│   ├── scripts/
│   │   ├── run_pipeline.py              # Orquestrador completo (M1 → M4.5)
│   │   ├── run_m1.py
│   │   ├── run_m2.py
│   │   ├── run_m3.py
│   │   ├── run_m4.py
│   │   └── run_m4_5.py                  # Exportar JSON + ingerir no Neon
│   │
│   ├── tests/
│   │   ├── test_scraper.py
│   │   ├── test_segmenter.py
│   │   ├── test_embedder.py
│   │   ├── test_clusterer.py
│   │   └── test_exporter.py
│   │
│   └── notebooks/
│       ├── 01_eda_raw_texts.ipynb
│       ├── 02_segmentation_quality.ipynb
│       ├── 03_embedding_analysis.ipynb
│       └── 04_cluster_exploration.ipynb
│
└── app/                                 # Next.js — deploy na Vercel (M5)
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── .env.local.example               # NEON_DATABASE_URL
    │
    ├── app/                             # Next.js App Router
    │   ├── layout.tsx
    │   ├── page.tsx                     # Página principal
    │   └── api/
    │       ├── search/
    │       │   └── route.ts             # GET /api/search → Neon full-text
    │       └── compare/
    │           └── route.ts             # GET /api/compare → cálculo de similaridade
    │
    ├── components/
    │   ├── WorldMap.tsx                 # Mapa-múndi clicável (react-simple-maps)
    │   ├── Canvas3D.tsx                 # Cena Three.js principal
    │   ├── PointCloud.tsx               # Renderização dos pontos (InstancedMesh)
    │   ├── ControlPanel.tsx             # Painel de controle lateral
    │   ├── DetailPanel.tsx              # Painel de detalhes do ponto selecionado
    │   ├── StatsPanel.tsx               # Painel de estatísticas
    │   ├── SearchPanel.tsx              # Busca full-text (chama /api/search)
    │   └── CompareView.tsx              # Modo comparação (split screen)
    │
    ├── hooks/
    │   ├── useCountryData.ts            # Lazy load de /data/countries/{CODE}.json
    │   ├── useCountrySelection.ts       # Estado de seleção de países
    │   └── usePointInteraction.ts       # Hover / click nos pontos 3D
    │
    ├── stores/
    │   └── appStore.ts                  # Zustand — estado global
    │
    ├── lib/
    │   ├── neon.ts                      # Cliente @neondatabase/serverless
    │   ├── colors.ts                    # Geração de paleta de cores
    │   └── geo.ts                       # Helpers de projeção
    │
    └── public/
        └── data/                        # Gerado pelo M4.5 — servido pelo CDN
            ├── index.json               # Lista de países + metadados
            ├── clusters.json            # Clusters globais
            └── countries/
                ├── BRA.json
                ├── USA.json
                └── ...                  # Um arquivo por país (~193 arquivos)
```

---

## 5. Pipeline de Execução

```bash
# ── PIPELINE (pasta pipeline/) ──────────────────────────────────────────────

# 1. Setup Python
cd pipeline/
cp ../.env.example .env
pip install -e .             # ou: uv sync

# 2. Pipeline completo (M1 → M4.5)
python scripts/run_pipeline.py

# 3. Ou módulo a módulo
python scripts/run_m1.py     # ~1-2h (193 países, rate limited)
python scripts/run_m2.py     # ~5 min
python scripts/run_m3.py     # ~30 min (depende do tier da API Gemini)
python scripts/run_m4.py     # ~10 min
python scripts/run_m4_5.py   # ~5 min (gera JSON estáticos + ingere no Neon)

# ── WEB APP (pasta app/) ─────────────────────────────────────────────────────

# 4. Setup Node
cd ../app/
cp .env.local.example .env.local   # Configurar NEON_DATABASE_URL
npm install

# 5. Desenvolvimento local
npm run dev                  # localhost:3000

# 6. Deploy na Vercel
vercel --prod                # ou push para branch main com integração Vercel
```

> **Nota:** O pipeline (`pipeline/`) e o web app (`app/`) são completamente independentes em runtime. O pipeline escreve em `app/public/data/` e no Neon; depois disso não há dependência entre eles.

---

## 6. Variáveis de Ambiente

### `pipeline/.env` — Pipeline Python (offline, nunca commitado)

```env
# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# Neon — ingestão pelo M4.5
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Scraper
SCRAPER_RATE_LIMIT_SECONDS=2
SCRAPER_MAX_RETRIES=3
SCRAPER_USE_PLAYWRIGHT=false

# Embedder
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSIONS=768
EMBEDDING_TASK_TYPE=RETRIEVAL_DOCUMENT
EMBEDDING_BATCH_SIZE=100
EMBEDDING_MAX_RPM=1500

# Clusterer
UMAP_N_NEIGHBORS_CLUSTER=30
UMAP_N_NEIGHBORS_VIZ=15
UMAP_MIN_DIST_CLUSTER=0.0
UMAP_MIN_DIST_VIZ=0.1
HDBSCAN_MIN_CLUSTER_SIZE=10
HDBSCAN_MIN_SAMPLES=5
```

### `app/.env.local` — Web App Next.js (desenvolvimento local, nunca commitado)

```env
# Neon — consultas de busca pelo /api/search
# Usar a connection string do Neon com o driver HTTP (@neondatabase/serverless)
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Vercel — Variáveis de ambiente de produção

Configurar no painel da Vercel (Settings → Environment Variables):

| Variável | Escopo | Valor |
|----------|--------|-------|
| `NEON_DATABASE_URL` | Production, Preview | Connection string do Neon |

> **Nota:** O Neon fornece connection strings separadas para acesso direto (pipeline) e HTTP serverless (Next.js Route Handlers via `@neondatabase/serverless`). Usar a **connection string padrão** em ambos — o driver `@neondatabase/serverless` aceita a mesma string e gerencia o protocolo automaticamente.

---

## 7. Métricas de Sucesso

| Métrica | Alvo |
|---------|------|
| Países com texto coletado | ≥ 190 / 193 |
| Países com texto em inglês | ≥ 170 / 193 |
| Dispositivos segmentados (total) | 30.000–50.000 |
| Taxa de noise do HDBSCAN | ≤ 10% |
| Clusters globais identificados | 50–150 |
| FPS da visualização (10k pontos) | ≥ 60 |
| Tempo de resposta do World Map (click → pontos 3D) | ≤ 500ms |
| Tempo de carregamento inicial do viz | ≤ 3 segundos |
| Tempo total do pipeline (end-to-end) | ≤ 4 horas |

---

## 8. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:------------:|:-------:|-----------|
| Constitute Project bloqueia scraping | Alta | Alto | Usar API pública; contatar equipe para acesso acadêmico; fallback para PDFs exportados |
| Textos não-inglês dificultam segmentação | Média | Médio | Traduzir via LLM antes de segmentar; padrões regex multilíngue |
| Rate limit da API Gemini excedido | Média | Baixo | Throttling adaptativo; usar Batch API (50% do custo) |
| UMAP não preserva estrutura em 3D | Baixa | Médio | Testar múltiplos `n_neighbors` e `min_dist`; oferecer opção 2D alternativa |
| Performance do Three.js com 50k pontos | Média | Médio | InstancedMesh + LOD + lazy loading + WebGL2 |
| Mudança de modelo Gemini (deprecation) | Baixa | Médio | Abstrair modelo via interface; re-embed é viável em <1h |
| Mismatch entre ISO codes do TopoJSON e do Constitute Project | Média | Baixo | Mapeamento manual de exceções (ex: Kosovo, Palestina, micro-estados); fallback para seleção via lista textual |
| Cold start do Neon em consultas de busca | Média | Baixo | O driver HTTP `@neondatabase/serverless` elimina o overhead de conexão TCP; latência de cold start do Neon é ~100–300ms — aceitável para busca |
| Tamanho total dos JSON estáticos excede 100MB | Baixa | Médio | Comprimir `text_snippet` para 100 chars; omitir campo `text` dos JSON (disponível apenas via Neon); estimativa atual de ~29MB está dentro do limite |
| Atualização de dados requer re-deploy | Alta | Baixo | Documentado como comportamento esperado em v1; pipeline reprocessa e re-deploya; automação via GitHub Actions em v2 |

---

## 9. Roadmap Futuro (v2+)

- **v1.1:** Rotulagem automática dos clusters via LLM (Gemini/Claude) — gerar nomes semânticos para cada cluster (ex: "Direitos Fundamentais", "Organização do Judiciário")
- **v1.2:** Timeline mode — visualizar como a constituição de um país mudou ao longo das emendas
- **v2.0:** Busca semântica — digitar uma frase e encontrar os dispositivos mais similares de qualquer país
- **v2.1:** Análise de influência — detectar quais constituições são semanticamente mais próximas (genealogia constitucional)
- **v2.2:** Integração com embeddings multilíngues — comparar textos na língua original sem tradução
- **v3.0:** Dashboard analítico completo — heatmap de cobertura sobre o próprio World Map, análise de tendências temporais, índices comparativos

---

## 10. Referências

1. Elkins, Z., Ginsburg, T., & Melton, J. (2014). *Constitute: The world's constitutions to read, search, and compare.* Journal of Web Semantics, 27-28.
2. Google. (2026). *Gemini Embedding 2 Documentation.* https://ai.google.dev/gemini-api/docs/embeddings
3. McInnes, L., Healy, J., & Astels, S. (2017). *hdbscan: Hierarchical density based clustering.* JOSS, 2(11).
4. McInnes, L., Healy, J., & Melville, J. (2018). *UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction.* arXiv:1802.03426.
5. Comparative Constitutions Project. https://comparativeconstitutionsproject.org/
