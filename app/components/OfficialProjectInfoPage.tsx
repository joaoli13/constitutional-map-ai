import Image from "next/image";
import Link from "next/link";

import type {OfficialProjectInfoPage as OfficialProjectInfoPageContent} from "@/lib/official-project-info";

type OfficialProjectInfoPageProps = Readonly<{
  page: OfficialProjectInfoPageContent;
}>;

export default function OfficialProjectInfoPage({
  page,
}: OfficialProjectInfoPageProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#f2f5f4_48%,_#f6f1e9_100%)] text-slate-950">
      <section className="border-b border-slate-200/80 bg-white/76">
        <header className="mx-auto flex w-full max-w-[1500px] px-6 pt-6">
          <Link
            href={`/${page.locale}`}
            aria-label="Constitutional Map AI home"
            className="inline-flex text-sm font-semibold tracking-tight text-slate-700 transition hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-700"
          >
            Constitutional Map AI
          </Link>
        </header>

        <div className="mx-auto grid w-full max-w-[1500px] gap-8 px-6 pb-10 pt-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              {page.eyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              {page.summary}
            </p>
            <blockquote className="mt-6 border-l-4 border-emerald-900 bg-emerald-50/80 px-5 py-4 text-base leading-8 text-slate-800">
              {page.officialStatement}
            </blockquote>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/${page.locale}`}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
              >
                {page.primaryCta}
              </Link>
              <a
                href="https://github.com/joaoli13/constitutional-map-ai"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
              >
                {page.secondaryCta}
              </a>
            </div>
          </div>

          <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-[0_22px_70px_rgba(15,23,42,0.18)]">
            <Image
              src="/og-image.png"
              width={1200}
              height={630}
              alt={page.mediaAssets[0]?.alt ?? page.title}
              className="h-auto w-full"
              priority
            />
          </figure>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1300px] px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              {page.datasetSnapshotLabel}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {page.sections.numbersTitle}
            </h2>
          </div>
          <p className="text-sm font-medium text-slate-500">
            {page.dataUpdatedAt}
          </p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {page.metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]"
            >
              <p className="text-sm font-semibold text-slate-500">
                {metric.label}
              </p>
              <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-slate-950">
                {metric.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {metric.note}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/80">
        <div className="mx-auto grid w-full max-w-[1300px] gap-8 px-6 py-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              {page.sections.sourceTitle}
            </p>
            <div className="mt-4 space-y-4 text-base leading-8 text-slate-700">
              {page.sections.sourceBody.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {page.sourceLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              {page.sections.methodologyTitle}
            </p>
            <p className="mt-4 text-base leading-8 text-slate-700">
              {page.sections.methodologyIntro}
            </p>
            <ol className="mt-5 grid gap-3">
              {page.sections.methodologySteps.map((step, index) => (
                <li
                  key={step}
                  className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-7 text-slate-700">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1300px] gap-8 px-6 py-10 lg:grid-cols-2">
        <StatementList
          title={page.sections.whatItIsTitle}
          items={page.sections.whatItIs}
          tone="positive"
        />
        <StatementList
          title={page.sections.whatItIsNotTitle}
          items={page.sections.whatItIsNot}
          tone="negative"
        />
      </section>

      <section className="border-y border-slate-200/80 bg-[#edf5f2]/80">
        <div className="mx-auto w-full max-w-[1300px] px-6 py-10">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-900/70">
              {page.sections.limitationsTitle}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {page.sections.limitations.map((limitation) => (
                <p
                  key={limitation}
                  className="rounded-lg border border-emerald-900/10 bg-white/80 p-4 text-sm leading-7 text-slate-700"
                >
                  {limitation}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1300px] px-6 py-10">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
            {page.sections.mediaTitle}
          </p>
          <p className="mt-4 text-base leading-8 text-slate-700">
            {page.sections.mediaIntro}
          </p>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {page.mediaAssets.map((asset) => (
            <article
              key={asset.href}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
            >
              {asset.type === "image" ? (
                <Image
                  src={asset.href}
                  width={asset.width ?? 1200}
                  height={asset.height ?? 630}
                  alt={asset.alt}
                  className="aspect-[1200/630] w-full object-cover"
                />
              ) : (
                <video
                  controls
                  preload="metadata"
                  poster="/og-image.png"
                  className="aspect-[1200/630] w-full bg-slate-950 object-cover"
                >
                  <source src={asset.href} type="video/mp4" />
                </video>
              )}
              <div className="p-5">
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                  {asset.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {asset.description}
                </p>
                <a
                  href={asset.href}
                  className="mt-4 inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
                >
                  {asset.href}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200/80 bg-white/82">
        <div className="mx-auto grid w-full max-w-[1300px] gap-5 px-6 py-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              {page.sections.contactTitle}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Constitutional Map AI
            </h2>
          </div>
          <div>
            <p className="text-base leading-8 text-slate-700">
              {page.sections.contactBody}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {page.contactLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatementList({
  items,
  title,
  tone,
}: Readonly<{
  items: string[];
  title: string;
  tone: "positive" | "negative";
}>) {
  const markerClass =
    tone === "positive" ? "bg-emerald-800" : "bg-slate-700";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      <ul className="mt-5 grid gap-3">
        {items.map((item) => (
          <li key={item} className="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-3">
            <span className={`mt-2 h-2.5 w-2.5 rounded-full ${markerClass}`} />
            <span className="text-sm leading-7 text-slate-700">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
