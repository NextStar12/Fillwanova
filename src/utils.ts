/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Exports JSON arrays into beautifully formatted downloadable Excel-friendly CSV.
 * Includes character BOM (\uFEFF) so Excel immediately opens it in UTF-8 without import wizards.
 */
export function exportToExcelCompatibleCsv(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('Belum ada data untuk diekspor!');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Header row
  csvRows.push(headers.join(','));

  // Body rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape dual quotes and commas
      let cleanVal = val === null || val === undefined ? '' : String(val);
      cleanVal = cleanVal.replace(/"/g, '""');
      if (cleanVal.includes(',') || cleanVal.includes('\n') || cleanVal.includes('"')) {
        return `"${cleanVal}"`;
      }
      return cleanVal;
    });
    csvRows.push(values.join(','));
  }

  const csvString = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
