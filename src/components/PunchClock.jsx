import { useState } from 'react'
import { save, load } from '../utils/storage'

export default function PunchClock({ staffList }) {
  const [selected, setSelected] = useState(new Set())
  const [records, setRecords] = useState(() => load('records', []))
  const [toast, setToast] = useState(null)

  const toggle = (name) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === staffList.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(staffList.map((s) => s.name)))
    }
  }

  const punch = (type) => {
    if (selected.size === 0) return
    const now = new Date()
    const ts = now.toISOString()
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    const names = [...selected]
    const newRecords = names.map((name) => ({ name, type, ts, timeStr }))
    const updated = [...records, ...newRecords]
    setRecords(updated)
    save('records', updated)
    setSelected(new Set())
    const label = type === 'start' ? '稼働開始' : '稼働完了'
    showToast(`${names.length}名の${label}を記録しました (${timeStr})`)
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const activeStaff = new Set(
    records
      .filter((r) => r.type === 'start')
      .filter((r) => !records.some((r2) => r2.name === r.name && r2.type === 'end' && r2.ts > r.ts))
      .map((r) => r.name)
  )

  const getLastRecord = (name) => {
    const recs = records.filter((r) => r.name === name)
    return recs.length > 0 ? recs[recs.length - 1] : null
  }

  return (
    <div className="pb-40">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-800">スタッフ選択</h2>
        <button
          onClick={selectAll}
          className="text-sm text-blue-600 font-medium px-3 py-1 rounded-lg active:bg-blue-50"
        >
          {selected.size === staffList.length ? '全解除' : '全選択'}
        </button>
      </div>

      <div className="space-y-1.5">
        {staffList.map((s) => {
          const isActive = activeStaff.has(s.name)
          const last = getLastRecord(s.name)
          return (
            <label
              key={s.name}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                selected.has(s.name)
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(s.name)}
                onChange={() => toggle(s.name)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base">{s.name}</span>
                  {s.role === 'leader' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">L</span>
                  )}
                  {s.role === 'pt' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">PT</span>
                  )}
                </div>
                {last && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {last.type === 'start' ? '開始' : '完了'} {last.timeStr}
                  </p>
                )}
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
            </label>
          )
        })}
      </div>

      {/* bottom-14 = タブバーの高さ分上に配置 */}
      <div className="fixed bottom-14 left-0 right-0 bg-white border-t border-slate-200 p-3 flex gap-3 max-w-lg mx-auto z-40">
        <button
          onClick={() => punch('start')}
          disabled={selected.size === 0}
          className="flex-1 py-4 rounded-xl font-bold text-base text-white bg-green-600 active:bg-green-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors"
        >
          稼働開始
          {selected.size > 0 && <span className="ml-1 text-sm opacity-80">({selected.size}名)</span>}
        </button>
        <button
          onClick={() => punch('end')}
          disabled={selected.size === 0}
          className="flex-1 py-4 rounded-xl font-bold text-base text-white bg-red-500 active:bg-red-600 disabled:bg-slate-300 disabled:text-slate-500 transition-colors"
        >
          稼働完了
          {selected.size > 0 && <span className="ml-1 text-sm opacity-80">({selected.size}名)</span>}
        </button>
      </div>

      {toast && (
        <div className="fixed top-14 left-4 right-4 max-w-lg mx-auto bg-slate-800 text-white text-sm text-center py-3 px-4 rounded-xl shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
