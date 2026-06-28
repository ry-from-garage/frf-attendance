import { useState } from 'react'
import { HOUR_LABELS, DAY_LABELS } from '../utils/shiftParser'
import { save } from '../utils/storage'

export default function ShiftView({ staffList, onUpdate }) {
  const [selectedDay, setSelectedDay] = useState(0)
  const [editing, setEditing] = useState(null)

  const toggleSlot = (staffIdx, slot) => {
    const updated = structuredClone(staffList)
    const slots = updated[staffIdx].shifts[selectedDay]
    const idx = slots.indexOf(slot)
    if (idx >= 0) {
      slots.splice(idx, 1)
    } else {
      slots.push(slot)
      slots.sort((a, b) => a - b)
    }
    onUpdate(updated)
    save('staff', updated)
  }

  const totalHours = (staff, day) => staff.shifts[day]?.length || 0

  return (
    <div className="pb-4">
      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {DAY_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => { setSelectedDay(i); setEditing(null) }}
            className={`flex-none px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDay === i
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 active:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {staffList.map((s, si) => {
          const slots = s.shifts[selectedDay] || []
          const hours = totalHours(s, selectedDay)
          const isEditing = editing === si

          return (
            <div key={s.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setEditing(isEditing ? null : si)}
                className="w-full flex items-center justify-between p-3 active:bg-slate-50 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.name}</span>
                  {s.role === 'leader' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">L</span>
                  )}
                  {s.role === 'pt' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">PT</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{hours}h</span>
                  <span className="text-slate-400 text-xs">{isEditing ? '▲' : '▼'}</span>
                </div>
              </button>

              {!isEditing && (
                <div className="px-3 pb-3">
                  <div className="flex flex-wrap gap-0.5">
                    {Array.from({ length: 24 }, (_, i) => (
                      <div
                        key={i}
                        className={`h-5 rounded-sm ${
                          slots.includes(i)
                            ? s.role === 'leader' ? 'bg-green-700' : s.role === 'pt' ? 'bg-sky-400' : 'bg-green-500'
                            : 'bg-slate-100'
                        }`}
                        style={{ width: 'calc((100% - 23 * 2px) / 24)' }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-400">12:00</span>
                    <span className="text-[10px] text-slate-400">0:00</span>
                    <span className="text-[10px] text-slate-400">12:00</span>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: 24 }, (_, i) => {
                      const active = slots.includes(i)
                      return (
                        <button
                          key={i}
                          onClick={() => toggleSlot(si, i)}
                          className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                            active
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                          }`}
                        >
                          {HOUR_LABELS[i].replace(':00', '')}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
