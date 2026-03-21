export type ExportItem = {
  id: string;
  country_code: string;
  country_name: string;
  article_id: string;
  text_snippet: string;
  full_text?: string;
};

export type ExportFormat = "json" | "csv" | "xml" | "xlsx" | "md" | "html";

export function toJson(items: ExportItem[]): string {
  return JSON.stringify(
    items.map(({full_text, text_snippet, ...rest}) => ({
      ...rest,
      text: full_text ?? text_snippet,
    })),
    null,
    2,
  );
}

export function toCsv(items: ExportItem[]): string {
  const header = "id,country_code,country_name,article_id,text";
  const rows = items.map((item) => {
    const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
    return [
      escape(item.id),
      escape(item.country_code),
      escape(item.country_name),
      escape(item.article_id),
      escape(item.full_text ?? item.text_snippet),
    ].join(",");
  });
  return [header, ...rows].join("\n");
}

export function toXml(items: ExportItem[]): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const segments = items
    .map(
      (item) =>
        `  <segment>\n    <id>${escape(item.id)}</id>\n    <country_code>${escape(item.country_code)}</country_code>\n    <country_name>${escape(item.country_name)}</country_name>\n    <article_id>${escape(item.article_id)}</article_id>\n    <text>${escape(item.full_text ?? item.text_snippet)}</text>\n  </segment>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<results>\n${segments}\n</results>`;
}

export function toMarkdown(items: ExportItem[]): string {
  const byCountry = new Map<string, ExportItem[]>();
  for (const item of items) {
    const key = `${item.country_name}\x00${item.country_code}`;
    if (!byCountry.has(key)) byCountry.set(key, []);
    byCountry.get(key)!.push(item);
  }
  const sections: string[] = [];
  for (const [key, countryItems] of byCountry) {
    const sep = key.indexOf("\x00");
    const country_name = key.slice(0, sep);
    const country_code = key.slice(sep + 1);
    const articles = countryItems.map(
      (item) => `### ${item.article_id}\n\n${item.full_text ?? item.text_snippet}`,
    );
    sections.push(`## ${country_name} (${country_code})\n\n${articles.join("\n\n")}`);
  }
  return sections.join("\n\n");
}

export function toHtml(items: ExportItem[]): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const rows = items
    .map(
      (item) =>
        `    <tr>\n      <td>${esc(item.country_name)} (${esc(item.country_code)})</td>\n      <td>${esc(item.article_id)}</td>\n      <td>${esc(item.full_text ?? item.text_snippet)}</td>\n    </tr>`,
    )
    .join("\n");
  const count = items.length;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Constitutional Atlas — Export</title>
  <style>
    body { font-family: sans-serif; padding: 1.5rem; color: #1e293b; }
    table { border-collapse: collapse; width: 100%; }
    caption { text-align: left; font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem; }
    th { background: #f1f5f9; text-align: left; padding: 0.5rem 0.75rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; vertical-align: top; }
    td:last-child { max-width: 600px; }
  </style>
</head>
<body>
  <table>
    <caption>${count} result${count !== 1 ? "s" : ""}</caption>
    <thead>
      <tr><th>Country</th><th>Article</th><th>Text</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body>
</html>`;
}

export async function toXlsx(items: ExportItem[]): Promise<Uint8Array> {
  const XLSX = await import("xlsx");
  const rows = items.map(({full_text, text_snippet, ...rest}) => ({
    ...rest,
    text: full_text ?? text_snippet,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  return XLSX.write(wb, {type: "array", bookType: "xlsx"}) as Uint8Array;
}

export function triggerDownload(
  content: string | Uint8Array,
  filename: string,
  mimeType: string,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = new Blob([content as any], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
