/**
 * fmtName.js — shared name formatter
 *
 * Converts any raw stored name into a display-ready Title Case string:
 *
 *   "ronson.rodrigues"   → "Ronson Rodrigues"
 *   "divya_menon"        → "Divya Menon"
 *   "SNEHA REDDY"        → "Sneha Reddy"
 *   "john-doe"           → "John Doe"
 *   "alice"              → "Alice"
 *   "—" / null / ""      → "—"
 */
export function fmtName(raw) {
  if (!raw || raw === '—') return '—';

  return raw
    // Replace dots, underscores, hyphens with spaces
    .replace(/[._-]+/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
    // Title-case every word
    .split(' ')
    .map((word) =>
      word.length === 0
        ? ''
        : word[0].toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
}

/** Returns the 1–2 letter initials for avatar display. */
export function fmtInitials(raw) {
  const name = fmtName(raw);
  if (name === '—') return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
