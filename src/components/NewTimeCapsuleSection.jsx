import { useState, useEffect } from 'react'

export default function NewTimeCapsuleSection({ settings, currentUser }) {
  const [capsules, setCapsules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', unlockDate: '' })
  const [saving, setSaving] = useState(false)

  const apiBase = import.meta.env.VITE_API_BASE_URL || ''
  const resolvedApiBase = import.meta.env.DEV ? apiBase : (apiBase && apiBase.includes('localhost') ? '' : apiBase)
  const endpoint = `${resolvedApiBase}/api/capsules`

  useEffect(() => {
    fetchCapsules()
  }, [])

  const fetchCapsules = async () => {
    setLoading(true)
    try {
      const res = await fetch(endpoint)
      if (res.ok) {
        const data = await res.json()
        setCapsules(data)
      }
    } catch {
      console.error('Failed to load capsules')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title || !form.message || !form.unlockDate) return

    setSaving(true)
    const token = localStorage.getItem('authToken')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setForm({ title: '', message: '', unlockDate: '' })
        setShowForm(false)
        fetchCapsules()
      }
    } catch {
      console.error('Failed to create capsule')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kapsülü yok etmek istediğinden emin misin?')) return
    const token = localStorage.getItem('authToken')
    try {
      await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchCapsules()
    } catch {
      console.error('Failed to delete')
    }
  }

  const formatCountdown = (targetDate) => {
    const diff = new Date(targetDate) - new Date()
    if (diff <= 0) return 'Açıldı'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    if (days > 0) return `${days} Gün, ${hours} Saat Kaldı`
    const mins = Math.floor((diff / 1000 / 60) % 60)
    return `${hours} Saat, ${mins} Dakika Kaldı`
  }

  // Force re-render countdown every minute
  useEffect(() => {
    const timer = setInterval(() => setCapsules(c => [...c]), 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <header className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl font-serif text-app-text tracking-tight">Zaman Kapsülü</h1>
        <p className="text-app-muted max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Geleceğe mühürlü mektuplar. Günü gelmeden açılamaz, kelimeler zamana emanet edilir.
        </p>
      </header>

      {currentUser && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 border-2 border-app-text bg-transparent text-app-text px-6 py-3 font-semibold text-sm hover:bg-app-text hover:text-app-bg transition-colors uppercase tracking-widest"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {showForm ? 'İptal Et' : 'Yeni Kapsül Mühürle'}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="max-w-2xl mx-auto border border-app-border bg-app-card p-6 sm:p-10 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-app-muted">Mektubun Başlığı</label>
            <input 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
              className="w-full bg-app-bg border border-app-border p-3 text-app-text outline-none focus:border-app-text transition-colors"
              placeholder="Örn: 2028 Yıl Dönümümüze..."
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-app-muted">İçerik (Sır)</label>
            <textarea 
              value={form.message} 
              onChange={e => setForm({...form, message: e.target.value})} 
              className="w-full bg-app-bg border border-app-border p-3 text-app-text outline-none focus:border-app-text transition-colors min-h-[200px] resize-y"
              placeholder="Zamanı gelene kadar kimse göremeyecek..."
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-app-muted">Kilidin Açılacağı Tarih</label>
            <input 
              type="datetime-local"
              value={form.unlockDate} 
              onChange={e => setForm({...form, unlockDate: e.target.value})} 
              className="w-full bg-app-bg border border-app-border p-3 text-app-text outline-none focus:border-app-text transition-colors"
              required 
            />
          </div>
          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-app-text text-app-bg px-8 py-3 font-bold uppercase tracking-widest text-xs hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Mühürleniyor...' : 'Kapsülü Mühürle'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-app-muted text-sm tracking-widest uppercase">Zaman okunuyor...</div>
      ) : capsules.length === 0 ? (
        <div className="text-center text-app-muted text-sm py-12 border border-dashed border-app-border max-w-2xl mx-auto">
          Henüz geleceğe bırakılmış bir mühür yok.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {capsules.map(capsule => {
            const isLocked = new Date(capsule.unlockDate).getTime() > Date.now()

            return (
              <div key={capsule._id} className="relative border border-app-border bg-app-card p-6 flex flex-col group transition-all hover:border-app-text/50">
                {/* Author Badge */}
                <div className="absolute top-0 right-0 bg-app-border px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-app-muted">
                  Yazar: {capsule.author}
                </div>

                {isLocked ? (
                  // LOCKED STATE
                  <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-app-muted">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <div>
                      <h3 className="font-serif text-lg text-app-text mb-1">{capsule.title}</h3>
                      <p className="text-xs font-mono text-app-accent tracking-widest">{formatCountdown(capsule.unlockDate)}</p>
                    </div>
                    {currentUser === capsule.author && (
                      <button onClick={() => handleDelete(capsule._id)} className="text-[10px] underline text-red-400 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        Kapsülü İmha Et
                      </button>
                    )}
                  </div>
                ) : (
                  // UNLOCKED STATE
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-start gap-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-app-accent mt-1 flex-shrink-0">
                        <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"></path>
                        <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"></path>
                      </svg>
                      <div>
                        <h3 className="font-serif text-xl text-app-text">{capsule.title}</h3>
                        <p className="text-[10px] text-app-muted uppercase tracking-widest mt-1">Açıldı: {new Date(capsule.unlockDate).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                    <div className="text-sm text-app-text leading-relaxed whitespace-pre-wrap border-l-2 border-app-border pl-4">
                      {capsule.message}
                    </div>
                    {currentUser === capsule.author && (
                      <div className="pt-4 text-right">
                        <button onClick={() => handleDelete(capsule._id)} className="text-[10px] underline text-red-400">
                          Mektubu Yak
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
