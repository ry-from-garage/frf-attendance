import { useState, useEffect } from 'react'
import { loadRecords, updateRecord, deleteRecord, clearAllRecords } from '../utils/db'
import { DAY_LABELS, HOUR_LABELS } from '../utils/shiftParser'

export default function RecordLog({ staffList }) {
  const [records, setRecords] = useState([])
  const [editId, setEditId] = useState(null)
  const [editTime, setEditTime] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecords()
      .then(setRecords)
      .catch((e) => console.error('records load error:', e))
      .finally(() => setLoading(false))
  }, [])

  const grouped = {}
  for (const r of records) {
    if (!grouped[r.name]) grouped[r.name] = []
    grouped[r.name].push(r)
  }

  const startEdit = (r) => {
    const d = new Date(r.ts)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    setEditId(r.id)
    setEditTime(val)
  }

  const saveEdit = async () => {
    if (editId === null) return
    const d = new Date(editTime)
    if (isNaN(d.getTime())) return
    const ts = d.toISOString()
    const time_str = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
    try {
      await updateRecord(editId, { ts, time_str })
      setRecords((prev) =>
        prev.map((r) => (r.id === editId ? { ...r, ts, time_str } : r))
      )
      setEditId(null)
    } catch (e) {
      console.error('update error:', e)
    }
  }

  const toggleType = async (r) => {
    const newType = r.type === 'start' ? 'end' : 'start'
    try {
      await updateRecord(r.id, { type: newType })
      setRecords((prev) =>
        prev.map((rec) => (rec.id === r.id ? { ...rec, type: newType } : rec))
      )
    } catch (e) {
      console.error('toggle error:', e)
    }
  }

  const handleDelete = async (r) => {
    if (!window.confirm('この記録を削除しますか？')) return
    try {
      await deleteRecord(r.id)
      setRecords((prev) => prev.filter((rec) => rec.id !== r.id))
      setEditId(null)
    } catch (e) {
      console.error('delete error:', e)
    }
  }

  const exportPunchCSV = () => {
    const header = '名前,種別,日時\n'
    const rows = records.map((r) => {
      const label = r.type === 'start' ? '開始' : '完了'
      return `${r.name},${label},${formatTime(r.ts)}`
    })
    downloadCSV(header + rows.join('\n'), `打刻記録_${todayStr()}.csv`)
  }

  const exportAllCSV = () => {
    let csv = ''
    csv += '【打刻記録】\n'
    csv += '名前,種別,日時\n'
    for (const r of records) {
      csv += `${r.name},${r.type === 'start' ? '開始' : '完了'},${formatTime(r.ts)}\n`
    }
    csv += '\n【シフト予定】\n'
    csv += '名前,役割,' + DAY_LABELS.join(',') + '\n'
    for (const s of (staffList || [])) {
      const role = s.role === 'leader' ? 'L' : s.role === 'pt' ? 'PT' : ''
      const days = [0, 1, 2, 3].map((d) => {
        const slots = s.shifts[d] || []
        if (slots.length === 0) return '-'
        return slots.map((i) => HOUR_LABELS[i]).join(' ')
      })
      csv += `${s.name},${role},${days.join(',')}\n`
    }
    downloadCSV(csv, `全データ_${todayStr()}.csv`)
  }

  const downloadCSV = (csv, filename) => {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const todayStr = () => new Date().toISOString().slice(0, 10)

  const handleClearAll = async () => {
    if (!window.confirm('全ての打刻記録を削除しますか？')) return
    try {
      await clearAllRecords()
      setRecords([])
    } catch (e) {
      console.error('clear error:', e)
    }
  }

  const formatTime = (ts) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  if (loading) return <div className="text-center text-slate-400 py-12">読込中...</div>

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-800">打刻履歴</h2>
        <div className="flex gap-2">
          <button
            onClick={exportAllCSV}
            className="text-sm text-blue-600 font-medium px-3 py-1 rounded-lg active:bg-blue-50"
          >
            全CSV
          </button>
          <button
            onClick={exportPunchCSV}
            disabled={records.length === 0}
            className="text-sm text-blue-600 font-medium px-3 py-1 rounded-lg active:bg-blue-50 disabled:text-slate-400"
          >
            打刻CSV
          </button>
          <button
            onClick={handleClearAll}
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
              <div className="space-y-1.5">
                {recs.map((r) => (
                  <div key={r.id}>
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        onClick={() => toggleType(r)}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          r.type === 'start'
                            ? 'bg-green-100 text-green-700 active:bg-green-200'
                            : 'bg-red-100 text-red-600 active:bg-red-200'
                        }`}
                      >
                        {r.type === 'start' ? '開始' : '完了'}
                      </button>
                      <button
                        onClick={() => startEdit(r)}
                        className="text-slate-600 active:text-blue-600"
                      >
                        {formatTime(r.ts)}
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="ml-auto text-slate-400 active:text-red-500 px-1"
                      >
                        ✕
                      </button>
                    </div>
                    {editId === r.id && (
                      <div className="flex items-center gap-2 mt-1.5 ml-1">
                        <input
                          type="datetime-local"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm flex-1"
                        />
                        <button
                          onClick={saveEdit}
                          className="text-sm text-white bg-blue-600 px-3 py-1.5 rounded-lg active:bg-blue-700"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-sm text-slate-500 px-2 py-1.5"
                        >
                          ✕
                        </button>
                      </div>
                    )}
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
