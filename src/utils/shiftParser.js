import * as XLSX from 'xlsx'

export function parseShiftExcel(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('シートが見つかりません')

  const range = XLSX.utils.decode_range(ws['!ref'])
  const data = []

  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = []
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = ws[addr]
      row.push(cell ? cell.v : null)
    }
    data.push(row)
  }

  return extractShiftData(data)
}

function extractShiftData(rows) {
  const DAYS = 4

  let headerRow = -1
  let nameCol = -1
  let slotStartCol = -1

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const v = rows[r][c]
      if (v === '氏名' || v === 'Name') {
        headerRow = r
        nameCol = c
      }
    }
  }

  if (headerRow === -1) {
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const v = rows[r][c]
        if (typeof v === 'string' && v.includes('Day1')) {
          headerRow = r
          slotStartCol = c
          break
        }
      }
      if (slotStartCol > -1) break
    }
  }

  if (headerRow === -1) throw new Error('ヘッダー行が見つかりません')

  const dayStartCols = []
  for (let c = 0; c < rows[headerRow].length; c++) {
    const v = rows[headerRow][c]
    if (typeof v === 'string' && /Day\d/.test(v)) {
      dayStartCols.push(c)
    }
  }

  if (dayStartCols.length === 0) throw new Error('Day列が見つかりません')
  slotStartCol = dayStartCols[0]

  let slotsPerDay
  if (dayStartCols.length >= 2) {
    slotsPerDay = dayStartCols[1] - dayStartCols[0]
  } else {
    let hourRow = -1
    for (let r = headerRow + 1; r < headerRow + 4; r++) {
      if (r >= rows.length) break
      const v = rows[r]?.[slotStartCol]
      if (v !== null && v !== undefined && !isNaN(Number(v))) {
        hourRow = r
        break
      }
    }
    if (hourRow > -1) {
      let count = 0
      for (let c = slotStartCol; c < rows[hourRow].length; c++) {
        const v = rows[hourRow][c]
        if (v !== null && v !== undefined && !isNaN(Number(v))) count++
        else break
      }
      slotsPerDay = Math.round(count / DAYS)
    } else {
      slotsPerDay = 24
    }
  }

  const is2h = slotsPerDay <= 12

  let hourRow = -1
  for (let r = headerRow + 1; r < headerRow + 4; r++) {
    if (r >= rows.length) break
    const v = rows[r]?.[slotStartCol]
    if (v !== null && v !== undefined && !isNaN(Number(v))) {
      hourRow = r
      break
    }
  }

  const staff = []
  const dataStartRow = (hourRow > -1 ? hourRow : headerRow) + 2

  for (let r = dataStartRow; r < rows.length; r++) {
    const name = rows[r]?.[nameCol]
    if (!name || typeof name !== 'string' || name.trim() === '') continue
    if (name.includes('配置') || name.includes('リーダー') || name.includes('【')) break

    const role = rows[r]?.[nameCol + 1]
    const shifts = {}

    for (let d = 0; d < DAYS; d++) {
      const daySlots = []
      for (let s = 0; s < slotsPerDay; s++) {
        const col = slotStartCol + d * slotsPerDay + s
        const v = rows[r]?.[col]
        if (v === '●' || v === '○' || v === 1 || v === true) {
          if (is2h) {
            daySlots.push(s * 2)
            daySlots.push(s * 2 + 1)
          } else {
            daySlots.push(s)
          }
        }
      }
      shifts[d] = daySlots
    }

    staff.push({
      name: name.trim(),
      role: role === 'L' ? 'leader' : (role === 'PT' ? 'pt' : 'staff'),
      shifts,
    })
  }

  if (staff.length === 0) throw new Error('スタッフデータが見つかりません')
  return staff
}

export const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  const h = (12 + i) % 24
  return `${h}:00`
})

export const DAY_LABELS = [
  '7/23(木)', '7/24(金)', '7/25(土)', '7/26(日)',
]

export const DAY_LABELS_FULL = [
  'Day1: 7/23(木)昼〜24(金)昼',
  'Day2: 7/24(金)昼〜25(土)昼',
  'Day3: 7/25(土)昼〜26(日)昼',
  'Day4: 7/26(日)昼〜27(月)昼',
]
