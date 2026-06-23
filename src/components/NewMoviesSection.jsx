import { useCallback, useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

function posterOrFallback(url, title) {
  if (url) return url
  const text = encodeURIComponent((title || 'No Poster').slice(0, 22))
  return `https://dummyimage.com/320x480/150629/eddcff&text=${text}`
}

const recommendedItems = [
  {
    imdbId: 'tt4422844',
    title: 'La La Land',
    year: '2016',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMzUzNDM2NzM2MV5BMl5BanBnXkFtZTgwNTM3NTg4OTE@._V1_SX300.jpg',
    runtime: '128 min',
    plot: 'Kariyerlerinde çıkış aramaya çalışan bir piyanist ve bir aktris, gelecek hayallerini uzlaştırmaya çalışırken birbirlerine aşık olurlar.',
    type: 'Film',
    isRecommendation: true
  },
  {
    imdbId: 'tt2267968',
    title: 'About Time',
    year: '2013',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTA1ODQ3NTUxNDVeQTJeQWpwZ15BbWU3MDc5MTM5ODE@._V1_SX300.jpg',
    runtime: '123 min',
    plot: '21 yaşına geldiğinde Tim, zamanda yolculuk yapabildiğini ve kendi hayatında olanları değiştirebildiğini keşfeder. Hayatını daha iyi hale getirmek için bir sevgili edinme kararı beklediğinden daha karmaşık çıkacaktır.',
    type: 'Film',
    isRecommendation: true
  },
  {
    imdbId: 'tt0816692',
    title: 'Interstellar',
    year: '2014',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxODAtODA2MC00OTQ5LTliMDgtMzdmNzBhMjY2YWY1XkEyXkFqcGc@._V1_SX300.jpg',
    runtime: '169 min',
    plot: 'Dünya yaşanmaz bir hale geldiğinde, bir grup kaşif insanlığın hayatta kalmasını sağlamak için uzayda bir solucan deliğinden geçerek seyahat eder.',
    type: 'Film',
    isRecommendation: true
  },
  {
    imdbId: 'tt10903336',
    title: 'Normal People',
    year: '2020',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMDM0ODA4MTMtMjcyMC00ZGI0LWEyZTQtY2ZkYmFjZWNkNzM2XkEyXkFqcGc@._V1_SX300.jpg',
    runtime: '30 min',
    plot: "İrlanda'da aynı kasabada yaşayan fakat çok farklı sosyal çevrelerden gelen Marianne ve Connell'ın liseden başlayıp üniversiteye uzanan karmaşık ilişkisini konu alıyor.",
    type: 'Dizi',
    isRecommendation: true
  },
  {
    imdbId: 'tt0108778',
    title: 'Friends',
    year: '1994–2004',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDVkYjU0MzctMWRmZi00NTkxLTgwOWUtMWFjM2I5YWUxOTc4XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_SX300.jpg',
    runtime: '22 min',
    plot: "Manhattan'da yaşayan yirmili yaşlardaki altı arkadaşın hayat, aşk ve kariyer mücadelelerini anlatan efsanevi komedi dizisi.",
    type: 'Dizi',
    isRecommendation: true
  },
  {
    imdbId: 'tt0112462',
    title: 'Before Sunrise',
    year: '1995',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDFiNmM2MjgtMTQ5Ny00ZWQyLWFjY2YtMWQ2ODA2MjcxZjA2XkEyXkFqcGc@._V1_SX300.jpg',
    runtime: '101 min',
    plot: "Avrupa'da bir trende karşılaşan Amerikalı Jesse ve Fransız Celine, Viyana'da inip sabaha kadar birlikte yürüyerek hayat ve aşk üzerine konuşurlar.",
    type: 'Film',
    isRecommendation: true
  }
]

export default function NewMoviesSection({ settings }) {
  const [watchlist, setWatchlist] = useState([])
  const [watched, setWatched] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('watchlist')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [detailMovie, setDetailMovie] = useState(null)
  const [showProviders, setShowProviders] = useState(false)
  
  const token = localStorage.getItem('authToken') || ''
  const endpoint = useMemo(() => `${resolvedApiBase}/api/movies`, [])
  const searchEndpoint = useMemo(() => `${resolvedApiBase}/api/movies/search`, [])

  const loadMovies = useCallback(async () => {
    try {
      setLoading(true)
      const [wRes, doneRes] = await Promise.all([
        fetch(`${endpoint}?status=watchlist`),
        fetch(`${endpoint}?status=watched`)
      ])
      const wData = await wRes.json()
      const doneData = await doneRes.json()
      setWatchlist(Array.isArray(wData) ? wData : [])
      setWatched(Array.isArray(doneData) ? doneData : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    loadMovies()
  }, [loadMovies])

  const onSearch = async (e) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    setSearching(true)
    try {
      const res = await fetch(searchEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      })
      const data = await res.json()
      setResults(data)
    } catch {
      // ignore
    } finally {
      setSearching(false)
    }
  }

  const addMovie = async (imdbId) => {
    if (!token) return alert('Giriş yapmalısın.')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imdbId })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.message || 'Ekleme başarısız.')
      }
      setQuery('')
      setResults([])
      await loadMovies()
      alert('Filme/Dizi başarıyla listene eklendi! 🎉')
    } catch (err) {
      alert(err.message)
    }
  }

  const moveToWatched = async (id) => {
    await fetch(`${endpoint}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'watched' })
    })
    await loadMovies()
  }

  const removeItem = async (id) => {
    if (!window.confirm('Bu filmi listeden kaldırmak istediğine emin misin?')) return
    await fetch(`${endpoint}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    await loadMovies()
  }

  const openMovieDetail = async (id) => {
    try {
      const res = await fetch(`${endpoint}/${id}`)
      if (!res.ok) throw new Error('Film detayları alınamadı.')
      const data = await res.json()
      setDetailMovie(data)
      setShowProviders(false)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="modern-movies-container">
      <style>{`
        .modern-movies-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .movies-header {
          text-align: center;
          margin-bottom: 4rem;
          animation: fadeInUp 0.8s ease-out;
        }

        .movies-header h1 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2.5rem, 8vw, 4rem);
          font-weight: 700;
          color: var(--accent-color);
          margin-bottom: 1rem;
        }

        .movies-header p {
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .search-container {
          max-width: 600px;
          margin: 0 auto 4rem;
          position: relative;
        }

        .search-input {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 2rem;
          padding: 1.25rem 1.5rem;
          padding-left: 3.5rem;
          color: var(--input-text);
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          border-color: var(--accent-color);
          background: var(--input-bg);
          box-shadow: 0 0 0 3px var(--input-focus-ring);
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--modal-bg);
          border: 1px solid var(--card-border);
          border-radius: 1.5rem;
          margin-top: 1rem;
          max-height: 400px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 20px 40px var(--nav-shadow);
        }

        .result-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--card-border);
          cursor: pointer;
          transition: background 0.3s;
        }

        .result-item:hover { background: var(--input-bg); }

        .tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .tab-btn {
          padding: 0.75rem 2rem;
          border-radius: 1.25rem;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          color: var(--text-muted);
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .tab-btn.active {
          background: var(--accent-color);
          color: #ffffff;
          border-color: var(--accent-color);
        }

        .movies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 2rem;
        }

        .movie-card {
          position: relative;
          border-radius: 1.5rem;
          overflow: hidden;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: fadeInUp 0.6s ease-out both;
          cursor: pointer;
        }

        .movie-card:hover {
          transform: translateY(-4px);
          border-color: var(--card-hover-border);
          box-shadow: 0 10px 20px var(--nav-shadow);
        }

        .movie-poster {
          aspect-ratio: 2/3;
          width: 100%;
          object-fit: cover;
        }

        .movie-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, var(--modal-bg) 0%, transparent 80%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 1.5rem;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .movie-card:hover .movie-overlay { opacity: 1; }

        .movie-title {
          color: var(--text-primary);
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .movie-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          flex: 1;
          padding: 0.5rem;
          border-radius: 0.75rem;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--text-primary);
          font-size: 0.8rem;
          font-weight: 600;
          backdrop-filter: blur(5px);
          transition: all 0.3s;
        }

        .action-btn:hover {
          background: var(--accent-color);
          color: #ffffff;
          border-color: var(--accent-color);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: var(--modal-overlay-bg);
          backdrop-filter: blur(10px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .modal-content {
          background: var(--modal-bg);
          border: 1px solid var(--card-border);
          border-radius: 2.25rem;
          width: 100%;
          max-width: 900px;
          position: relative;
          color: var(--text-primary);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
          overflow: hidden;
          padding: 3rem;
        }

        .modal-backdrop-blur {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: blur(20px) brightness(0.2);
          opacity: 0.3;
          pointer-events: none;
          z-index: 1;
        }

        .modal-overlay-gradient {
          position: absolute;
          inset: 0;
          background: rgba(12, 10, 15, 0.85);
          pointer-events: none;
          z-index: 2;
        }

        .modal-content-wrapper {
          position: relative;
          z-index: 10;
          display: flex;
          gap: 2.5rem;
          width: 100%;
        }

        .modal-poster {
          width: 260px;
          border-radius: 1.5rem;
          aspect-ratio: 2/3;
          object-fit: cover;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6);
          flex-shrink: 0;
        }

        .modal-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .modal-close {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.3s;
          z-index: 50;
        }
        .modal-close:hover { color: #ffffff; }

        .providers-list {
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
          margin-top: 1.25rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.25rem;
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .provider-link {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          transition: all 0.2s;
        }

        .provider-link:hover {
          background: var(--accent-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--accent-glow);
        }

        .provider-icon-svg {
          width: 18px;
          height: 18px;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .modern-movies-container { padding-top: 4.5rem; }
          .movies-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
          .modal-content { max-height: 90vh; overflow-y: auto; padding: 2rem 1.5rem; }
          .modal-content-wrapper { flex-direction: column; align-items: center; text-align: center; gap: 1.5rem; }
          .modal-poster { width: 180px; }
          .providers-list { justify-content: center; }
          
          .tabs {
            gap: 0.5rem;
            margin-bottom: 2rem;
          }
          .tab-btn {
            padding: 0.6rem 1.25rem;
            font-size: 0.85rem;
            border-radius: 1rem;
          }
        }

        @media (max-width: 480px) {
          .tabs {
            gap: 0.35rem;
            width: 100%;
          }
          .tab-btn {
            padding: 0.6rem 0.35rem;
            font-size: 0.75rem;
            flex: 1;
            text-align: center;
            white-space: nowrap;
            border-radius: 0.85rem;
          }
        }
      `}</style>

      <header className="movies-header">
        <h1>Film Gecesi</h1>
        <p>Birlikte izlediğimiz ve izleyeceğimiz tüm o güzel hikayeler.</p>
      </header>

      <div className="search-container">
        <form onSubmit={onSearch}>
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-app-muted/50">search</span>
          <input
            className="search-input"
            type="text"
            placeholder="Bir film ara..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>
        {results.length > 0 && (
          <div className="search-results">
            {results.map(item => (
              <div key={item.imdbId} className="result-item" onClick={() => addMovie(item.imdbId)}>
                <img src={posterOrFallback(item.posterUrl, item.title)} className="w-12 h-16 rounded object-cover" />
                <div>
                  <p className="text-app-text font-bold">{item.title}</p>
                  <p className="text-app-muted/60 text-xs">{item.year}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`} onClick={() => setActiveTab('watchlist')}>
          İzlenecekler
        </button>
        <button className={`tab-btn ${activeTab === 'watched' ? 'active' : ''}`} onClick={() => setActiveTab('watched')}>
          İzlenenler
        </button>
        <button className={`tab-btn ${activeTab === 'recommended' ? 'active' : ''}`} onClick={() => setActiveTab('recommended')}>
          Önerilerimiz
        </button>
      </div>

      <div className="movies-grid">
        {activeTab === 'recommended' ? (
          recommendedItems.map((movie, index) => (
            <div key={movie.imdbId} className="movie-card" style={{ animationDelay: `${index * 0.05}s` }} onClick={() => setDetailMovie(movie)}>
              <img src={posterOrFallback(movie.posterUrl, movie.title)} className="movie-poster" alt={movie.title} />
              <div className="movie-overlay">
                <h3 className="movie-title">{movie.title}</h3>
                <span className="text-[10px] bg-app-accent/20 text-app-accent font-bold uppercase tracking-wider px-2 py-0.5 rounded w-fit mb-3">{movie.type}</span>
                <div className="movie-actions">
                  <button className="action-btn" onClick={(e) => { e.stopPropagation(); addMovie(movie.imdbId); }}>Ekle</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          (activeTab === 'watchlist' ? watchlist : watched).map((movie, index) => (
            <div key={movie._id} className="movie-card" style={{ animationDelay: `${index * 0.05}s` }} onClick={() => openMovieDetail(movie._id)}>
              <img src={posterOrFallback(movie.posterUrl, movie.title)} className="movie-poster" alt={movie.title} />
              <div className="movie-overlay">
                <h3 className="movie-title">{movie.title}</h3>
                <div className="movie-actions">
                  {activeTab === 'watchlist' && (
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); moveToWatched(movie._id); }}>İzlendi</button>
                  )}
                  <button className="action-btn" onClick={(e) => { e.stopPropagation(); removeItem(movie._id); }}>Sil</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {detailMovie && (
        <div className="modal-overlay" onClick={() => { setDetailMovie(null); setShowProviders(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-backdrop-blur" style={{ backgroundImage: `url(${detailMovie.posterUrl})` }}></div>
            <div className="modal-overlay-gradient"></div>
            
            <span className="material-symbols-outlined modal-close" onClick={() => { setDetailMovie(null); setShowProviders(false); }}>close</span>
            
            <div className="modal-content-wrapper">
              <img src={posterOrFallback(detailMovie.posterUrl, detailMovie.title)} className="modal-poster" alt="Poster" />
              <div className="modal-details">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">{detailMovie.title}</h2>
                <div className="flex items-center flex-wrap gap-2.5 text-xs uppercase font-bold tracking-widest text-stone-300 mb-4">
                  <span className="px-2 py-0.5 bg-white/10 text-white rounded">{detailMovie.year}</span>
                  <span>•</span>
                  <span>{detailMovie.runtime || 'N/A'}</span>
                  {detailMovie.genres && detailMovie.genres.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="px-2.5 py-0.5 border border-white/20 rounded-full text-stone-300">{detailMovie.genres.join(', ')}</span>
                    </>
                  )}
                </div>
                <p className="text-white/80 leading-relaxed mb-6 font-light">
                  {detailMovie.plot || 'Bu yapım için henüz bir açıklama girilmemiş.'}
                </p>
                
                <div className="flex flex-wrap gap-4 mt-2">
                  <button 
                    onClick={() => setShowProviders(prev => !prev)}
                    className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-stone-100 flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                    Hemen İzle
                  </button>

                  {detailMovie.isRecommendation ? (
                    <button 
                      onClick={() => { addMovie(detailMovie.imdbId); setDetailMovie(null); }}
                      className="border border-stone-500/50 text-white font-bold px-6 py-3 rounded-full hover:bg-white/10 flex items-center gap-2 transition-all active:scale-95 text-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Listeme Ekle
                    </button>
                  ) : (
                    <>
                      {detailMovie.status === 'watchlist' ? (
                        <button 
                          onClick={() => { moveToWatched(detailMovie._id); setDetailMovie(null); }}
                          className="border border-stone-500/50 text-white font-bold px-6 py-3 rounded-full hover:bg-white/10 flex items-center gap-2 transition-all active:scale-95 text-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                          İzlendi İşaretle
                        </button>
                      ) : (
                        <span className="px-4 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold rounded-full text-xs flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">done_all</span>
                          Bu Filmi İzlediniz
                        </span>
                      )}
                      
                      <button 
                        onClick={() => { removeItem(detailMovie._id); setDetailMovie(null); }}
                        className="border border-red-500/30 text-red-400/90 font-bold px-6 py-3 rounded-full hover:bg-red-500/10 flex items-center gap-2 transition-all active:scale-95 text-sm cursor-pointer ml-auto"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Sil
                      </button>
                    </>
                  )}
                </div>

                {showProviders && (
                  <div className="providers-list">
                    <a href={`https://www.netflix.com/search?q=${encodeURIComponent(detailMovie.title)}`} target="_blank" rel="noopener noreferrer" className="provider-link">
                      <svg className="provider-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 2V22L9 12L4 2Z" fill="#E50914"/>
                        <path d="M20 2V22L15 12L20 2Z" fill="#E50914"/>
                        <path d="M9 12L15 22V2L9 12Z" fill="#B20710"/>
                      </svg>
                      Netflix
                    </a>
                    <a href={`https://www.max.com/search?q=${encodeURIComponent(detailMovie.title)}`} target="_blank" rel="noopener noreferrer" className="provider-link">
                      <svg className="provider-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="12" fill="#002BE4"/>
                        <path d="M4 7.5L8.5 12L4 16.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
                        <path d="M20 7.5L15.5 12L20 16.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="12" cy="12" r="3" fill="none" stroke="white" stroke-width="2"/>
                      </svg>
                      Max
                    </a>
                    <a href={`https://www.disneyplus.com/search?q=${encodeURIComponent(detailMovie.title)}`} target="_blank" rel="noopener noreferrer" className="provider-link">
                      <svg className="provider-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="12" fill="#0A1826"/>
                        <path d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12" stroke="#00E5FF" stroke-width="2" stroke-linecap="round"/>
                        <path d="M11 10V14M9 12H13" stroke="white" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      Disney+
                    </a>
                    <a href={`https://www.primevideo.com/search?phrase=${encodeURIComponent(detailMovie.title)}`} target="_blank" rel="noopener noreferrer" className="provider-link">
                      <svg className="provider-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="12" fill="#00A8E1"/>
                        <path d="M5 14C8 17 16 17 19 14" stroke="white" stroke-width="2" stroke-linecap="round"/>
                        <path d="M17 13L19 14L18 16" stroke="white" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      Prime Video
                    </a>
                    <a href={`https://tv.apple.com/search?term=${encodeURIComponent(detailMovie.title)}`} target="_blank" rel="noopener noreferrer" className="provider-link">
                      <svg className="provider-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="12" fill="#000000"/>
                        <path d="M16.5 12C16.5 9 19.5 9 19.5 9C19.5 9 17 6.5 14 6.5C11 6.5 8 9.5 8 13.5C8 17.5 11 20.5 14 20.5C17 20.5 19.5 18 19.5 18C19.5 18 16.5 18 16.5 15C16.5 12 16.5 12 16.5 12Z" fill="white"/>
                        <path d="M14 3.5C15 4.5 15 6 14 6C13 6 12.5 5 12.5 4C12.5 3 13 2.5 14 3.5Z" fill="white"/>
                      </svg>
                      Apple TV
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
