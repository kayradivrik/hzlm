import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

function formatDate(value) {
  if (!value) return 'Az Once'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Az Once'
  return date.toLocaleDateString('tr-TR')
}

export default function GallerySection({ settings }) {
  const [items, setItems] = useState([])
  const [visibleCount, setVisibleCount] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newCaption, setNewCaption] = useState('')
  const [newImageData, setNewImageData] = useState('')
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const fileInputRef = useRef(null)
  const endpoint = useMemo(() => `${resolvedApiBase}/api/gallery`, [])
  const uploadEndpoint = useMemo(() => `${resolvedApiBase}/api/uploads/image`, [])
  const token = localStorage.getItem('authToken') || ''
  const currentUser = localStorage.getItem('authUser') || ''

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error('Galeri yuklenemedi.')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      setError(err?.message || 'Galeri yuklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    load()
  }, [load])

  const onChooseImage = (file) => {
    if (!file) {
      setNewImageData('')
      return
    }
    if (file.size > 1_500_000) {
      setSubmitError('Fotograf en fazla 1.5MB olmali.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setNewImageData(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!newImageData || !token) return
    setSending(true)
    setSubmitError('')
    try {
      const uploadRes = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageData: newImageData }),
      })
      const uploadPayload = await uploadRes.json().catch(() => ({}))
      if (!uploadRes.ok || !uploadPayload?.url) {
        throw new Error(uploadPayload?.message || 'Fotograf yuklenemedi.')
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrl: uploadPayload.url,
          caption: newCaption.trim(),
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.message || 'Galeriye eklenemedi.')

      setNewCaption('')
      setNewImageData('')
      await load()
    } catch (err) {
      setSubmitError(err?.message || 'Galeriye eklenemedi.')
    } finally {
      setSending(false)
    }
  }

  const removeItem = async (id) => {
    if (!id || !token) return
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.message || 'Silme basarisiz.')
      await load()
    } catch (err) {
      setError(err?.message || 'Silme basarisiz.')
    }
  }

  const kayraName = settings?.kayraName || 'Kayra'
  const HazalName = settings?.hazalName || 'Hazal'

  return (
    <section className="space-y-8 pb-10">
      <header className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-rose-600">Sonsuzlugun Arsivi</p>
          <h1 className="font-headline text-4xl font-light text-[#eddcff] sm:text-5xl md:text-7xl">Galeri - Sonsuz Anilar</h1>
          <p className="max-w-2xl text-sm text-gray-700 sm:text-lg">
            {kayraName} ve {HazalName} icin saklanan fotograflar.
          </p>
        </div>
        <div className="flex md:pb-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ffb0c9] to-[#bc6181] px-6 py-3 text-sm font-bold text-[#5c1333] shadow-[0_0_20px_rgba(255,176,201,0.25)] transition hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
            Yeni Fotograf Ekle
          </button>
        </div>
      </header>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onChooseImage(e.target.files?.[0])} />

      {newImageData ? (
        <section className="glass-card rounded-3xl border border-[#4a454d]/20 p-4 sm:p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="overflow-hidden rounded-2xl">
              <img src={newImageData} alt="Onizleme" className="h-48 w-full object-cover" />
            </div>
            <textarea
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              rows={3}
              maxLength={300}
              className="w-full resize-none rounded-2xl border border-[#4a454d]/30 bg-[#150629]/60 p-4 text-sm text-[#eddcff] outline-none focus:border-rose-300 focus:ring-2 focus:ring-[#ffb0c9]/20"
              placeholder="Bu fotograf icin kisa bir not..."
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={sending || !newImageData}
                className="rounded-full bg-gradient-to-r from-[#ffb0c9] to-[#bc6181] px-6 py-3 font-bold text-[#5c1333] shadow-[0_0_20px_rgba(255,176,201,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? 'Yukleniyor...' : 'Galeriye Ekle'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewImageData('')
                  setNewCaption('')
                  setSubmitError('')
                }}
                className="rounded-full border border-[#4a454d]/40 px-5 py-2 text-sm text-gray-700 hover:bg-gray-100/40"
              >
                Vazgec
              </button>
            </div>
            {submitError ? <p className="text-sm text-[#ffb4ab]">{submitError}</p> : null}
          </form>
        </section>
      ) : null}

      {loading ? <p className="text-sm text-gray-700">Galeri yukleniyor...</p> : null}
      {!loading && error ? <p className="text-sm text-[#ffb4ab]">{error}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <div className="glass-card rounded-3xl border border-[#4a454d]/20 p-6 text-sm text-gray-700">
          Galeride henuz fotograf yok. Yukaridan fotograf ekleyebilirsin.
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, visibleCount).map((item) => {
            const authorLabel = item.author === 'Hazal' ? HazalName : kayraName
            const canDelete = currentUser && item.author === currentUser
            return (
              <article key={item._id} className="glass-card group overflow-hidden rounded-2xl border border-[#4a454d]/20">
                <div 
                  className="aspect-[4/5] relative overflow-hidden cursor-pointer group/image"
                  onClick={() => setSelectedItem(item)}
                >
                  <img
                    src={item.imageUrl}
                    alt="Anı fotografi"
                    className="h-full w-full object-cover transition duration-500 group-hover/image:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover/image:bg-black/30 flex items-center justify-center">
                    <span className="opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                      <span className="material-symbols-outlined text-[20px]">fullscreen</span>
                      Büyüt
                    </span>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-rose-100 px-2 py-1 text-[11px] text-rose-600">{authorLabel}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-700">{formatDate(item.createdAt)}</span>
                      {canDelete ? (
                        <button type="button" onClick={() => removeItem(item._id)} className="rounded p-1 text-[#ffb4ab] hover:bg-gray-100">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="line-clamp-2 text-sm text-[#cbc4ce]">{item.caption || 'Fotograf anisi'}</p>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}

      {!loading && !error && items.length > visibleCount && (
        <div className="mt-8 flex justify-center pb-8">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold text-gray-700 hover:bg-white/10 hover:text-white transition-all shadow-lg"
          >
            Daha Fazla Göster
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-[#150629]/90 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          ></div>
          <div className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-[#27183b] shadow-2xl flex flex-col md:flex-row">
            <button 
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60 md:right-6 md:top-6"
              onClick={() => setSelectedItem(null)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="w-full md:w-1/2 bg-black flex items-center justify-center shrink-0">
              <img 
                src={selectedItem.imageUrl} 
                alt="Detail visual" 
                className="max-h-[45vh] md:max-h-[90vh] w-full object-contain"
              />
            </div>
            
            <div className="flex flex-col p-6 sm:p-8 md:p-10 w-full md:w-1/2 overflow-y-auto max-h-[45vh] md:max-h-[90vh] scrollbar-thin scrollbar-thumb-[#4a454d] scrollbar-track-transparent">
              <div className="mb-6 flex items-center gap-4 shrink-0">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg ${selectedItem.author === 'Hazal' ? 'bg-rose-400 text-white' : 'bg-app-accent text-gray-900'}`}>
                  {selectedItem.author === 'Hazal' ? HazalName[0] : kayraName[0]}
                </div>
                <div>
                  <h3 className="font-headline text-3xl font-light text-rose-600">
                    {selectedItem.author === 'Hazal' ? HazalName : kayraName}
                  </h3>
                  <time className="text-sm uppercase tracking-[0.2em] text-gray-500">
                    {formatDate(selectedItem.createdAt)}
                  </time>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-[#eddcff] sm:text-xl md:text-2xl font-light">
                {selectedItem.caption || 'Fotograf anisi'}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
