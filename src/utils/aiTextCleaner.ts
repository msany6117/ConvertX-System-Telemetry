/**
 * ConvertX AI Text Sanitization Utility
 * Ensures clean, human-readable AI outputs free of markdown wrappers, JSON artifacts,
 * quotes, escape slashes, or delimiter noise.
 */

export function cleanTranslatedText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw.trim();

  // 1. Detect if model returned a JSON wrapper or array
  if (
    (text.startsWith('{') && text.includes('}')) ||
    (text.startsWith('[') && text.includes(']'))
  ) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') {
        text = parsed;
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        if (typeof first === 'string') {
          text = first;
        } else if (first && typeof first === 'object') {
          text =
            first.translation ||
            first.translatedText ||
            first.text ||
            first.target ||
            JSON.stringify(first);
        }
      } else if (parsed && typeof parsed === 'object') {
        text =
          parsed.translation ||
          parsed.translatedText ||
          parsed.target ||
          parsed.result ||
          parsed.text ||
          text;
      }
    } catch {
      // In case of incomplete JSON like `{"translation": "Hello world"` or trailing `}]`
      const match = text.match(/"(?:translation|translatedText|result|text)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
      if (match && match[1]) {
        text = match[1];
      }
    }
  }

  // 2. Remove markdown code fences anywhere at the boundary
  text = text.replace(/^```[a-zA-Z0-9_-]*\s*\n?/i, '').trim();
  text = text.replace(/\n?```[a-zA-Z0-9_-]*\s*$/i, '').trim();
  text = text.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

  // 3. Remove triple quotes (""" or ''')
  text = text.replace(/^"""\s*/, '').replace(/\s*"""$/, '').trim();
  text = text.replace(/^'''\s*/, '').replace(/\s*'''$/, '').trim();

  // 4. Remove common AI prefixes (case-insensitive)
  text = text.replace(/^(?:target\s+)?translation(?:\s*\([^)]*\))?\s*[:\-–—]\s*/i, '');
  text = text.replace(/^(?:here\s+is\s+the\s+translation|here's\s+the\s+translation|translated\s+text)\s*[:\-–—]\s*/i, '');

  // 5. Remove leading or trailing orphan brackets, quotes, slashes, or symbol noise
  // e.g. `"""`, `}]`, `"`, `\`, `/`, `:`, `;`, `|`
  text = text.replace(/^[\s:;\/\\|\[\]\{\}><`"']+/i, '');
  text = text.replace(/[\s:;\/\\|\[\]\{\}><`"']+$/i, '');

  // 6. Handle escaped unicode / slashes / quotes if string contains raw escape sequences
  if (text.includes('\\"') || text.includes('\\n') || text.includes('\\/') || text.includes('\\t')) {
    text = text
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\//g, '/')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');
  }

  // 7. Strip surrounding quotes if the AI wrapped the entire translation in quotes
  if (
    (text.startsWith('"') && text.endsWith('"') && text.length >= 2) ||
    (text.startsWith("'") && text.endsWith("'") && text.length >= 2) ||
    (text.startsWith('“') && text.endsWith('”') && text.length >= 2) ||
    (text.startsWith('«') && text.endsWith('»') && text.length >= 2)
  ) {
    text = text.slice(1, -1).trim();
  }

  // 8. Clean any remaining leading/trailing artifacts again
  text = text.replace(/^"""\s*/, '').replace(/\s*"""$/, '').trim();
  text = text.replace(/^[\s:;\/\\|]+/, '').replace(/[\s:;\/\\|]+$/, '');

  return text.trim();
}
