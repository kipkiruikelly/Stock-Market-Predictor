/**
 * Reusable utility to export structured tabular JSON datasets to CSV formats.
 */
export const exportToCSV = (filename: string, headers: string[], rows: any[][]) => {
  const content = [
    headers.join(','),
    ...rows.map(row => 
      row.map(val => {
        const str = val === null || val === undefined ? '' : String(val);
        // Escape quotes
        const escaped = str.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')
          ? `"${escaped}"`
          : escaped;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
