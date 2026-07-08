const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "div",
  "span",
  "img",
  "table",
  "tr",
  "td",
  "th",
  "tbody",
  "thead"
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  div: new Set(["style"]),
  span: new Set(["style"]),
  p: new Set(["style"]),
  td: new Set(["style", "colspan", "rowspan"]),
  th: new Set(["style", "colspan", "rowspan"])
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isAllowedAssetUrl(value: string): boolean {
  return value.startsWith("/assets/email-outreach/");
}

/** Lightweight HTML sanitizer for email output — strips scripts and unsafe attributes. */
export function sanitizeEmailHtml(html: string): string {
  if (!html.includes("<")) {
    return `<p>${escapeHtml(html)}</p>`;
  }

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<(\/?)([\w]+)([^>]*)>/g, (match, slash, tagName, attrs) => {
      const tag = tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (slash) return `</${tag}>`;
      const allowed = ALLOWED_ATTRS[tag];
      if (!allowed || !attrs) return `<${tag}>`;
      const safeAttrs: string[] = [];
      const attrRegex = /([\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
      let m: RegExpExecArray | null;
      while ((m = attrRegex.exec(attrs)) !== null) {
        const name = m[1].toLowerCase();
        const value = m[3] ?? m[4] ?? m[5] ?? "";
        if (!allowed.has(name)) continue;
        if (name === "href" || name === "src") {
          if (
            !/^https?:\/\//i.test(value) &&
            !value.startsWith("mailto:") &&
            !isAllowedAssetUrl(value)
          ) {
            continue;
          }
        }
        safeAttrs.push(`${name}="${escapeHtml(value)}"`);
      }
      return safeAttrs.length ? `<${tag} ${safeAttrs.join(" ")}>` : `<${tag}>`;
    });
}

export function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}
