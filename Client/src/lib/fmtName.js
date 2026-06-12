/**
 * fmtName.js — shared name formatter (Client)
 *
 * "ronson.rodrigues" → "Ronson Rodrigues"
 * "divya_menon"      → "Divya Menon"
 * "SNEHA REDDY"      → "Sneha Reddy"
 */
export function fmtName(raw) {
  if (!raw || raw === '—') return '—';
  return raw
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) =>
      word.length === 0 ? '' : word[0].toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
}

export function fmtInitials(raw) {
  const name = fmtName(raw);
  if (name === '—') return '??';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
