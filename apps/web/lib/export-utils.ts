import * as XLSX from 'xlsx'

export interface ExportColumn<T> {
  header: string
  accessor: (row: T) => string | number
  width?: number
}

export function exportToExcel<T>({
  data,
  columns,
  filename,
  sheetName = 'Sheet1',
}: {
  data: T[]
  columns: ExportColumn<T>[]
  filename: string
  sheetName?: string
}): void {
  const headers = columns.map((col) => col.header)
  const rows = data.map((row) => columns.map((col) => col.accessor(row)))

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

  worksheet['!cols'] = columns.map((col, i) => {
    if (col.width) return { wch: col.width }
    const headerLen = col.header.length
    const maxDataLen = rows.reduce((max, row) => {
      const val = row[i]
      return Math.max(max, String(val ?? '').length)
    }, 0)
    return { wch: Math.max(headerLen, maxDataLen) + 2 }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
