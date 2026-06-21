import { useCallback, useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

const moods = ['Mutlu', 'Yorgun', 'Dalgin', 'Heyecanli', 'Huzurlu']

function formatAgo(value) {
  if (!value) return 'Az once'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Az once'
  const diff = Date.now() - date.getTime()
  const mins = Math.max(1, Math.floor(diff / 60000))
  if (mins < 60) return `${mins} dk once`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} saat once`
  const days = Math.floor(hours / 24)
  return `${days} gun once`
}

export default function ThoughtsSection({ settings, currentUser }) {
  const [items, setItems] = useState([])
  const [visibleCountOther, setVisibleCountOther] = useState(5)
  const [visibleCountMine, setVisibleCountMine] = useState(5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newText, setNewText] = useState('')
  const [newMood, setNewMood] = useState('Mutlu')
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingText, setEditingText] = useState('')
  const [editingMood, setEditingMood] = useState('')

  const endpoint = useMemo(() => `${resolvedApiBase}/api/thoughts`, [])
  const token = localStorage.getItem('authToken') || ''

  const kayraLabel = settings?.kayraName || 'Kayra'
  const HazalLabel = settings?.hazalName || 'Hazal'
  const otherUser = currentUser === 'Kayra' ? 'Hazal' : 'Kayra'
  const otherLabel = otherUser === 'Hazal' ? HazalLabel : kayraLabel

  const loadThoughts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error('Aklindakiler getirilemedi.')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      setError(err?.message || 'Bir hata olustu.')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    loadThoughts()
  }, [loadThoughts])

  const visibleItems = items.filter((item) => item.author === otherUser)
  const myItems = items.filter((item) => item.author === currentUser)

  const onSubmit = async (e) => {
    e.preventDefault()
    const text = newText.trim()
    if (!text || !token) return
    setSending(true)
    setSubmitError('')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, mood: newMood }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.message || 'Paylasim basarisiz.')
      }
      setNewText('')
      setNewMood('Mutlu')
      await loadThoughts()
    } catch (err) {
      setSubmitError(err?.message || 'Paylasim basarisiz.')
    } finally {
      setSending(false)
    }
  }

  const startEdit = (item) => {
    setEditingId(item._id)
    setEditingText(item.text || '')
    setEditingMood(item.mood || '')
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditingText('')
    setEditingMood('')
  }

  const saveEdit = async () => {
    const text = editingText.trim()
    if (!text || !editingId || !token) return
    try {
      const res = await fetch(`${endpoint}/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, mood: editingMood }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.message || 'Duzenleme basarisiz.')
      }
      cancelEdit()
      await loadThoughts()
    } catch (err) {
      setError(err?.message || 'Duzenleme basarisiz.')
    }
  }

  const removeItem = async (id) => {
    if (!id || !token) return
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.message || 'Silme basarisiz.')
      }
      await loadThoughts()
    } catch (err) {
      setError(err?.message || 'Silme basarisiz.')
    }
  }

  return (
    <section className="space-y-8 pb-8">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl font-light tracking-tight text-[#eddcff] sm:text-5xl md:text-7xl">Aklımdakiler</h1>
        <p className="text-base italic text-gray-700 sm:text-xl">{otherLabel}'in o anki duygu ve dusunceleri.</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="xl:col-span-5">
          <div className="glass-card rounded-[2rem] border border-[#4a454d]/15 p-5 shadow-2xl shadow-[#ffb0c9]/5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <span className="material-symbols-outlined text-rose-600">chat</span>
              </div>
              <h3 className="font-headline text-3xl text-[#eddcff]">Yeni Bir Dusunce</h3>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-gray-500">Su Anki Ruh Halin?</label>
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setNewMood(mood)}
                      className={`rounded-full px-3 py-1 text-xs transition ${newMood === mood ? 'bg-rose-100 text-[#5c1333]' : 'bg-gray-100 text-gray-500 hover:bg-app-accent'
                        }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-gray-500">Ne Dusunuyorsun?</label>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  rows={7}
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl border border-[#4a454d]/30 bg-[#150629]/70 p-4 text-sm text-[#eddcff] outline-none focus:border-rose-300 focus:ring-2 focus:ring-[#ffb0c9]/20 sm:text-base"
                  placeholder="Zihninden gecenleri buraya fisilda..."
                />
                <p className="mt-2 text-right text-[10px] text-[#958f98]">{newText.length} / 2000 karakter</p>
              </div>

              <button
                type="submit"
                disabled={sending || !newText.trim()}
                className="w-full rounded-2xl bg-gradient-to-r from-[#ffb0c9] to-[#bc6181] px-6 py-3 font-bold text-[#5c1333] shadow-[0_0_20px_rgba(255,176,201,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? 'Paylasiliyor...' : 'Paylas'}
              </button>
            </form>
            {submitError ? <p className="mt-3 text-sm text-[#ffb4ab]">{submitError}</p> : null}
          </div>
        </section>

        <section className="space-y-4 xl:col-span-7">
          <div className="flex items-center justify-between border-b border-[#4a454d]/20 pb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-700">history</span>
              <h4 className="font-headline text-2xl text-[#eddcff]">Gecmisten Esintiler</h4>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Son yazilar</span>
          </div>

          {loading ? <p className="text-sm text-gray-700">Notlar yukleniyor...</p> : null}
          {!loading && error ? <p className="text-sm text-[#ffb4ab]">{error}</p> : null}
          {!loading && !error && visibleItems.length === 0 ? (
            <p className="text-sm text-gray-700">Henuz goruntulenecek bir not yok.</p>
          ) : null}

          {!loading && !error
            ? visibleItems.slice(0, visibleCountOther).map((item) => (
              <article key={item._id} className="relative pl-5">
                <span className="absolute left-0 top-7 h-2.5 w-2.5 rounded-full border border-[#4a454d] bg-[#322346]" />
                <span className="absolute left-[4px] top-10 h-[calc(100%-20px)] w-[1px] bg-[#4a454d]/30" />
                <div className="glass-card rounded-[2rem] border border-[#4a454d]/10 p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-app-accent text-sm font-bold text-[#eddcff]">
                        {otherLabel.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-headline text-xl text-rose-600">{otherLabel}</h5>
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">{formatAgo(item.createdAt)}</p>
                      </div>
                    </div>
                    {item.mood ? <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] text-rose-600">{item.mood}</span> : null}
                  </div>
                  <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-[#cbc4ce] sm:text-lg">{item.text}</p>
                </div>
              </article>
            ))
            : null}

          {!loading && !error && visibleItems.length > visibleCountOther && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCountOther((prev) => prev + 5)}
                className="rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-white/10 hover:text-white transition-all shadow-md"
              >
                Daha Fazla Göster
              </button>
            </div>
          )}
        </section>
      </div>

      <section className="space-y-4 pt-2">
        <h4 className="font-headline text-2xl text-[#eddcff]">Benim Notlarim</h4>
        {myItems.length === 0 ? <p className="text-sm text-gray-700">Henuz kendi notun yok.</p> : null}
        {myItems.slice(0, visibleCountMine).map((item) => (
          <article key={item._id} className="glass-card rounded-3xl border border-[#4a454d]/15 p-5 sm:p-6">
            {editingId === item._id ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setEditingMood(mood)}
                      className={`rounded-full px-3 py-1 text-xs ${editingMood === mood ? 'bg-rose-100 text-[#5c1333]' : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
                <textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[#4a454d]/30 bg-[#150629]/60 p-3 text-[#eddcff] outline-none focus:border-rose-300"
                />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={saveEdit} className="rounded-full bg-rose-100 px-5 py-2 text-sm font-semibold text-[#5c1333]">
                    Kaydet
                  </button>
                  <button type="button" onClick={cancelEdit} className="rounded-full border border-[#4a454d] px-5 py-2 text-sm text-[#cbc4ce]">
                    Vazgec
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-600">{item.mood || 'Not'}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-gray-500">{formatAgo(item.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => startEdit(item)} className="rounded-lg p-2 text-gray-700 hover:bg-gray-100">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button type="button" onClick={() => removeItem(item._id)} className="rounded-lg p-2 text-[#ffb4ab] hover:bg-gray-100">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap break-words text-[#cbc4ce]">{item.text}</p>
              </div>
            )}
          </article>
        ))}

        {myItems.length > visibleCountMine && (
          <div className="mt-6 flex justify-center pb-4">
            <button
              type="button"
              onClick={() => setVisibleCountMine((prev) => prev + 5)}
              className="rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-white/10 hover:text-white transition-all shadow-md"
            >
              Daha Fazla Göster
            </button>
          </div>
        )}
      </section>
    </section>
  )
}
