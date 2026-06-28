import { useState, useCallback, useEffect } from 'react'
import Login from './components/Login'
import PunchClock from './components/PunchClock'
import ShiftView from './components/ShiftView'
import RecordLog from './components/RecordLog'
import { saveSession, loadSession, clearSession } from './utils/storage'
import { parseShiftExcel } from './utils/shiftParser'
import { loadStaff, saveAllStaff } from './utils/db'

const TABS = [
  { id: 'punch', label: '打刻', icon: '⏱' },
  { id: 'shift', label: 'シフト', icon: '📋' },
  { id: 'log', label: '履歴', icon: '📊' },
]

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!loadSession())
  const [tab, setTab] = useState('punch')
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    if (!loggedIn) return
    loadStaff()
      .then((data) => setStaffList(data))
      .catch((e) => console.error('staff load error:', e))
      .finally(() => setLoading(false))
  }, [loggedIn])

  const handleLogin = useCallback(() => {
    saveSession('ok')
    setLoggedIn(true)
  }, [])

  const handleLogout = useCallback(() => {
    clearSession()
    setLoggedIn(false)
  }, [])

  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError('')
    try {
      const buf = await file.arrayBuffer()
      const parsed = parseShiftExcel(buf)
      const saved = await saveAllStaff(parsed)
      setStaffList(saved)
      setImporting(false)
      setTab('shift')
    } catch (err) {
      setImportError(err.message)
      setImporting(false)
    }
    e.target.value = ''
  }, [])

  const handleStaffUpdate = useCallback((updated) => {
    setStaffList(updated)
  }, [])

  if (!loggedIn) return <Login onLogin={handleLogin} />

  return (
    <div className="min-h-svh flex flex-col max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-base font-bold">勤怠管理</h1>
        <div className="flex items-center gap-2">
          <label className="text-xs bg-blue-500 px-3 py-1.5 rounded-lg active:bg-blue-400 cursor-pointer">
            {importing ? '読込中...' : 'シフト読込'}
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={handleLogout}
            className="text-xs bg-blue-500 px-3 py-1.5 rounded-lg active:bg-blue-400"
          >
            ログアウト
          </button>
        </div>
      </header>

      {importError && (
        <div className="mx-4 mt-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
          読込エラー: {importError}
        </div>
      )}

      <main className="flex-1 p-4">
        {loading ? (
          <div className="text-center text-slate-400 py-12">読込中...</div>
        ) : (
          <>
            {tab === 'punch' && <PunchClock staffList={staffList} />}
            {tab === 'shift' && <ShiftView staffList={staffList} onUpdate={handleStaffUpdate} />}
            {tab === 'log' && <RecordLog staffList={staffList} />}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="max-w-lg mx-auto flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center py-2.5 text-xs font-medium transition-colors ${
                tab === t.id ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <span className="text-lg mb-0.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
