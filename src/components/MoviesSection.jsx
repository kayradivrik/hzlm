import { useCallback, useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('tr-TR')
}

function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function posterOrFallback(url, title) {
  if (url) return url
  const text = encodeURIComponent((title || 'No Poster').slice(0, 22))
  return `https://dummyimage.com/320x480/150629/eddcff&text=${text}`
}

function genreLabel(item) {
  if (Array.isArray(item.genres) && item.genres.length > 0) {
    return item.genres.slice(0, 2).join(' / ')
  }
  return 'Movie Night'
}

const recommendedMovies = [
  {
    imdbId: 'tt0816692',
    title: 'Interstellar',
    genres: 'Sci-Fi, Adventure',
    score: '8.7',
    posterUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBsa8sKbwE4_aFIfzEemajXyelZeb1lUy4zehPYEeOjYDVfobLlNVWt-oTA9V9H0bmwMhg-kWBJw_6aEzUMOJz93XwRKsg72yl3YrdPV5FX9SlEC4hiiRzKudeBfubtpOzTHWP14hvnzB7gCarSZzyXNsO7zbHIdNzpt1tPEVd10GBV_nexBHyAzgsloZ8e2BxZ54q5MFH4ha3VQNpgCp4nUC2soQuP6lAxoGRumoE2XhuGP9OxkLgNFoAndmiMmcsNbaNeLfBsul4-',
  },
  {
    imdbId: 'tt2194499',
    title: 'About Time',
    genres: 'Romance, Fantasy',
    score: '7.8',
    posterUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAs8muR9A6DY5M_952VRFjj2y4nT1jN5x_sp8GGV7JJylpsK7EQNKXMO6pRYVQ6FtSEH0gM7iqPr47oBIdPKXM17sg-n6bX4xHgRndN3CFSefHbp4MwJ2gL3lhkqxwH7r3lTMqc1SMijDEabPP_A1FZV9cbz4ML6EUTBWsK56IFiUnJASFWtmMkUaMcqVktuAErzc9DSUmFT9rl_CUgQOsD240lCgzb1KC8QXdUhuIYT0q_e4ph0DgTq6BNBMKwXEfUOEPxNOOss2NV',
  },
  {
    imdbId: 'tt1375666',
    title: 'Inception',
    genres: 'Action, Sci-Fi',
    score: '8.8',
    posterUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB4sJtHl-ch2xNkr44pBRzXCu5z2wzFBoeTILe5QTt1UD6DO5Pc9-SndZluxEtH-j1vAeWDSwq8QDbj6XVLlXmVuJ0NHRmQ-6lfUKBoYjYYaW_4YEv4O1OJyjzua4tQQ1A1ZYhmcp29vdIHFy_TtgAg3s6855ni9kVOOELfN0KkHt__3ryMDMMv_1mY5DOec-hb0oAszF5cKbHAJ629bUlvl_5nuZ-4cqvOeZMoyJBExQBzx4X4eazx2e6nCVOWyebMWO5jorWp92Qq',
  },
  {
    imdbId: 'tt3783958',
    title: 'La La Land',
    genres: 'Musical, Romance',
    score: '8.0',
    posterUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANEmlSty9Q-ICKZ6QTEbR7AkuscLlicNcJI5tVqTVBUqzDFXVBQ6akNR3981GFSn-6QiwbF7Xjc1MpeHYvNkTfQdhVuMQd6F85hxLtI4kpxQ5DLHm5E1ff3kXhsQ7AV-5UBUc4mwVbTVN4Hncbbs7wXqkEs7O__WDKERewA-kcI84keAFs3280-SK-6r1IXb6Sa8nnaZ8fPtMDvUpvBls25pdZ-8eN5FLWndl0Tt2b-1bz0kbNF0ypsNtIkDMlfxgFiaTSeX529P_I',
  },
]

