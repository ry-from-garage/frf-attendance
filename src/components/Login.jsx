import { useState } from 'react'

const VALID_ID = 'fujirock'
const VALID_PW = 'fes2026'

export default function Login({ onLogin }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (id === VALID_ID && pw === VALID_PW) {
      onLogin()
    } else {
      setError('IDまたはパスワードが違います')
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-4 bg-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-xl font-bold text-center mb-1 text-slate-800">勤怠管理</h1>
        <p className="text-sm text-center text-slate-500 mb-6">Fuji Rock Festival 2026</p>

        <label className="block text-sm font-medium text-slate-700 mb-1">ユーザーID</label>
        <input
          type="text"
          value={id}
          onChange={(e) => { setId(e.target.value); setError('') }}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="username"
          autoFocus
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError('') }}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 text-base mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="current-password"
        />

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-base active:bg-blue-700 transition-colors"
        >
          ログイン
        </button>
      </form>
    </div>
  )
}
