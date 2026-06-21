import { useCallback, useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

const moods = [
  { name: 'Mutlu', icon: 'sentiment_very_satisfied', color: '#f43f5e' },
  { name: 'Yorgun', icon: 'sentiment_dissatisfied', color: '#9ca3af' },
  { name: 'Dalgın', icon: 'auto_awesome', color: '#a855f7' },
  { name: 'Heyecanlı', icon: 'celebration', color: '#ff7eb9' },
  { name: 'Huzurlu', icon: 'spa', color: '#10b981' }
]

function formatAgo(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  const mins = Math.max(1, Math.floor(diff / 60000))
  if (mins < 60) return `${mins} dk önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.floor(hours / 24)
  return `${days} gün önce`
}

export default function NewThoughtsSection({ settings, currentUser }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [newMood, setNewMood] = useState('Mutlu')
  const [sending, setSending] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

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
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    loadThoughts()
  }, [loadThoughts])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!newText.trim() || !token) return
    setSending(true)
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: newText.trim(), mood: newMood }),
      })
      setNewText('')
      setIsAdding(false)
      await loadThoughts()
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  const removeItem = async (id) => {
    if (!window.confirm('Bu düşünceyi silmek istediğine emin misin?')) return
    await fetch(`${endpoint}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    await loadThoughts()
  }

  return (
    <div className="modern-thoughts-container">
      <style>{`
        .modern-thoughts-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
        }

        .thoughts-header {
          text-align: center;
          margin-bottom: 4rem;
          animation: fadeInUp 0.8s ease-out;
        }

        .thoughts-header h1 {
          font-family: 'Noto Serif', Georgia, serif;
          font-style: italic;
          font-size: clamp(2.5rem, 8vw, 4.5rem);
          font-weight: 400;
          color: var(--accent-color);
          margin-bottom: 1rem;
        }

        .thoughts-header p {
          color: var(--text-muted);
          font-size: 1.1rem;
          max-width: 500px;
          margin: 0 auto;
          font-family: 'Manrope', sans-serif;
        }

        .thoughts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .thoughts-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .thoughts-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .thought-card {
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: 1.75rem;
          padding: 2rem;
          position: relative;
          color: var(--text-primary);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: fadeInUp 0.6s ease-out both;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 220px;
        }

        .thought-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent-color);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }

        .thought-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px dashed var(--card-border);
          padding-bottom: 1rem;
        }

        .author-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .author-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--accent-color);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-family: 'Noto Serif', serif;
          font-size: 0.9rem;
        }

        .author-details h3 {
          color: var(--text-primary);
          font-weight: 700;
          font-size: 0.9rem;
          font-family: 'Manrope', sans-serif;
        }

        .author-details span {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-family: 'Manrope', sans-serif;
        }

        .mood-badge {
          padding: 0.3rem 0.65rem;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.7rem;
          font-weight: 700;
          font-family: 'Manrope', sans-serif;
          border: 1px solid var(--card-border);
          width: fit-content;
        }

        .thought-text {
          font-family: 'Noto Serif', Georgia, serif;
          font-size: 1.1rem;
          line-height: 1.6;
          color: var(--text-secondary);
          white-space: pre-wrap;
          flex-grow: 1;
        }

        .add-thought-trigger {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          padding: 0.9rem 1.75rem;
          background: var(--accent-color);
          color: #ffffff;
          border-radius: 99px;
          font-weight: 700;
          font-family: 'Manrope', sans-serif;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 200;
          border: none;
        }

        .add-thought-trigger:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
        }

        @media (max-width: 768px) {
          .add-thought-trigger {
            bottom: 6rem;
            right: 1.5rem;
            padding: 0.8rem 1.25rem;
            font-size: 0.85rem;
          }
          
          .modal-content {
            padding: 2rem 1.5rem !important;
            border-radius: 2rem !important;
          }

          .mood-selector {
            gap: 0.5rem;
          }

          .mood-btn {
            min-width: 80px;
            padding: 0.5rem;
          }
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: var(--modal-overlay-bg);
          backdrop-filter: blur(12px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .modal-content {
          background: var(--modal-bg);
          border: 1px solid var(--card-border);
          border-radius: 2.25rem;
          width: 100%;
          max-width: 600px;
          padding: 3rem;
          position: relative;
          color: var(--text-primary);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .mood-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .mood-btn {
          flex: 1;
          min-width: 90px;
          padding: 0.6rem;
          border-radius: 1rem;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .mood-btn:hover {
          border-color: var(--accent-color);
          color: var(--text-primary);
        }

        .mood-btn.active {
          background: var(--accent-glow);
          border-color: var(--accent-color);
          color: var(--accent-color);
          font-weight: 700;
        }

        .thought-input {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 1.25rem;
          padding: 1.25rem;
          color: var(--input-text);
          font-family: 'Noto Serif', Georgia, serif;
          font-size: 1.05rem;
          min-height: 180px;
          outline: none;
          resize: none;
          margin-bottom: 1.5rem;
          transition: all 0.3s;
        }

        .thought-input:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px var(--input-focus-ring);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header className="thoughts-header">
        <h1>Aklımdakiler</h1>
        <p>{otherLabel}'in o anki dünyasına kısa bir bakış.</p>
      </header>

      <div className="thoughts-grid">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-rose-300"></div>
          </div>
        ) : (
          items.map((item, index) => {
            const moodInfo = moods.find(m => m.name === item.mood) || moods[0]
            const isMe = item.author === currentUser
            return (
              <article key={item._id} className="thought-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="thought-meta">
                  <div className="author-info">
                    <div className="author-avatar" style={{ background: isMe ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                      {item.author[0]}
                    </div>
                    <div className="author-details">
                      <h3>{item.author === 'Hazal' ? HazalLabel : kayraLabel}</h3>
                      <span>{formatAgo(item.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="mood-badge" style={{ color: moodInfo.color, borderColor: `${moodInfo.color}33` }}>
                      <span className="material-symbols-outlined text-[18px]">{moodInfo.icon}</span>
                      {item.mood}
                    </div>
                    {isMe && (
                      <button onClick={() => removeItem(item._id)} className="text-app-text/20 hover:text-red-400 transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="thought-text">{item.text}</p>
              </article>
            )
          })
        )}
      </div>

      {token && (
        <button className="add-thought-trigger" onClick={() => setIsAdding(true)}>
          <span className="material-symbols-outlined">edit_note</span>
          Aklımdan Geçenler...
        </button>
      )}

      {isAdding && (
        <div className="modal-overlay" onClick={() => setIsAdding(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-3xl text-app-text font-bold mb-8 text-center">Neler Hissediyorsun?</h2>
            
            <div className="mood-selector">
              {moods.map(mood => (
                <button
                  key={mood.name}
                  className={`mood-btn ${newMood === mood.name ? 'active' : ''}`}
                  onClick={() => setNewMood(mood.name)}
                >
                  <span className="material-symbols-outlined" style={{ color: mood.color }}>{mood.icon}</span>
                  <span className="text-[10px] uppercase font-bold">{mood.name}</span>
                </button>
              ))}
            </div>

            <textarea
              className="thought-input"
              placeholder="Zihninden geçenleri buraya fısılda..."
              value={newText}
              onChange={e => setNewText(e.target.value)}
            />

            <div className="flex gap-4">
              <button onClick={() => setIsAdding(false)} className="flex-1 p-4 text-app-text/40 font-bold">Vazgeç</button>
              <button 
                onClick={onSubmit} 
                disabled={sending || !newText.trim()} 
                className="flex-1 bg-app-accent/20 text-app-accent font-bold p-4 rounded-2xl hover:bg-app-accent/30 transition-all border border-app-accent/20"
              >
                {sending ? 'Paylaşılıyor...' : 'Paylaş'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
