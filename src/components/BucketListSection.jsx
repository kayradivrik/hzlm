import { useCallback, useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

const categories = ['Gezilecek Yerler', 'Cilginliklar', 'Tatlar', 'Diger']

export default function BucketListSection({ settings }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newText, setNewText] = useState('')
  const [newCategory, setNewCategory] = useState(categories[0])
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [filter, setFilter] = useState('Hepsi')

  const endpoint = useMemo(() => `${resolvedApiBase}/api/bucketlist`, [])
  const token = localStorage.getItem('authToken') || ''

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error('Liste getirilemedi.')
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
    loadItems()
  }, [loadItems])

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
        body: JSON.stringify({ text, category: newCategory }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.message || 'Ekleme basarisiz.')
      }
      setNewText('')
      await loadItems()
    } catch (err) {
      setSubmitError(err?.message || 'Ekleme basarisiz.')
    } finally {
      setSending(false)
    }
  }

  const toggleComplete = async (id, isCompleted) => {
    if (!id || !token) return
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isCompleted }),
      })
      if (!res.ok) throw new Error('Guncellenemedi.')
      await loadItems()
    } catch {
      setError('Durum guncellenemedi.')
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
      await loadItems()
    } catch (err) {
      setError(err?.message || 'Silme basarisiz.')
    }
  }

  const filteredItems = filter === 'Hepsi' ? items : items.filter((item) => item.category === filter)

  const pendingCount = items.filter((item) => !item.isCompleted).length
  const completedCount = items.filter((item) => item.isCompleted).length
  const progress = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100)

  return (
    <section className="space-y-8 pb-10">
      <header className="space-y-3">
        <h1 className="font-headline text-4xl font-light tracking-tight text-[#eddcff] sm:text-5xl md:text-7xl">Hayallerimiz</h1>
        <p className="text-base italic text-gray-700 sm:text-xl">Birlikte yapacagimiz her seyin bucket list'i.</p>
        
        {items.length > 0 && (
          <div className="mt-4 max-w-sm space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Kalan: {pendingCount}</span>
              <span>Tamamlanan: {completedCount} ({progress}%)</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#150629] border border-[#4a454d]/30">
              <div className="h-full bg-gradient-to-r from-[#bc6181] to-[#ffb0c9] transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Sol taraf: Filtreleme ve Liste */}
        <section className="space-y-6 lg:col-span-8">
          <div className="flex flex-wrap gap-2">
            {['Hepsi', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  filter === cat
                    ? 'bg-rose-100 text-[#5c1333] shadow-[0_0_15px_#fda4af]'
                    : 'border border-gray-300 text-gray-700 hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && <p className="text-sm text-gray-700">Liste yukleniyor...</p>}
          {!loading && error && <p className="text-sm text-[#ffb4ab]">{error}</p>}
          {!loading && !error && filteredItems.length === 0 && (
            <div className="rounded-3xl border border-[#4a454d]/20 bg-[#1a0b2e]/60 p-8 text-center glass-card">
              <span className="material-symbols-outlined mb-2 text-4xl text-gray-700">edit_note</span>
              <p className="text-sm text-gray-700">Bu kategoride henuz bir hedef yok.</p>
            </div>
          )}

          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all ${
                  item.isCompleted
                    ? 'border-rose-300 bg-rose-100 opacity-60'
                    : 'border-[#4a454d]/30 bg-[#27183b]/40 hover:border-[#4a454d]/60 glass-card'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    disabled={!token}
                    onClick={() => toggleComplete(item._id, !item.isCompleted)}
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                      item.isCompleted
                        ? 'border-rose-300 bg-rose-100 text-[#5c1333]'
                        : 'border-gray-300 hover:border-rose-300'
                    }`}
                  >
                    {item.isCompleted && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
                  </button>
                  <div>
                    <p className={`text-base sm:text-lg ${item.isCompleted ? 'line-through text-gray-700' : 'text-[#eddcff]'}`}>
                      {item.text}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500">
                      <span className="rounded bg-[#1a0b2e] px-1.5 py-0.5 border border-[#4a454d]/30">{item.category}</span>
                      <span>Ekleyen: {item.author}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pl-10 sm:pl-0">
                  <button
                    disabled={!token}
                    onClick={() => removeItem(item._id)}
                    className="p-1.5 text-[#ffb4ab]/70 hover:text-[#ffb4ab] transition"
                    title="Sil"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sag taraf: Yeni Ekle Formu */}
        <section className="lg:col-span-4">
          <div className="sticky top-6 glass-card rounded-3xl border border-[#4a454d]/15 p-5 sm:p-6 shadow-2xl shadow-[#ffb0c9]/5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <span className="material-symbols-outlined text-rose-600">add_task</span>
              </div>
              <h3 className="font-headline text-2xl text-[#eddcff]">Hedef Ekle</h3>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-gray-500">Kategori</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                        newCategory === cat
                          ? 'bg-rose-100 text-[#5c1333]'
                          : 'bg-[#150629]/60 text-gray-700 hover:bg-gray-100/80 border border-[#4a454d]/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-gray-500">Ne Yapacagiz?</label>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  rows={4}
                  maxLength={300}
                  className="w-full resize-none rounded-xl border border-[#4a454d]/30 bg-[#150629]/70 p-3 text-sm text-[#eddcff] outline-none focus:border-rose-300 focus:ring-1 focus:ring-[#ffb0c9]/20"
                  placeholder="Birlikte gitmek istedigin o sahilkasabasi veya dunya turu rotasi..."
                />
              </div>

              <button
                type="submit"
                disabled={sending || !newText.trim() || !token}
                className="w-full rounded-2xl bg-gradient-to-r from-[#ffb0c9] to-[#bc6181] px-5 py-3 font-bold text-[#5c1333] shadow-[0_0_20px_rgba(255,176,201,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? 'Ekleniyor...' : !token ? 'Erisim Yok' : 'Listeye Ekle'}
              </button>
              {submitError && <p className="mt-2 text-xs text-[#ffb4ab] text-center">{submitError}</p>}
              {!token && <p className="mt-2 text-[10px] text-gray-500 text-center text-balance">Hedef eklemek icin hesaba giris yapmalisin.</p>}
            </form>
          </div>
        </section>
      </div>
    </section>
  )
}
