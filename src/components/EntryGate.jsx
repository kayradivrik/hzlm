import { useState } from 'react'

export default function EntryGate({ settings, loginEndpoint, onGuestEnter, onLoginSuccess }) {
  const [step, setStep] = useState('choose')
  const [selectedUser, setSelectedUser] = useState('Kayra')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const kayraLabel = settings?.kayraName || 'Kayra'
  const HazalLabel = settings?.hazalName || 'Hazal'
  const selectedLabel = selectedUser === 'Hazal' ? HazalLabel : kayraLabel

  const startPasswordStep = (user) => {
    setSelectedUser(user)
    setPassword('')
    setError('')
    setStep('password')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const username = selectedUser === 'Hazal' ? 'Hazal' : 'kayra'
      const res = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Giriş başarısız.')
      onLoginSuccess(data.user, data.token)
    } catch (err) {
      setError(err?.message || 'Giriş başarısız.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg items-center px-6 py-10">
      {step === 'choose' ? (
        <div className="w-full">
          <header className="mb-12 text-center">
            <h1 className="font-headline text-4xl italic text-app-accent drop-shadow-[0_0_15px_var(--accent-glow)] md:text-5xl">
              Celestial Sanctuary
            </h1>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-app-muted">Sonsuz Bir Yolculuk</p>
          </header>

          <div className="glass-card rounded-[2.5rem] p-10 md:p-14">
            <div className="mb-10 text-center">
              <h2 className="font-headline text-3xl text-app-text">Hoş Geldiniz</h2>
              <div className="mx-auto mt-3 h-[2px] w-12 bg-gradient-to-r from-transparent via-app-accent/40 to-transparent" />
            </div>

            <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              <button
                type="button"
                onClick={() => startPasswordStep('Kayra')}
                className="group flex flex-col items-center gap-4 rounded-3xl bg-app-card border border-app-border p-6 transition-all duration-300 hover:border-app-accent/50 hover:bg-app-accent/5 hover:scale-[1.02] active:scale-95"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-app-border bg-app-bg text-2xl font-semibold text-app-text transition-colors group-hover:border-app-accent group-hover:text-app-accent">
                  K
                </div>
                <span className="font-headline text-xl text-app-text transition-colors group-hover:text-app-accent">{kayraLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => startPasswordStep('Hazal')}
                className="group flex flex-col items-center gap-4 rounded-3xl bg-app-card border border-app-border p-6 transition-all duration-300 hover:border-app-accent/50 hover:bg-app-accent/5 hover:scale-[1.02] active:scale-95"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-app-border bg-app-bg text-2xl font-semibold text-app-text transition-colors group-hover:border-app-accent group-hover:text-app-accent">
                  Z
                </div>
                <span className="font-headline text-xl text-app-text transition-colors group-hover:text-app-accent">{HazalLabel}</span>
              </button>
            </div>

            <div className="flex flex-col items-center gap-6">
              <button
                type="button"
                onClick={onGuestEnter}
                className="group flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-app-muted transition-colors hover:text-app-accent"
              >
                Misafir Olarak Göz At
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <header className="mb-12 text-center">
            <h1 className="font-headline text-4xl italic text-app-accent drop-shadow-[0_0_15px_var(--accent-glow)]">Celestial Sanctuary</h1>
          </header>

          <div className="glass-card w-full rounded-[2.5rem] p-8 md:p-10">
            <div className="mb-6 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-app-border bg-app-bg text-2xl font-semibold text-app-text">
                {selectedUser === 'Hazal' ? 'Z' : 'K'}
              </div>
            </div>

            <h2 className="text-center font-headline text-4xl text-app-text">{selectedLabel}</h2>
            <p className="mb-8 mt-2 text-center text-sm text-app-muted">Lütfen Şifreni Gir</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full px-4 py-4 text-center text-2xl tracking-[0.5em] outline-none placeholder:text-app-muted/30"
                placeholder="••••••••"
              />

              <button
                type="submit"
                disabled={loading || !password}
                className="btn-primary w-full py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>

            {error ? <p className="mt-4 text-center text-sm text-red-400 font-medium">{error}</p> : null}

            <button
              type="button"
              onClick={() => {
                setStep('choose')
                setPassword('')
                setError('')
              }}
              className="group mx-auto mt-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-app-muted transition-colors hover:text-app-accent"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Geri Dön
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
