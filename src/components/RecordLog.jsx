import { useState } from 'react'
import { load, save } from '../utils/storage'

export default function RecordLog() {
  const [records, setRecords] = useState(() => load('records', []))

  const grouped = {}
  for (const r of records) {
    if (!grouped[r.name]) grouped[r.name] = []
    grouped[r.name].push(r)
  }

  const exportCSV = () => {
    const header = '名前,種別,時刻\n'
    const rows = records.map((r) => {
      const label = r.type === 'start' ? '開始' : '完了'
      return `${r.name},${label},${r.ts}`
    })
    const csv = header + rows.join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `勤怠記録_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearRecords = () => {
    if (window.confirm('全ての打刻記録を削除しますか？')) {
      save('records', [])
      setRecords([])
    }
  }

  const formatTime = (ts) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-800">打刻履歴</h2>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            disabled={records.length === 0}
            className="text-sm text-blue-600 font-medium px-3 py-1 rounded-lg active:bg-blue-50 disabled:text-slate-400"
          >
            CSV出力
          </button>
          <button
            onClick={clearRecords}
            disabled={records.length === 0}
            className="text-sm text-red-500 font-medium px-3 py-1 rounded-lg active:bg-red-50 disabled:text-slate-400"
          >
            全削除
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center text-slate-400 py-12">打刻記録がありません</div>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([name, recs]) => (
            <div key={name} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="font-medium text-sm mb-2">{name}</div>
              <div className="space-y-1">
                {recs.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.type === 'start'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {r.type === 'start' ? '開始' : '完了'}
                    </span>
                    <span className="text-slate-600">{formatTime(r.ts)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