export default function MoviesSection({ settings }) {
  const [watchlist, setWatchlist] = useState([])
  const [watched, setWatched] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('discover')

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [results, setResults] = useState([])
  const [addingImdbId, setAddingImdbId] = useState('')

  const [updatingId, setUpdatingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [detailMovie, setDetailMovie] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [newComment, setNewComment] = useState('')
  const [commentSending, setCommentSending] = useState(false)

  const token = localStorage.getItem('authToken') || ''
  const endpoint = useMemo(() => `${resolvedApiBase}/api/movies`, [])
  const searchEndpoint = useMemo(() => `${resolvedApiBase}/api/movies/search`, [])

  const HazalName = settings?.hazalName || 'Hazal'
  const kayraName = settings?.kayraName || 'Kayra'
  const allImdbIds = useMemo(() => new Set([...watchlist, ...watched].map((item) => item.imdbId)), [watchlist, watched])

  const loadMovies = useCallback(async () => {
    if (!token) {
      try {
        setLoading(true)
        const [wRes, doneRes] = await Promise.all([fetch(`${endpoint}?status=watchlist`), fetch(`${endpoint}?status=watched`)])
        const wData = await wRes.json().catch(() => [])
        const doneData = await doneRes.json().catch(() => [])
        if (!wRes.ok) throw new Error(wData?.message || 'Izlenecek filmler getirilemedi.')
        if (!doneRes.ok) throw new Error(doneData?.message || 'Izlenen filmler getirilemedi.')
        setWatchlist(Array.isArray(wData) ? wData : [])
        setWatched(Array.isArray(doneData) ? doneData : [])
        setError('')
      } catch (err) {
        setError(err?.message || 'Filmler yuklenemedi.')
      } finally {
        setLoading(false)
      }
      return
    }
    try {
      setLoading(true)
      const [wRes, doneRes] = await Promise.all([
        fetch(`${endpoint}?status=watchlist`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${endpoint}?status=watched`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const wData = await wRes.json().catch(() => [])
      const doneData = await doneRes.json().catch(() => [])
      if (!wRes.ok) throw new Error(wData?.message || 'Izlenecek filmler getirilemedi.')
      if (!doneRes.ok) throw new Error(doneData?.message || 'Izlenen filmler getirilemedi.')
      setWatchlist(Array.isArray(wData) ? wData : [])
      setWatched(Array.isArray(doneData) ? doneData : [])
      setError('')
    } catch (err) {
      setError(err?.message || 'Filmler yuklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [endpoint, token])

  useEffect(() => {
    loadMovies()
  }, [loadMovies])

  useEffect(() => {
    if (detailMovie || detailLoading || detailError) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => document.body.classList.remove('modal-open')
  }, [detailMovie, detailLoading, detailError])

  const onSearch = async (e) => {
    e.preventDefault()
    const text = query.trim()
    if (text.length < 2) return
    setSearching(true)
    setSearchError('')
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(searchEndpoint, { method: 'POST', headers, body: JSON.stringify({ query: text }) })
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error(data?.message || 'IMDb aramasi basarisiz.')
      setResults(Array.isArray(data) ? data : [])
    } catch (err) {
      setSearchError(err?.message || 'IMDb aramasi basarisiz.')
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const addMovie = async (imdbId) => {
    if (!imdbId) return
    if (!token) {
      setSearchError('Filmi eklemek icin giris yapmalisin.')
      return
    }
    setAddingImdbId(imdbId)
    setSearchError('')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imdbId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Film eklenemedi.')
      await loadMovies()
      setResults((prev) =>
        prev.map((item) =>
          item.imdbId === imdbId
            ? {
                ...item,
                alreadyAdded: true,
                existingStatus: 'watchlist',
              }
            : item,
        ),
      )
    } catch (err) {
      setSearchError(err?.message || 'Film eklenemedi.')
    } finally {
      setAddingImdbId('')
    }
  }

  const patchMovie = async (id, payload) => {
    const res = await fetch(`${endpoint}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.message || 'Film guncellenemedi.')
  }

  const moveToWatched = async (id) => {
    if (!id) return
    if (!token) return setError('Bu islem icin giris yapmalisin.')
    setUpdatingId(id)
    try {
      await patchMovie(id, { status: 'watched' })
      await loadMovies()
      if (detailMovie && detailMovie._id === id) setDetailMovie(prev => ({...prev, status: 'watched'}))
    } catch (err) {
      setError(err?.message || 'Film guncellenemedi.')
    } finally {
      setUpdatingId('')
    }
  }

  const moveToWatchlist = async (id) => {
    if (!id) return
    if (!token) return setError('Bu islem icin giris yapmalisin.')
    setUpdatingId(id)
    try {
      await patchMovie(id, { status: 'watchlist' })
      await loadMovies()
      if (detailMovie && detailMovie._id === id) setDetailMovie(prev => ({...prev, status: 'watchlist'}))
    } catch (err) {
      setError(err?.message || 'Film guncellenemedi.')
    } finally {
      setUpdatingId('')
    }
  }

  const setRating = async (id, value) => {
    if (!id) return
    if (!token) return setError('Bu islem icin giris yapmalisin.')
    setUpdatingId(id)
    try {
      await patchMovie(id, { rating: value })
      await loadMovies()
      if (detailMovie && detailMovie._id === id) setDetailMovie(prev => ({...prev, rating: value}))
    } catch (err) {
      setError(err?.message || 'Puan kaydedilemedi.')
    } finally {
      setUpdatingId('')
    }
  }

  const removeMovie = async (id) => {
    if (!id) return
    if (!token) return setError('Bu islem icin giris yapmalisin.')
    setDeletingId(id)
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Film silinemedi.')
      await loadMovies()
    } catch (err) {
      setError(err?.message || 'Film silinemedi.')
    } finally {
      setDeletingId('')
    }
  }

  const openMovieDetail = async (id) => {
    if (!id) return
    setDetailLoading(true)
    setDetailError('')
    setNewComment('')
    try {
      const res = await fetch(`${endpoint}/${id}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Film detayi getirilemedi.')
      setDetailMovie(data)
    } catch (err) {
      setDetailError(err?.message || 'Film detayi getirilemedi.')
      setDetailMovie(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeMovieDetail = () => {
    setDetailMovie(null)
    setDetailError('')
    setNewComment('')
  }

  const submitComment = async () => {
    const text = newComment.trim()
    if (!detailMovie?._id || !text) return
    if (!token) return setDetailError('Yorum yapmak icin giris yapmalisin.')
    setCommentSending(true)
    setDetailError('')
    try {
      const res = await fetch(`${endpoint}/${detailMovie._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Yorum eklenemedi.')
      setDetailMovie(data)
      setNewComment('')
      await loadMovies()
    } catch (err) {
      setDetailError(err?.message || 'Yorum eklenemedi.')
    } finally {
      setCommentSending(false)
    }
  }

  const visibleMovies = activeTab === 'watchlist' ? watchlist : activeTab === 'watched' ? watched : []

  return (
    <section className="relative z-10 pb-12">
      <header className="mb-8 flex flex-col items-center text-center">
        <h2 className="font-headline text-4xl sm:text-5xl font-medium text-[#eddcff] mb-2">Film Gecesi</h2>
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-500">Our Cinematic Journey</p>
      </header>

      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-full bg-[#150629]/80 border border-[#4a454d]/30 p-1.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`rounded-full px-6 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'discover'
                ? 'bg-gradient-to-r from-rose-100 to-gray-100 text-[#150629] shadow-[0_0_15px_#fda4af]'
                : 'text-gray-700 hover:text-rose-600'
            }`}
          >
            Keşfet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('watchlist')}
            className={`rounded-full px-6 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'watchlist'
                ? 'bg-gradient-to-r from-rose-100 to-gray-100 text-[#150629] shadow-[0_0_15px_#fda4af]'
                : 'text-gray-700 hover:text-rose-600'
            }`}
          >
            İzlenecekler
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('watched')}
            className={`rounded-full px-6 py-2 text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'watched'
                ? 'bg-gradient-to-r from-rose-100 to-gray-100 text-[#150629] shadow-[0_0_15px_#fda4af]'
                : 'text-gray-700 hover:text-rose-600'
            }`}
          >
            İzlendi
          </button>
        </div>
      </div>

      {activeTab === 'discover' && (
        <div className="mb-10 max-w-2xl mx-auto">
          <form onSubmit={onSearch} className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-rose-600 transition-colors">
              search
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Interstellar, La La Land..."
              className="w-full rounded-full border border-[#4a454d]/50 bg-[#150629]/80 pl-12 pr-24 py-4 text-sm text-[#eddcff] outline-none focus:border-rose-300 focus:bg-[#1a0b2e] transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={searching || query.trim().length < 2}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-rose-100 hover:bg-rose-100 text-rose-600 px-5 py-2 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {searching ? '...' : 'Ara'}
            </button>
          </form>
          {searchError && <p className="mt-3 text-center text-xs text-[#ffb4ab]">{searchError}</p>}

          {results.length > 0 && (
            <div className="mt-4 max-h-[300px] space-y-2 overflow-auto pr-2 rounded-2xl glass-card p-2 border border-[#4a454d]/30">
              {results.map((item) => (
                <div key={item.imdbId} className="flex items-center gap-4 rounded-xl bg-[#27183b]/40 hover:bg-[#27183b]/80 transition-colors p-2">
                  <img src={posterOrFallback(item.posterUrl, item.title)} alt={item.title} className="h-16 w-12 rounded-md object-cover shadow-md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#eddcff]">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.year || 'Yıl yok'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addMovie(item.imdbId)}
                    disabled={!token || item.alreadyAdded || addingImdbId === item.imdbId}
                    className="rounded-full border border-rose-300 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                  >
                    {!token ? 'Giriş' : item.alreadyAdded ? 'Eklendi' : addingImdbId === item.imdbId ? '...' : 'Listeye Ekle'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'discover' && (
        <section className="mb-8">
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#ffb0c9]/40" />
            <h3 className="font-headline text-xl text-[#ffd9e2] uppercase tracking-widest text-center">Önerilenler</h3>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#ffb0c9]/40" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-5">
            {recommendedMovies.map((movie) => (
              <article key={movie.imdbId} className="group relative flex flex-col gap-2 cursor-pointer">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl sm:rounded-2xl shadow-lg border border-[#4a454d]/20 bg-[#150629]">
                  <img src={movie.posterUrl} alt={`${movie.title} Poster`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                  <div className="absolute top-2 right-2 rounded-md bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-rose-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px] sm:text-[12px]">star</span>
                    {movie.score}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f071a] via-transparent to-transparent opacity-80" />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center backdrop-blur-sm pointer-events-none group-hover:pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); addMovie(movie.imdbId) }}
                      disabled={!token || allImdbIds.has(movie.imdbId) || addingImdbId === movie.imdbId}
                      className="rounded-full bg-rose-100 hover:bg-rose-100 border border-rose-300 px-4 py-2 text-xs font-bold text-rose-600 disabled:opacity-50 transition-all transform scale-90 group-hover:scale-100"
                    >
                      {!token ? 'Giriş Gerekli' : allImdbIds.has(movie.imdbId) ? 'Zaten Listede' : addingImdbId === movie.imdbId ? 'Ekleniyor...' : 'Listeye Ekle'}
                    </button>
                  </div>
                  
                  {/* Mobile Direct Add (Tapping whole card) */}
                  <div className="absolute inset-0 sm:hidden" onClick={() => addMovie(movie.imdbId)} />
                </div>
                <div className="px-1">
                  <h4 className="font-headline text-xs sm:text-sm text-[#eddcff] truncate">{movie.title}</h4>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">{movie.genres}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {loading && <div className="flex justify-center py-10"><p className="text-sm text-gray-700 animate-pulse">Filmler yükleniyor...</p></div>}
      {!loading && error && <p className="text-center text-sm text-[#ffb4ab]">{error}</p>}
      
      {!loading && !error && activeTab !== 'discover' && visibleMovies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-5xl text-[#4a454d]/50 mb-3">movie_filter</span>
          <p className="text-sm text-gray-700">{activeTab === 'watchlist' ? 'İzlenecek listeniz henüz boş.' : 'Henüz izlediğiniz film yok.'}</p>
        </div>
      )}

      {!loading && !error && activeTab !== 'discover' && visibleMovies.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-5">
          {visibleMovies.map((item) => (
            <article key={item._id} className="group relative flex flex-col gap-2">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl sm:rounded-2xl shadow-lg border border-[#4a454d]/20 bg-[#150629]">
                <img
                  src={posterOrFallback(item.posterUrl, item.title)}
                  alt={`${item.title} Poster`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f071a] via-transparent to-transparent opacity-80" />
                <div className="absolute top-2 right-2 rounded-md bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-rose-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px] sm:text-[12px]">star</span>
                  {item.rating ? Number(item.rating).toFixed(1) : item.year || 'N/A'}
                </div>
                
                {/* Hover Overlay (Desktop Only) */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex flex-col items-center justify-center gap-2 p-2 backdrop-blur-sm pointer-events-none group-hover:pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openMovieDetail(item._id) }}
                    className="w-full max-w-[120px] rounded-full bg-white/10 hover:bg-white/20 border border-white/30 py-1.5 text-[10px] sm:text-xs font-semibold text-white transition-colors"
                  >
                    Detay
                  </button>
                  {activeTab === 'watchlist' ? (
                    <button
                      type="button"
                      onClick={() => moveToWatched(item._id)}
                      disabled={!token || updatingId === item._id}
                      className="w-full max-w-[120px] rounded-full bg-rose-100 hover:bg-rose-100 border border-rose-300 py-1.5 text-[10px] sm:text-xs font-semibold text-rose-600 disabled:opacity-50 transition-colors"
                    >
                      İzlendi
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => moveToWatchlist(item._id)}
                        disabled={!token || updatingId === item._id}
                        className="w-full max-w-[120px] rounded-full bg-rose-100 hover:bg-rose-100 border border-rose-300 py-1.5 text-[10px] sm:text-xs font-semibold text-rose-600 disabled:opacity-50 transition-colors"
                      >
                        Geri Al
                      </button>
                      <button
                        type="button"
                        onClick={() => setRating(item._id, item.rating >= 5 ? 0 : (item.rating || 0) + 1)}
                        disabled={!token || updatingId === item._id}
                        className="w-full max-w-[120px] flex items-center justify-center gap-1 rounded-full bg-yellow-400/10 hover:bg-yellow-400/30 border border-yellow-400/30 py-1.5 text-[10px] sm:text-xs font-semibold text-yellow-400 disabled:opacity-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[12px]">star</span>
                        +1
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMovie(item._id)}
                    disabled={!token || deletingId === item._id}
                    className="mt-1 text-[9px] sm:text-[10px] text-[#ffb4ab]/80 hover:text-[#ffb4ab] underline underline-offset-2 disabled:opacity-50"
                  >
                    Kaldır
                  </button>
                </div>

                {/* Mobile Direct Detail Open (Tapping whole card) */}
                <div className="absolute inset-0 sm:hidden" onClick={() => openMovieDetail(item._id)} />
              </div>
              <div className="px-1">
                <h3 className="font-headline text-xs sm:text-sm text-[#eddcff] truncate">{item.title}</h3>
                <p className="text-[9px] sm:text-[10px] text-gray-500 truncate">{genreLabel(item)}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {(detailMovie || detailLoading || detailError) && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-6 sm:items-center animate-in fade-in duration-300">
          <div className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-[#4a454d]/30 bg-gradient-to-b from-[#1a0b2e] to-[#0f071a] p-6 pb-12 sm:p-8 shadow-[0_-20px_60px_rgba(0, 0, 0, 0.15)] sm:shadow-2xl relative">
            <button
              type="button"
              onClick={closeMovieDetail}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 border border-gray-200 text-gray-700 hover:text-white hover:bg-black/80 hover:scale-105 transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {detailLoading && <p className="text-center text-gray-700 py-20 animate-pulse">Detaylar yükleniyor...</p>}
            {!detailLoading && detailError && <p className="text-center text-[#ffb4ab] py-20">{detailError}</p>}
            
            {!detailLoading && detailMovie && (
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mt-4 sm:mt-0">
                <div className="w-44 sm:w-1/3 flex-shrink-0 mx-auto sm:mx-0">
                  <img
                    src={posterOrFallback(detailMovie.posterUrl, detailMovie.title)}
                    alt={detailMovie.title}
                    className="w-full aspect-[2/3] rounded-2xl object-cover shadow-[0_15px_40px_rgba(0, 0, 0, 0.15)] border border-gray-100"
                  />
                </div>
                <div className="w-full sm:w-2/3 flex flex-col">
                  <h4 className="font-headline text-3xl sm:text-5xl font-medium text-[#eddcff] mb-3 text-center sm:text-left leading-tight">
                    {detailMovie.title}
                  </h4>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[10px] sm:text-xs text-gray-500 mb-6 font-semibold uppercase tracking-wider">
                    <span className="bg-white/5 px-3 py-1 rounded-full border border-gray-200">{detailMovie.year || 'N/A'}</span>
                    {detailMovie.runtime && <span className="bg-white/5 px-3 py-1 rounded-full border border-gray-200">{detailMovie.runtime}</span>}
                    {detailMovie.language && <span className="bg-white/5 px-3 py-1 rounded-full border border-gray-200">{detailMovie.language}</span>}
                    <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      {detailMovie.rating || 0}
                    </span>
                  </div>

                  {/* Action Buttons for Mobile/Desktop */}
                  <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start">
                    {detailMovie.status === 'watchlist' ? (
                      <button onClick={() => moveToWatched(detailMovie._id)} disabled={!token || updatingId === detailMovie._id} className="rounded-full bg-rose-100 hover:bg-rose-100 border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-600 transition-colors disabled:opacity-50">
                        İzlendi Olarak İşaretle
                      </button>
                    ) : (
                      <>
                        <button onClick={() => moveToWatchlist(detailMovie._id)} disabled={!token || updatingId === detailMovie._id} className="rounded-full bg-rose-100 hover:bg-rose-100 border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-600 transition-colors disabled:opacity-50">
                          Geri Al (İzlenecekler)
                        </button>
                        <button onClick={() => setRating(detailMovie._id, detailMovie.rating >= 5 ? 0 : (detailMovie.rating || 0) + 1)} disabled={!token || updatingId === detailMovie._id} className="flex items-center gap-1 rounded-full bg-yellow-400/10 hover:bg-yellow-400/30 border border-yellow-400/30 px-4 py-2 text-xs font-semibold text-yellow-400 transition-colors disabled:opacity-50">
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          Değiştir
                        </button>
                      </>
                    )}
                    <button onClick={() => { removeMovie(detailMovie._id); closeMovieDetail() }} disabled={!token || deletingId === detailMovie._id} className="rounded-full bg-[#ffb4ab]/10 hover:bg-[#ffb4ab]/30 border border-[#ffb4ab]/30 px-4 py-2 text-xs font-semibold text-[#ffb4ab] transition-colors disabled:opacity-50">
                      Listeden Kaldır
                    </button>
                  </div>
                  
                  <p className="text-sm sm:text-base text-[#cbc4ce] leading-relaxed mb-8 opacity-90 break-words">
                    {detailMovie.plot || 'Bu film için özet bulunmuyor.'}
                  </p>

                  <div className="mt-auto">
                    <h5 className="mb-4 text-xs uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2">Yorumlar & Notlar</h5>
                    {Array.isArray(detailMovie.comments) && detailMovie.comments.length > 0 ? (
                      <div className="max-h-52 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {detailMovie.comments
                          .slice()
                          .reverse()
                          .map((comment) => (
                            <div key={comment._id || `${comment.author}-${comment.createdAt}`} className="rounded-2xl bg-white/5 border border-gray-100 p-4 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-rose-100" />
                              <div className="flex items-center justify-between text-xs mb-2">
                                <span className="font-bold text-rose-600 tracking-wide">{comment.author}</span>
                                <span className="text-gray-500 text-[10px]">{formatDateTime(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-[#eddcff] opacity-90 leading-relaxed whitespace-pre-wrap break-words">{comment.text}</p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 italic mb-4">Henüz yorum yapılmamış.</p>
                    )}

                    {detailMovie.status === 'watched' ? (
                      <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-[#ffb0c9]/10 to-transparent border border-rose-300 p-4 shadow-[0_0_15px_rgba(255,176,201,0.05)]">
                        <label className="text-xs uppercase tracking-widest text-rose-600 font-bold">Senin Yorumun</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={2}
                            maxLength={1000}
                            placeholder="Bu film hakkındaki düşüncelerin neler?..."
                            className="w-full resize-none rounded-xl border border-gray-200 bg-black/40 p-3 text-sm text-[#eddcff] outline-none focus:border-rose-300 focus:ring-1 focus:ring-[#ffb0c9]/30 transition-all placeholder:text-gray-700"
                          />
                          <button
                            type="button"
                            onClick={submitComment}
                            disabled={!token || commentSending || !newComment.trim()}
                            className="sm:w-28 h-auto sm:h-auto min-h-[50px] flex items-center justify-center rounded-xl bg-gradient-to-b from-[#ffb0c9] to-[#bc6181] px-4 text-sm font-bold text-[#5c1333] disabled:opacity-50 hover:scale-[1.02] transition-all flex-shrink-0 shadow-[0_0_20px_#fda4af]"
                          >
                            {commentSending ? '...' : 'Paylaş'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-[#ffb4ab]/80 p-3 rounded-xl bg-[#ffb4ab]/5 border border-[#ffb4ab]/10 text-center">
                        Yorum yapmak için filmi önce "İzlendi" listesine taşımalısın.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
