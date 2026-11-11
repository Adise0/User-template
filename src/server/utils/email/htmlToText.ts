// Builds the plain-text part sent next to every HTML email. Spam filters score an HTML-only email
// worse, and text-only clients show this one instead. Links keep their address ("Reset: https://...")
// so they still work as plain text. Only meant for our own templates, not for arbitrary HTML.
const htmlToText = (html: string): string =>
  html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(
      /<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
      (_match, href: string, text: string) => {
        const label = text.replace(/<[^>]+>/g, "").trim();
        return label && label !== href ? `${label}: ${href}` : href;
      },
    )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, "") // Anything decorative left (eg. &spades;) means nothing in plain text.
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");

export default htmlToText;
