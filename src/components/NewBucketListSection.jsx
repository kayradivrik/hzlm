import { useCallback, useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

const categories = [
  { name: 'Gezilecek Yerler', icon: 'map' },
  { name: 'Çılgınlıklar', icon: 'auto_awesome' },
  { name: 'Tatlar', icon: 'restaurant' },
  { name: 'Diğer', icon: 'favorite' }
]

export default function NewBucketListSection({ settings }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [newCategory, setNewCategory] = useState(categories[0].name)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState('Hepsi')
  const [isAdding, setIsAdding] = useState(false)

  const endpoint = useMemo(() => `${resolvedApiBase}/api/bucketlist`, [])
  const token = localStorage.getItem('authToken') || ''

  const loadItems = useCallback(async () => {
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
    loadItems()
  }, [loadItems])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!newText.trim() || !token) return
    setSending(true)
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: newText.trim(), category: newCategory }),
      })
      setNewText('')
      setIsAdding(false)
      await loadItems()
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  const toggleComplete = async (id, isCompleted) => {
    if (!token) return
    await fetch(`${endpoint}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isCompleted }),
    })
    await loadItems()
  }

  const removeItem = async (id) => {
    if (!window.confirm('Kaldırmak istediğine emin misin?')) return
    await fetch(`${endpoint}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    await loadItems()
  }

  const filteredItems = filter === 'Hepsi' ? items : items.filter(item => item.category === filter)
  const completedCount = items.filter(item => item.isCompleted).length
  const progress = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100)

  return (
    <div className="modern-bucket-container">
      <style>{`
        .modern-bucket-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .bucket-header {
          text-align: center;
          margin-bottom: 4rem;
          animation: fadeInUp 0.8s ease-out;
        }

        .bucket-header h1 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2.5rem, 8vw, 4rem);
          font-weight: 700;
          color: var(--accent-color);
          margin-bottom: 1rem;
        }

        .bucket-header p {
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .progress-dashboard {
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--card-border);
          border-radius: 2.5rem;
          padding: 2.5rem;
          margin-bottom: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.5rem;
          color: var(--text-primary);
        }

        @media (min-width: 640px) {
          .progress-dashboard {
            flex-direction: row;
            text-align: left;
            gap: 2.5rem;
          }
        }

        .progress-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: conic-gradient(var(--accent-color) ${progress}%, var(--input-bg) 0);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
          box-shadow: 0 0 20px var(--accent-glow);
        }

        .progress-circle::after {
          content: '${progress}%';
          position: absolute;
          inset: 6px;
          background: var(--modal-bg);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--accent-color);
        }

        .progress-info h3 {
          color: var(--text-primary);
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          font-family: 'Outfit', sans-serif;
        }

        .progress-info p {
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1.5;
        }

        .filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 2rem;
          justify-content: center;
        }

        .filter-btn {
          padding: 0.6rem 1.25rem;
          border-radius: 1rem;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.3s;
        }

        .filter-btn.active {
          background: var(--accent-color);
          color: #ffffff;
          border: 1px solid var(--accent-color);
          box-shadow: 0 5px 15px var(--accent-glow);
        }

        .bucket-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .bucket-item {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 1.5rem;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          color: var(--text-primary);
          transition: all 0.3s ease;
          animation: fadeInUp 0.5s ease-out both;
        }

        .bucket-item:hover {
          background: var(--card-hover-bg);
          border-color: var(--card-hover-border);
          transform: translateX(5px);
        }

        .bucket-item.completed {
          opacity: 0.5;
        }

        .checkbox {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 2px solid var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .checkbox.checked {
          background: var(--accent-color);
          border-color: var(--accent-color);
          color: #ffffff;
        }

        .item-text {
          flex: 1;
          color: var(--text-primary);
          font-size: 1.1rem;
          transition: all 0.3s;
        }

        .completed .item-text {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .category-tag {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          padding: 0.25rem 0.75rem;
          border-radius: 0.5rem;
        }

        .add-bucket-trigger {
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
        }

        @media (max-width: 768px) {
          .add-bucket-trigger {
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
          max-width: 500px;
          padding: 2.5rem;
          color: var(--text-primary);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header className="bucket-header">
        <h1>Hayallerimiz</h1>
        <p>Gelecekte birlikte yapacağımız tüm o harika şeyler...</p>
      </header>

      {items.length > 0 && (
        <div className="progress-dashboard">
          <div className="progress-circle" />
          <div className="progress-info">
            <h3>Yolculuğumuzun %{progress}'i tamamlandı!</h3>
            <p>{completedCount} hayal gerçek oldu, {items.length - completedCount} tanesi bizi bekliyor.</p>
          </div>
        </div>
      )}

      <div className="filter-bar">
        {['Hepsi', ...categories.map(c => c.name)].map(cat => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bucket-list">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-300"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-app-muted/40 italic">Henüz bir hayal eklenmemiş.</div>
        ) : (
          filteredItems.map((item, index) => (
            <div key={item._id} className={`bucket-item ${item.isCompleted ? 'completed' : ''}`} style={{ animationDelay: `${index * 0.05}s` }}>
              <div 
                className={`checkbox ${item.isCompleted ? 'checked' : ''}`}
                onClick={() => toggleComplete(item._id, !item.isCompleted)}
              >
                {item.isCompleted && <span className="material-symbols-outlined text-[18px]">check</span>}
              </div>
              <div className="flex-1">
                <p className="item-text">{item.text}</p>
                <span className="category-tag">{item.category}</span>
              </div>
              {token && (
                <button onClick={() => removeItem(item._id)} className="text-app-text/10 hover:text-red-400 transition-colors">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {token && (
        <div className="add-bucket-trigger" onClick={() => setIsAdding(true)}>
          <span className="material-symbols-outlined">add</span>
        </div>
      )}

      {isAdding && (
        <div className="modal-overlay" onClick={() => setIsAdding(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl text-app-text font-bold mb-6">Yeni Bir Hayal...</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {categories.map(cat => (
                <button
                  key={cat.name}
                  className={`p-3 rounded-xl border text-[10px] uppercase font-bold flex items-center justify-center gap-2 transition-all ${newCategory === cat.name ? 'border-app-accent bg-app-accent/20 text-app-accent' : 'border-app-border text-app-muted'}`}
                  onClick={() => setNewCategory(cat.name)}
                >
                  <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            <textarea
              className="input-field w-full h-32 mb-6 resize-none"
              placeholder="Neler yapalım?"
              value={newText}
              onChange={e => setNewText(e.target.value)}
            />

            <div className="flex gap-4">
              <button onClick={() => setIsAdding(false)} className="flex-1 p-4 text-app-text/40">Vazgeç</button>
              <button 
                onClick={onSubmit} 
                disabled={sending || !newText.trim()} 
                className="flex-1 bg-app-accent text-white font-bold p-4 rounded-xl hover:opacity-90 transition-opacity"
              >
                {sending ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
