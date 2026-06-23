import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function NewGallerySection({ settings }) {
  const [items, setItems] = useState([])
  const [visibleCount, setVisibleCount] = useState(12)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newCaption, setNewCaption] = useState('')
  const [newImageData, setNewImageData] = useState('')
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  
  const fileInputRef = useRef(null)
  const endpoint = useMemo(() => `${resolvedApiBase}/api/gallery`, [])
  const uploadEndpoint = useMemo(() => `${resolvedApiBase}/api/uploads/image`, [])
  const token = localStorage.getItem('authToken') || ''
  const currentUser = localStorage.getItem('authUser') || ''

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error('Galeri yüklenemedi.')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    load()
  }, [load])

  const onChooseImage = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setNewImageData(typeof reader.result === 'string' ? reader.result : '')
      setIsAdding(true)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!newImageData || !token) return
    setSending(true)
    try {
      const uploadRes = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageData: newImageData }),
      })
      const uploadPayload = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadPayload.message)

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageUrl: uploadPayload.url, caption: newCaption.trim() }),
      })
      if (!res.ok) throw new Error('Galeriye eklenemedi.')

      setNewCaption('')
      setNewImageData('')
      setIsAdding(false)
      await load()
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSending(false)
    }
  }

  const removeItem = async (id) => {
    if (!window.confirm('Bu fotoğrafı silmek istediğine emin misin?')) return
    try {
      await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      await load()
    } catch (err) {
      alert('Silme başarısız.')
    }
  }

  const kayraName = settings?.kayraName || 'Kayra'
  const HazalName = settings?.hazalName || 'Hazal'

  return (
    <div className="modern-gallery-container">
      <style>{`
        .modern-gallery-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .gallery-header {
          margin-bottom: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.5rem;
          animation: fadeInUp 0.8s ease-out;
        }

        @media (min-width: 640px) {
          .gallery-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-end;
            text-align: left;
            margin-bottom: 4rem;
          }
        }

        .header-text h1 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(1.75rem, 8vw, 3.5rem);
          font-weight: 700;
          color: var(--accent-color);
          margin-bottom: 0.5rem;
        }

        .header-text p {
          color: var(--text-muted);
          font-size: 0.9rem;
          sm:font-size: 1.1rem;
        }

        .add-photo-btn {
          background: var(--accent-color);
          color: #ffffff;
          padding: 0.8rem 1.5rem;
          border-radius: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          transition: all 0.2s ease;
          width: fit-content;
        }

        .add-photo-btn:hover {
          opacity: 0.9;
        }

        .masonry-grid {
          columns: 1;
          column-gap: 1rem;
          width: 100%;
        }

        @media (min-width: 480px) { .masonry-grid { columns: 2; } }
        @media (min-width: 768px) { .masonry-grid { columns: 3; } }
        @media (min-width: 1024px) { .masonry-grid { columns: 4; } }

        .gallery-item {
          break-inside: avoid;
          margin-bottom: 1.5rem;
          position: relative;
          border-radius: 0.5rem;
          overflow: hidden;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          cursor: pointer;
          transition: all 0.3s ease;
          animation: fadeInUp 0.6s ease-out both;
        }

        .gallery-item:hover {
          border-color: var(--card-hover-border);
          box-shadow: 0 4px 12px var(--nav-shadow);
        }

        .gallery-item img {
          width: 100%;
          display: block;
          transition: filter 0.3s ease;
        }

        .gallery-item:hover img {
          filter: brightness(0.85);
        }

        .item-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, var(--modal-bg) 0%, transparent 80%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 1.5rem;
          opacity: 0;
          transition: all 0.4s ease;
        }

        .gallery-item:hover .item-overlay {
          opacity: 1;
        }

        .item-caption {
          color: var(--text-primary);
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          transform: translateY(10px);
          transition: transform 0.4s ease;
        }

        .gallery-item:hover .item-caption {
          transform: translateY(0);
        }

        .item-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .remove-icon {
          color: #ef4444;
          opacity: 0.6;
          transition: opacity 0.3s;
        }

        .remove-icon:hover { opacity: 1; }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: var(--modal-overlay-bg);
          backdrop-filter: blur(15px);
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          animation: fadeIn 0.4s ease;
        }

        .modal-image-container {
          max-width: 1200px;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .modal-image {
          max-height: 80vh;
          max-width: 100%;
          object-fit: contain;
          border-radius: 1rem;
          box-shadow: 0 30px 60px var(--nav-shadow);
        }

        .modal-info {
          margin-top: 2rem;
          text-align: center;
          color: var(--text-primary);
        }

        .close-modal {
          position: fixed;
          top: 2rem;
          right: 2rem;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 9999;
          transition: all 0.3s;
          backdrop-filter: blur(10px);
        }

        .close-modal:hover {
          background: var(--accent-color);
          color: #ffffff;
          transform: rotate(90deg);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .gallery-header { flex-direction: column; align-items: flex-start; }
          .masonry-grid { columns: 2; }
        }
      `}</style>

      <header className="gallery-header">
        <div className="header-text">
          <h1>Sonsuz Anılar</h1>
          <p>{kayraName} & {HazalName} hikayesinin görsel arşivi.</p>
        </div>
        {token && (
          <button className="add-photo-btn" onClick={() => fileInputRef.current.click()}>
            <span className="material-symbols-outlined">add_a_photo</span>
            Anı Ekle
          </button>
        )}
      </header>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => onChooseImage(e.target.files?.[0])} />

      {isAdding && (
        <div className="modal-overlay" onClick={() => setIsAdding(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl text-app-text font-bold mb-6">Yeni Anı Fotoğrafı</h2>
            <img src={newImageData} className="w-full h-64 object-cover rounded-2xl mb-6" alt="Preview" />
            <textarea
              className="input-field w-full h-24 mb-6 resize-none"
              placeholder="Bu kareyi anlatan kısa bir not..."
              value={newCaption}
              onChange={e => setNewCaption(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setIsAdding(false)} className="flex-1 p-4 text-app-text/40">Vazgeç</button>
              <button onClick={onSubmit} disabled={sending} className="flex-1 bg-app-accent text-white font-bold p-4 rounded-xl hover:opacity-90 transition-opacity">
                {sending ? 'Yükleniyor...' : 'Paylaş'}
              </button>
            </div>
            {submitError && <p className="text-red-400 text-center mt-4 text-sm">{submitError}</p>}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-300"></div>
        </div>
      ) : (
        <div className="masonry-grid">
          {items.slice(0, visibleCount).map((item, index) => (
            <div 
              key={item._id} 
              className="gallery-item" 
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setSelectedItem(item)}
            >
              <img src={item.imageUrl} alt={item.caption} loading="lazy" />
              <div className="item-overlay">
                <p className="item-caption">{item.caption || 'Bir Anı'}</p>
                <div className="item-meta">
                  <span>{formatDate(item.createdAt)}</span>
                  {currentUser === item.author && (
                    <span className="material-symbols-outlined remove-icon" onClick={(e) => { e.stopPropagation(); removeItem(item._id); }}>delete</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > visibleCount && (
        <div className="flex justify-center mt-12">
          <button 
            className="px-8 py-3 border border-app-border rounded-full text-app-text hover:bg-app-accent/10 transition-all font-semibold"
            onClick={() => setVisibleCount(prev => prev + 12)}
          >
            Daha Fazla Gör
          </button>
        </div>
      )}

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)} style={{ cursor: 'zoom-out' }}>
          <button className="close-modal" onClick={() => setSelectedItem(null)}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="modal-image-container" onClick={e => e.stopPropagation()} style={{ cursor: 'default' }}>
            <img src={selectedItem.imageUrl} className="modal-image" alt="Full" />
            <div className="modal-info">
              <p className="text-2xl md:text-3xl font-bold mb-2 text-app-text">{selectedItem.caption || 'Bir Anı'}</p>
              <p className="text-app-accent font-medium">{formatDate(selectedItem.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
