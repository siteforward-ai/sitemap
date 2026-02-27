import { createHash } from 'crypto';

/**
 * Extracts indexable text content from HTML that search engines would see.
 * Strips all scripts, styles, and HTML tags to get pure text content.
 */
export function extractIndexableText(html: string): string {
  let text = '';

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  if (titleMatch) text += titleMatch[1].trim() + '\n';

  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  if (metaDescMatch) text += metaDescMatch[1].trim() + '\n';

  const altMatches = html.matchAll(/alt=["'](.*?)["']/gi);
  for (const match of altMatches) text += match[1].trim() + '\n';

  const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/is);
  if (bodyMatch) {
    const bodyText = bodyMatch[1]
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    text += bodyText;
  }

  return text.trim();
}

export function calculateChecksum(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
