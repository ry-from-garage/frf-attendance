import { useState, useCallback, useEffect } from 'react'
import Login from './components/Login'
import PunchClock from './components/PunchClock'
import ShiftView from './components/ShiftView'
import RecordLog from './components/RecordLog'
import { save, load, saveSession, loadSession, clearSession } from './utils/storage'
import { parseShiftExcel } from './utils/shiftParser'

const DEFAULT_STAFF = [
  { name: '岡本 幸史', role: 'leader', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '八木 塁', role: 'leader', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '宮島 嘉久', role: 'leader', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '矢崎', role: 'leader', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '虹音', role: 'leader', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '矢崎 友人', role: 'staff', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '中野 清華', role: 'staff', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '黒田 乃莉', role: 'staff', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '佐藤 聖香', role: 'staff', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '花田 菜々子', role: 'staff', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '山野 千穂', role: 'staff', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: 'プラット レア', role: 'staff', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '竹内 敦也', role: 'staff', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '川手', role: 'staff', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '福田 彩乃', role: 'pt', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '熊代 彩輝子', role: 'pt', shifts: { 0: [], 1: [], 2: [], 3: [] } },
  { name: '小野 稚子', role: 'pt', shifts: { 0: [], 1: [], 2: [], 3: [] } },
]

const TABS = [
  { id: 'punch', label: '打刻', icon: '⏱' },
  { id: 'shift', label: 'シフト', icon: '📋' },
  { id: 'log', label: '履歴', icon: '📊' },
]

function encodeStaff(data) {
  const json = JSON.stringify(data)
  return btoa(unescape(encodeURIComponent(json)))
}

function decodeStaff(encoded) {
  const json = decodeURIComponent(escape(atob(encoded)))
  return JSON.parse(json)
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!loadSession())
  const [tab, setTab] = useState('punch')
  const [staffList, setStaffList] = useState(() => load('staff', DEFAULT_STAFF))
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const hash = location.hash
    if (hash.startsWith('#shifts=')) {
      try {
        const data = decodeStaff(hash.slice(8))
        if (Array.isArray(data) && data.length > 0) {
          setStaffList(data)
          save('staff', data)
          setTab('shift')
          showToast(`${data.length}名のシフトを読み込みました`)
        }
      } catch { /* ignore invalid hash */ }
      history.replaceState(null, '', location.pathname)
    }
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

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
      setStaffList(parsed)
      save('staff', parsed)
      setImporting(false)
      setTab('shift')
    } catch (err) {
      setImportError(err.message)
      setImporting(false)
    }
    e.target.value = ''
  }, [])

  const shareShifts = useCallback(() => {
    const encoded = encodeStaff(staffList)
    const url = `${location.origin}${location.pathname}#shifts=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      showToast('共有リンクをコピーしました')
    }).catch(() => {
      prompt('共有リンク:', url)
    })
  }, [staffList])

  if (!loggedIn) return <Login onLogin={handleLogin} />

  return (
    <div className="min-h-svh flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-base font-bold">勤怠管理</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={shareShifts}
            className="text-xs bg-blue-500 px-3 py-1.5 rounded-lg active:bg-blue-400"
          >
            共有
          </button>
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

      {/* Content */}
      <main className="flex-1 p-4">
        {tab === 'punch' && <PunchClock staffList={staffList} />}
        {tab === 'shift' && <ShiftView staffList={staffList} onUpdate={setStaffList} />}
        {tab === 'log' && <RecordLog />}
      </main>

      {/* Tab Bar */}
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

      {toast && (
        <div className="fixed top-14 left-4 right-4 max-w-lg mx-auto bg-slate-800 text-white text-sm text-center py-3 px-4 rounded-xl shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  )
}
