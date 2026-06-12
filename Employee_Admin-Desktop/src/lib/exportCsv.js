/**
 * exportCsv.js — thin CSV export utility
 *
 * Usage:
 *   exportCsv('loan_applications', [
 *     { header: 'Applicant',   key: 'name' },
 *     { header: 'Amount (₹)', key: 'amount' },
 *   ], rows);
 *
 * `rows` is an array of objects. Values are pulled using the `key`
 * property (can be a string or a function (row) => value).
 */
export function exportCsv(filename, columns, rows) {
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };

  const header = columns.map((c) => escape(c.header)).join(',');
  const body   = rows.map((row) =>
    columns.map((c) => {
      const val = typeof c.key === 'function' ? c.key(row) : row[c.key];
      return escape(val);
    }).join(',')
  ).join('\r\n');

  const csv  = `${header}\r\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href     = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
