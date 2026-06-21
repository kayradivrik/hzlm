import { useCallback, useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
// Prod/Vercel'de `localhost` bazına çağrı atmayalım (failed to fetch üretir).
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

function formatDate(value) {
  if (!value) return 'Az Once'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Az Once'
  return date
    .toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()
}

export default function MemoriesSection({ settings }) {
  const initialUserKey = (() => {
    const authUser = localStorage.getItem('authUser')
    if (authUser === 'Hazal' || authUser === 'Kayra') return authUser
    const pending = localStorage.getItem('pendingLoginUser')
    return pending === 'Hazal' ? 'Hazal' : 'Kayra'
  })()

  const [items, setItems] = useState([])
  const [visibleCount, setVisibleCount] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newText, setNewText] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState(initialUserKey)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [editingAuthor, setEditingAuthor] = useState(initialUserKey)
  const [editingImageUrl, setEditingImageUrl] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '')
  const pendingLoginUser = localStorage.getItem('pendingLoginUser') || ''
  const authUser = localStorage.getItem('authUser') || ''
  const isGuestVisitor = !token && pendingLoginUser === 'Guest' && !authUser
  const [showLoginForm, setShowLoginForm] = useState(() => {
    const storedToken = localStorage.getItem('authToken') || ''
    if (storedToken) return false
    if (pendingLoginUser === 'Guest') return false
    // Direct visit or Kayra/hazal avatar selection => show password form
    return pendingLoginUser === 'Kayra' || pendingLoginUser === 'Hazal' || !pendingLoginUser
  })

  const [loginUser, setLoginUser] = useState(initialUserKey)
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const endpoint = useMemo(() => `${resolvedApiBase}/api/memories`, [])
  const uploadEndpoint = useMemo(() => `${resolvedApiBase}/api/uploads/image`, [])
  const loginEndpoint = useMemo(() => `${resolvedApiBase}/api/auth/login`, [])

  const kayraLabel = settings?.kayraName || 'Kayra'
  const HazalLabel = settings?.hazalName || 'Hazal'

  const loadMemories = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error('Anilar getirilemedi.')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err?.message ?? 'Bir hata olustu.')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  const doLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const username = loginUser === 'Hazal' ? 'Hazal' : 'kayra'
      const res = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: loginPassword,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Giris basarisiz.')

      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authUser', data.user)
      localStorage.removeItem('pendingLoginUser')

      const userKey = data.user === 'Hazal' ? 'Hazal' : 'Kayra'
      setToken(data.token)
      setSelectedAuthor(userKey)
      setEditingAuthor(userKey)
      setLoginPassword('')
    } catch (err) {
      setLoginError(err?.message || 'Giris basarisiz.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleImageChange = (file, setImage, setErrorFn) => {
    if (!file) {
      setImage('')
      return
    }
    if (file.size > 1_500_000) {
      setErrorFn('Fotograf en fazla 1.5MB olmali.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImage(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  const uploadToCloudinary = async (imageValue, sessionToken) => {
    if (!imageValue) return ''
    if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) return imageValue
    if (!imageValue.startsWith('data:image/')) return ''

    const res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ imageData: imageValue }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok || !payload?.url) {
      throw new Error(payload?.message || 'Fotograf yuklenemedi.')
    }
    return payload.url
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    const text = newText.trim()
    if (!text) return

    const sessionToken = token || localStorage.getItem('authToken') || ''
    if (!sessionToken) {
      setSubmitError('Önce giriş yapmalısın.')
      setShowLoginForm(true)
      return
    }

    try {
      setSubmitting(true)
      const uploadedImageUrl = await uploadToCloudinary(newImageUrl, sessionToken)

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          text,
          author: selectedAuthor,
          imageUrl: uploadedImageUrl,
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.message || 'Ani eklenemedi.')
      }
      setNewText('')
      setNewImageUrl('')
      await loadMemories()
    } catch (err) {
      setSubmitError(err?.message ?? 'Ani eklenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (item) => {
    setEditingId(item._id)
    setEditingText(item.text)
    setEditingAuthor(item.author === 'Hazal' ? 'Hazal' : 'Kayra')
    setEditingImageUrl(item.imageUrl || '')
    setMenuOpenId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText('')
    setEditingImageUrl('')
  }

  const saveEdit = async () => {
    const text = editingText.trim()
    if (!text || !editingId) return

    const sessionToken = token || localStorage.getItem('authToken') || ''
    if (!sessionToken) {
      setError('Önce giriş yapmalısın.')
      return
    }

    try {
      const uploadedImageUrl = await uploadToCloudinary(editingImageUrl, sessionToken)
      const res = await fetch(`${endpoint}/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          text,
          author: editingAuthor,
          imageUrl: uploadedImageUrl,
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.message || 'Duzenleme basarisiz.')
      }
      cancelEdit()
      await loadMemories()
    } catch (err) {
      setError(err?.message || 'Duzenleme basarisiz.')
    }
  }

  const deleteItem = async (id) => {
    try {
      const sessionToken = token || localStorage.getItem('authToken') || ''
      if (!sessionToken) throw new Error('Önce giriş yapmalısın.')

      const res = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.message || 'Silme basarisiz.')
      }
      setMenuOpenId(null)
      await loadMemories()
    } catch (err) {
      setError(err?.message || 'Silme basarisiz.')
    }
  }

  return (
    <section>
      <header className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-light tracking-tight text-[#eddcff] sm:text-5xl md:text-7xl">Anılarımız</h1>
        <p className="mt-1 text-lg font-light text-gray-700 md:text-xl">Gökyüzünde biriken küçük anlar.</p>
      </header>

      {!isGuestVisitor ? (
        <section className="mb-16">
          <div className="glass-card rounded-[2rem] border border-[#4a454d]/20 p-4 shadow-2xl shadow-[#ffb0c9]/5 transition-all duration-500 focus-within:border-rose-300 sm:p-6">
            {!token ? (
              showLoginForm ? (
                <form onSubmit={doLogin} className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-headline text-2xl text-[#eddcff]">Giriş yap</h3>
                    <p className="mt-1 text-sm text-gray-700">Anı eklemek, düzenlemek ve silmek için giriş gerekli.</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="flex overflow-hidden rounded-full border border-[#4a454d] text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginUser('Kayra')
                          setSelectedAuthor('Kayra')
                        }}
                        className={`px-3 py-1 ${loginUser === 'Kayra' ? 'bg-rose-100 text-rose-600' : 'text-[#cbc4ce]'}`}
                      >
                        {kayraLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginUser('Hazal')
                          setSelectedAuthor('Hazal')
                        }}
                        className={`px-3 py-1 ${loginUser === 'Hazal' ? 'bg-rose-100 text-rose-600' : 'text-[#cbc4ce]'}`}
                      >
                        {HazalLabel}
                      </button>
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-rose-600">Şifre</span>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full rounded-xl border-none bg-[#150629] px-4 py-3 text-[#eddcff] focus:ring-1 focus:ring-[#ffb0c9]/50"
                      placeholder="Şifreni gir"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loginLoading || !loginPassword}
                    className="w-full rounded-full bg-gradient-to-r from-[#ffb0c9] to-[#bc6181] px-8 py-3 font-bold text-[#5c1333] shadow-[0_0_20px_#fda4af] transition-all duration-300 hover:scale-105 disabled:opacity-60"
                  >
                    {loginLoading ? 'Giris yapiliyor...' : 'Giris'}
                  </button>

                  {loginError ? <p className="text-center text-sm text-[#ffb4ab]">{loginError}</p> : null}
                </form>
              ) : (
                <div className="space-y-3 text-center">
                  <h3 className="font-headline text-2xl text-[#eddcff]">Giriş gerekli</h3>
                  <p className="text-sm text-gray-700">Anı eklemek, düzenlemek ve silmek için şifre ile giriş yapmalısın.</p>
                  <button
                    type="button"
                    onClick={() => setShowLoginForm(true)}
                    className="w-full rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-medium text-white/90 transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    Şifre ile giriş
                  </button>
                </div>
              )
            ) : null}
            <form onSubmit={handleAdd}>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="min-h-[120px] w-full resize-none border-none bg-transparent text-lg font-light text-[#eddcff] placeholder:text-[#cbc4ce]/40 focus:outline-none focus:ring-0 sm:text-xl"
                placeholder="Şu an ne hissediyorsun?"
              />

              <div className="mt-4 border-t border-[#4a454d]/20 pt-4">
                <div className="flex flex-wrap items-center gap-3 text-gray-700">
                  <label className="flex cursor-pointer items-center justify-center">
                    <span className="material-symbols-outlined">image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(e.target.files?.[0], setNewImageUrl, setSubmitError)}
                    />
                  </label>
                  <span className="material-symbols-outlined">location_on</span>
                  <span className="material-symbols-outlined">schedule</span>
                  <div className="flex overflow-hidden rounded-full border border-[#4a454d] text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAuthor('Kayra')
                        if (!token) {
                          setLoginUser('Kayra')
                          setShowLoginForm(true)
                        }
                      }}
                      className={`px-3 py-1 ${selectedAuthor === 'Kayra' ? 'bg-rose-100 text-rose-600' : 'text-[#cbc4ce]'}`}
                    >
                      {kayraLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAuthor('Hazal')
                        if (!token) {
                          setLoginUser('Hazal')
                          setShowLoginForm(true)
                        }
                      }}
                      className={`px-3 py-1 ${selectedAuthor === 'Hazal' ? 'bg-rose-100 text-rose-600' : 'text-[#cbc4ce]'}`}
                    >
                      {HazalLabel}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !token || !newText.trim()}
                  className="mt-4 w-full rounded-full bg-gradient-to-r from-[#ffb0c9] to-[#bc6181] px-8 py-3 font-bold text-[#5c1333] shadow-[0_0_20px_#fda4af] transition-all duration-300 hover:scale-105 disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? 'Paylaşılıyor...' : 'Paylaş'}
                </button>
              </div>

              {newImageUrl ? (
                <div className="mt-4 overflow-hidden rounded-2xl">
                  <img src={newImageUrl} alt="Yuklenen fotograf" className="h-52 w-full object-cover" />
                </div>
              ) : null}
            </form>
          </div>
          {submitError ? <p className="mt-3 text-sm text-[#ffb4ab]">{submitError}</p> : null}
        </section>
      ) : null}

      <section className="space-y-12">
        {loading ? <p className="text-sm text-gray-700">Anılar yükleniyor...</p> : null}
        {!loading && error ? <p className="text-sm text-[#ffb4ab]">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="text-sm text-gray-700">Henüz anı yok. İlk anıyı yukarıdan paylaşabilirsin.</p>
        ) : null}

        {!loading && !error && items.length > 0
          ? items.slice(0, visibleCount).map((item) => {
              const authorKey = item.author === 'Hazal' ? 'Hazal' : 'Kayra'
              const authorLabel = authorKey === 'Hazal' ? HazalLabel : kayraLabel
              const dateLabel = formatDate(item.createdAt)
              const accent = authorKey === 'Hazal' ? 'bg-rose-400 text-white' : 'bg-app-accent text-gray-700'

              return (
                <article key={item._id} className="group">
                  <div className="editorial-grid">
                    <div className="col-span-12 hidden pt-2 md:col-span-1 md:flex md:flex-col md:items-center">
                      <div className="h-full w-[2px] bg-gradient-to-b from-[#ffb0c9]/40 to-transparent" />
                      <div className="mt-2 h-3 w-3 rounded-full bg-rose-100 shadow-[0_0_10px_#ffb0c9]" />
                    </div>

                    <div className="col-span-12 md:col-span-11">
                      <div className="glass-card rounded-[2.5rem] border border-[#4a454d]/20 p-8 transition-all duration-500 group-hover:bg-[#322346]/60 md:p-10">
                        <div className="mb-6 flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${accent}`}>
                              {authorLabel[0]}
                            </div>
                            <div>
                              <h3 className="font-headline text-2xl font-light text-rose-600">{authorLabel}</h3>
                              <time className="text-xs uppercase tracking-[0.2em] text-gray-500">{dateLabel}</time>
                            </div>
                          </div>

                          {token ? (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setMenuOpenId((prev) => (prev === item._id ? null : item._id))}
                                className="text-gray-700"
                              >
                                <span className="material-symbols-outlined">more_horiz</span>
                              </button>
                              {menuOpenId === item._id ? (
                                <div className="absolute right-0 top-8 z-20 min-w-28 rounded-lg border border-[#4a454d]/50 bg-[#27183b] p-1 text-sm">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(item)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[#eddcff] hover:bg-gray-100"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Duzenle
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteItem(item._id)}
                                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[#ffb4ab] hover:bg-gray-100"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Sil
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        {editingId === item._id ? (
                          <div className="space-y-3">
                            <div className="flex overflow-hidden rounded-full border border-[#4a454d] text-xs w-fit">
                              <button
                                type="button"
                                onClick={() => setEditingAuthor('Kayra')}
                                className={`px-3 py-1 ${editingAuthor === 'Kayra' ? 'bg-rose-100 text-rose-600' : 'text-[#cbc4ce]'}`}
                              >
                                {kayraLabel}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingAuthor('Hazal')}
                                className={`px-3 py-1 ${editingAuthor === 'Hazal' ? 'bg-rose-100 text-rose-600' : 'text-[#cbc4ce]'}`}
                              >
                                {HazalLabel}
                              </button>
                            </div>
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              rows={4}
                              className="w-full resize-none rounded-xl border-none bg-[#150629] p-3 text-[#eddcff] focus:ring-1 focus:ring-[#ffb0c9]/40"
                            />
                            <div className="flex flex-wrap gap-2">
                              <label className="cursor-pointer rounded-full border border-[#4a454d] px-4 py-2 text-sm text-[#cbc4ce]">
                                Fotograf
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageChange(e.target.files?.[0], setEditingImageUrl, setError)}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={saveEdit}
                                className="rounded-full bg-rose-100 px-5 py-2 text-sm font-semibold text-[#5c1333]"
                              >
                                Kaydet
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded-full border border-[#4a454d] px-5 py-2 text-sm text-[#cbc4ce]"
                              >
                                Vazgec
                              </button>
                            </div>
                            {editingImageUrl ? (
                              <div className="overflow-hidden rounded-2xl">
                                <img src={editingImageUrl} alt="Duzenlenen fotograf" className="h-52 w-full object-cover" />
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <>
                            <p
                              className={`whitespace-pre-wrap break-words text-lg leading-relaxed text-[#cbc4ce] md:text-2xl ${
                                item.imageUrl ? '' : 'italic'
                              }`}
                            >
                              {item.text}
                            </p>
                            {item.imageUrl ? (
                              <div 
                                className="group/image mb-6 mt-6 relative overflow-hidden rounded-2xl cursor-pointer"
                                onClick={() => setSelectedItem(item)}
                              >
                                <img
                                  src={item.imageUrl}
                                  alt="Memory visual"
                                  className="h-64 w-full object-cover opacity-80 transition-all duration-700 group-hover/image:scale-105 group-hover/image:opacity-100"
                                />
                                <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover/image:bg-black/20 flex items-center justify-center">
                                  <span className="opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 font-medium">
                                    <span className="material-symbols-outlined text-[20px]">fullscreen</span>
                                    Büyüt
                                  </span>
                                </div>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })
          : null}
      </section>
      {!loading && !error && items.length > visibleCount && (
        <div className="mt-8 flex justify-center pb-8">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 10)}
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
            
            {selectedItem.imageUrl ? (
              <div className="w-full md:w-1/2 bg-black flex items-center justify-center shrink-0">
                <img 
                  src={selectedItem.imageUrl} 
                  alt="Detail visual" 
                  className="max-h-[45vh] md:max-h-[90vh] w-full object-contain"
                />
              </div>
            ) : null}
            
            <div className={`flex flex-col p-6 sm:p-8 md:p-10 ${selectedItem.imageUrl ? 'w-full md:w-1/2' : 'w-full'} overflow-y-auto max-h-[45vh] md:max-h-[90vh] scrollbar-thin scrollbar-thumb-[#4a454d] scrollbar-track-transparent`}>
              <div className="mb-6 flex items-center gap-4 shrink-0">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg ${selectedItem.author === 'Hazal' ? 'bg-rose-400 text-white' : 'bg-app-accent text-gray-900'}`}>
                  {selectedItem.author === 'Hazal' ? HazalLabel[0] : kayraLabel[0]}
                </div>
                <div>
                  <h3 className="font-headline text-3xl font-light text-rose-600">
                    {selectedItem.author === 'Hazal' ? HazalLabel : kayraLabel}
                  </h3>
                  <time className="text-sm uppercase tracking-[0.2em] text-gray-500">
                    {formatDate(selectedItem.createdAt)}
                  </time>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-[#eddcff] sm:text-xl md:text-2xl font-light">
                {selectedItem.text}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
