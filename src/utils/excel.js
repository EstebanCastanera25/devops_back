import * as XLSX from 'xlsx'

export function parseExcelBuffer (buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const wsName = wb.SheetNames[0]
  const ws = wb.Sheets[wsName]
  return XLSX.utils.sheet_to_json(ws, { defval: null, raw: false })
}
