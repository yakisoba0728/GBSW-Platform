export interface ExportColumn<T> {
  header: string
  accessor: (row: T) => string | number
  width?: number
}

export async function exportToExcel<T>({
  data,
  columns,
  filename,
  sheetName = 'Sheet1',
}: {
  data: T[]
  columns: ExportColumn<T>[]
  filename: string
  sheetName?: string
}): Promise<void> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  worksheet.columns = columns.map((col) => {
    const rows = data.map((row) => String(col.accessor(row) ?? ''))
    const maxDataLen = rows.reduce((max, val) => Math.max(max, val.length), 0)
    return {
      header: col.header,
      key: col.header,
      width: col.width ?? Math.max(col.header.length, maxDataLen) + 2,
    }
  })

  for (const row of data) {
    const values: Record<string, string | number> = {}
    for (const col of columns) {
      values[col.header] = col.accessor(row)
    }
    worksheet.addRow(values)
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${filename}.xlsx`
  anchor.click()
  URL.revokeObjectURL(url)
}
