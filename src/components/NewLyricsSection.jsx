import { useCallback, useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

function formatDate(value) {
  if (!value) return 'Az Önce'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Az Önce'
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function NewLyricsSection({ settings }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const token = localStorage.getItem('authToken') || ''
  const currentUser = localStorage.getItem('authUser') || ''
  const endpoint = useMemo(() => `${resolvedApiBase}/api/lyrics`, [])

  const kayraLabel = settings?.kayraName || 'Kayra'
  const hazalLabel = settings?.hazalName || 'Hazal'

  const loadLyrics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(endpoint)
      if (res.ok) {
        const data = await res.json()
        setItems(Array.isArray(data) ? data : [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    loadLyrics()
  }, [loadLyrics])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !text.trim() || !token) return
    setSending(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          text: text.trim()
        })
      })
      if (res.ok) {
        setTitle('')
        setArtist('')
        setText('')
        setIsAdding(false)
        await loadLyrics()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || 'Ekleme başarısız.')
      }
    } catch {
      alert('Bağlantı hatası.')
    } finally {
      setSending(false)
    }
  }

  const removeItem = async (id) => {
    if (!window.confirm('Bu sözleri silmek istediğine emin misin?')) return
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        await loadLyrics()
      } else {
        alert('Silme başarısız.')
      }
    } catch {
      alert('Bağlantı hatası.')
    }
  }

  return (
    <div className="modern-lyrics-container">
      <style>{`
        .modern-lyrics-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .lyrics-header {
          text-align: center;
          margin-bottom: 4rem;
          animation: fadeInUp 0.8s ease-out;
        }

        .lyrics-header h1 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2.5rem, 8vw, 4rem);
          font-weight: 700;
          color: var(--accent-color);
          margin-bottom: 1rem;
        }

        .lyrics-header p {
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .lyrics-list {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .lyric-card {
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: 2rem;
          padding: 2rem;
          position: relative;
          color: var(--text-primary);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: fadeInUp 0.6s ease-out both;
        }

        .lyric-card:hover {
          transform: translateY(-4px);
          border-color: var(--card-hover-border);
          box-shadow: 0 15px 30px var(--accent-glow);
        }

        .lyric-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--card-border);
          padding-bottom: 1rem;
        }

        .lyric-info h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .lyric-info p {
          color: var(--accent-color);
          font-size: 0.95rem;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .lyric-author {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .lyric-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent-glow);
          border: 1px solid var(--card-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: var(--accent-color);
        }

        .lyric-text {
          color: var(--text-secondary);
          line-height: 1.8;
          font-size: 1.15rem;
          font-style: italic;
          white-space: pre-wrap;
          font-family: 'Outfit', sans-serif;
        }

        .delete-btn {
          color: var(--text-muted);
          opacity: 0.5;
          cursor: pointer;
          transition: all 0.3s;
        }

        .delete-btn:hover {
          color: #ef4444;
          opacity: 1;
        }

        .add-lyrics-trigger {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 60px;
          height: 60px;
          border-radius: 30px;
          background: var(--accent-color);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 10px 30px var(--accent-glow);
          z-index: 200;
          transition: all 0.3s;
        }

        .add-lyrics-trigger:hover {
          transform: scale(1.1) rotate(90deg);
        }

        @media (max-width: 768px) {
          .add-lyrics-trigger {
            bottom: 7rem;
            right: 1.5rem;
            width: 50px;
            height: 50px;
          }
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
          padding: 1.5rem;
        }

        .modal-content {
          background: var(--modal-bg);
          border: 1px solid var(--card-border);
          border-radius: 2.5rem;
          width: 100%;
          max-width: 600px;
          padding: 2.5rem;
          color: var(--text-primary);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header className="lyrics-header">
        <h1>Söz Defterimiz</h1>
        <p>Birlikte dinlediğimiz şarkıların sözleri ve kalbimize dokunan cümleler.</p>
      </header>

      <div className="lyrics-list">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-app-accent"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-app-muted/40 italic">Henüz hiçbir şey yazılmamış.</div>
        ) : (
          items.map((item, index) => (
            <article key={item._id} className="lyric-card" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="lyric-meta">
                <div className="lyric-info">
                  <h3>{item.title}</h3>
                  {item.artist && <p>{item.artist}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="lyric-author">
                    <div className="lyric-avatar">
                      {item.author[0]}
                    </div>
                    <span>{item.author === 'Hazal' ? hazalLabel : kayraLabel}</span>
                    <span>•</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  {currentUser === item.author && (
                    <span className="material-symbols-outlined delete-btn text-[20px]" onClick={() => removeItem(item._id)}>delete</span>
                  )}
                </div>
              </div>
              <p className="lyric-text">"{item.text}"</p>
            </article>
          ))
        )}
      </div>

      {token && (
        <div className="add-lyrics-trigger" onClick={() => setIsAdding(true)}>
          <span className="material-symbols-outlined">add</span>
        </div>
      )}

      {isAdding && (
        <div className="modal-overlay" onClick={() => setIsAdding(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl text-app-text font-bold mb-6">Yeni Bir Söz Ekle</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-app-muted mb-2 font-bold">Başlık / Şarkı Adı</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Örn: Sor"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-app-muted mb-2 font-bold">Sanatçı / Yazar (Opsiyonel)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Örn: Duman"
                  value={artist}
                  onChange={e => setArtist(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-app-muted mb-2 font-bold">Sözler / Alıntı</label>
                <textarea
                  className="input-field h-40 resize-none"
                  placeholder="Şarkı sözlerini veya alıntıyı buraya yaz..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 p-4 text-app-text/40 font-semibold">Vazgeç</button>
                <button 
                  type="submit" 
                  disabled={sending || !title.trim() || !text.trim()} 
                  className="flex-1 bg-app-accent text-white font-bold p-4 rounded-xl hover:opacity-90 transition-opacity"
                >
                  {sending ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
