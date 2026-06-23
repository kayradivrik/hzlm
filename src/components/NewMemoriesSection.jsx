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
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function NewMemoriesSection({ settings }) {
  const initialUserKey = (() => {
    const authUser = localStorage.getItem('authUser')
    if (authUser === 'Hazal' || authUser === 'Kayra') return authUser
    const pending = localStorage.getItem('pendingLoginUser')
    return pending === 'Hazal' ? 'Hazal' : 'Kayra'
  })()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newText, setNewText] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState(initialUserKey)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const pendingLoginUser = localStorage.getItem('pendingLoginUser') || ''
  const authUser = localStorage.getItem('authUser') || ''
  const isGuestVisitor = !token && pendingLoginUser === 'Guest' && !authUser
  
  const [showLoginForm, setShowLoginForm] = useState(() => {
    const storedToken = localStorage.getItem('authToken') || ''
    if (storedToken) return false
    if (pendingLoginUser === 'Guest') return false
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
      if (!res.ok) throw new Error('Anılar getirilemedi.')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err?.message ?? 'Bir hata oluştu.')
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
        body: JSON.stringify({ username, password: loginPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Giriş başarısız.')
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authUser', data.user)
      localStorage.removeItem('pendingLoginUser')
      setToken(data.token)
      setShowLoginForm(false)
    } catch (err) {
      setLoginError(err?.message || 'Giriş başarısız.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleImageChange = (file, setImage) => {
    if (!file) {
      setImage('')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImage(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  const uploadToCloudinary = async (imageValue, sessionToken) => {
    if (!imageValue || imageValue.startsWith('http')) return imageValue
    const res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ imageData: imageValue }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok || !payload?.url) throw new Error('Fotoğraf yüklenemedi.')
    return payload.url
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    const text = newText.trim()
    if (!text) return
    const sessionToken = token || localStorage.getItem('authToken') || ''
    try {
      setSubmitting(true)
      const uploadedImageUrl = await uploadToCloudinary(newImageUrl, sessionToken)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ text, author: selectedAuthor, imageUrl: uploadedImageUrl }),
      })
      if (!res.ok) throw new Error('Anı eklenemedi.')
      setNewText('')
      setNewImageUrl('')
      setShowAddForm(false)
      await loadMemories()
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteItem = async (id) => {
    if (!window.confirm('Bu anıyı silmek istediğine emin misin?')) return
    try {
      const sessionToken = token || localStorage.getItem('authToken') || ''
      await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      await loadMemories()
    } catch (err) {
      alert('Silme başarısız.')
    }
  }

  return (
    <div className="modern-memories-container">
      <style>{`
        .modern-memories-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .memories-header {
          text-align: center;
          margin-bottom: 4rem;
          animation: fadeInUp 0.8s ease-out;
        }

        .memories-header h1 {
          font-family: 'Outfit', 'Inter', sans-serif;
          font-size: clamp(2.5rem, 8vw, 4rem);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .memories-header p {
          color: var(--text-muted);
          font-size: 1.15rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .timeline {
          position: relative;
          padding: 2rem 0;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1px;
          background: var(--card-border);
          transform: translateX(-50%);
        }

        .memory-card-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-bottom: 4rem;
          position: relative;
        }

        .memory-card {
          width: 45%;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 1.5rem;
          padding: 1.5rem;
          position: relative;
          color: var(--text-primary);
          transition: all 0.3s ease;
          animation: fadeInUp 0.6s ease-out both;
          box-shadow: 0 4px 6px var(--nav-shadow);
        }

        .memory-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px var(--nav-shadow);
        }

        .memory-card.left { margin-right: auto; }
        .memory-card.right { margin-left: auto; }

        .memory-card::after {
          content: '';
          position: absolute;
          top: 2rem;
          width: 12px;
          height: 12px;
          background: var(--bg-color);
          border-radius: 50%;
          border: 2px solid var(--accent-color);
          z-index: 2;
        }

        .memory-card.left::after { right: calc(-11.1% - 6px); }
        .memory-card.right::after { left: calc(-11.1% - 6px); }

        .memory-image {
          width: 100%;
          border-radius: 1.5rem;
          margin-bottom: 1.5rem;
          overflow: hidden;
          background: var(--input-bg);
          cursor: zoom-in;
        }

        .memory-image img {
          width: 100%;
          display: block;
          transition: transform 0.6s ease;
        }

        .memory-card:hover .memory-image img {
          transform: scale(1.05);
        }

        .memory-content {
          font-family: 'Outfit', sans-serif;
        }

        .memory-date {
          font-size: 0.8rem;
          color: var(--accent-color);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
          display: block;
        }

        .memory-text {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 1.1rem;
        }

        .memory-author {
          margin-top: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .author-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(45deg, var(--accent-color), var(--text-muted));
        }

        .floating-add-btn {
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
          box-shadow: 0 10px 30px var(--accent-glow);
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 200;
        }

        @media (max-width: 768px) {
          .floating-add-btn {
            bottom: 7rem;
            right: 1.5rem;
            width: 50px;
            height: 50px;
          }
        }

        .floating-add-btn:hover {
          transform: scale(1.1) rotate(90deg);
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
          padding: 1rem;
          cursor: zoom-out;
        }

        .modal-content {
          background: var(--modal-bg);
          border: 1px solid var(--card-border);
          border-radius: 2.5rem;
          width: 100%;
          max-width: 500px;
          padding: 2.5rem;
          position: relative;
          cursor: default;
          color: var(--text-primary);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 1rem;
          padding: 1rem;
          color: var(--input-text);
          outline: none;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px var(--input-focus-ring);
        }

        .btn-primary {
          width: 100%;
          background: var(--accent-color);
          color: #ffffff;
          padding: 1rem;
          border-radius: 1rem;
          font-weight: 700;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }

        .delete-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          color: var(--text-muted);
          opacity: 0.6;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .delete-btn:hover {
          color: #ef4444;
          opacity: 1;
        }

        .image-modal-overlay {
          position: fixed;
          inset: 0;
          background: var(--modal-overlay-bg);
          backdrop-filter: blur(20px);
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          cursor: zoom-out;
          animation: fadeIn 0.4s ease;
        }

        .modal-image-wrapper {
          position: relative;
          max-width: 90%;
          max-height: 90vh;
          cursor: default;
        }

        .modal-image-wrapper img {
          max-width: 100%;
          max-height: 85vh;
          border-radius: 1.5rem;
          box-shadow: 0 30px 60px var(--nav-shadow);
        }

        .modal-close-btn {
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

        .modal-close-btn:hover {
          background: var(--accent-color);
          color: #ffffff;
          transform: rotate(90deg);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @media (max-width: 768px) {
          .timeline::before { left: 15px; transform: none; }
          .memory-card { width: calc(100% - 45px); margin-left: 45px !important; }
          .memory-card::after { left: -36px !important; }
          .modal-close-btn { top: 1rem; right: 1rem; width: 40px; height: 40px; }
        }
        
        @media (max-width: 350px) {
          .memory-card { padding: 1rem; width: calc(100% - 35px); margin-left: 35px !important; }
          .memory-card::after { left: -26px !important; }
          .timeline::before { left: 12px; }
        }
      `}</style>

      <header className="memories-header">
        <h1>Anı Defterimiz</h1>
        <p>Seninle geçen her an, kalbimde sonsuz bir iz bırakıyor.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-300"></div>
        </div>
      ) : (
        <div className="timeline">
          {items.map((item, index) => (
            <div key={item._id} className="memory-card-wrapper">
              <div className={`memory-card ${index % 2 === 0 ? 'left' : 'right'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                {!isGuestVisitor && (
                  <span className="material-symbols-outlined delete-btn" onClick={() => deleteItem(item._id)}>delete</span>
                )}
                {item.imageUrl && (
                  <div className="memory-image" onClick={() => setSelectedImage(item.imageUrl)}>
                    <img src={item.imageUrl} alt="Anı" loading="lazy" />
                  </div>
                )}
                <div className="memory-content">
                  <span className="memory-date">{formatDate(item.createdAt)}</span>
                  <p className="memory-text">{item.text}</p>
                  <div className="memory-author">
                    <div className="author-avatar" />
                    <span>{item.author === 'Hazal' ? HazalLabel : kayraLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <button className="modal-close-btn" onClick={() => setSelectedImage(null)}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="modal-image-wrapper" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Full Resolution" />
          </div>
        </div>
      )}

      {(!isGuestVisitor && token) && (
        <div className="floating-add-btn" onClick={() => setShowAddForm(true)}>
          <span className="material-symbols-outlined">add</span>
        </div>
      )}

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="font-headline text-3xl text-app-text mb-6">Yeni Bir Anı...</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Düşüncelerin</label>
                <textarea
                  className="form-input h-32 resize-none"
                  placeholder="Neler hissediyorsun?"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bir Fotoğraf (Opsiyonel)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                  onChange={e => handleImageChange(e.target.files?.[0], setNewImageUrl)}
                />
                <label htmlFor="image-upload" className="form-input cursor-pointer flex items-center justify-between">
                  <span>{newImageUrl ? 'Fotoğraf Seçildi ✅' : 'Fotoğraf Seç'}</span>
                  <span className="material-symbols-outlined">image</span>
                </label>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 p-4 rounded-2xl border border-app-border text-app-text/60">İptal</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Kaydediliyor...' : 'Paylaş'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLoginForm && !isGuestVisitor && !token && (
        <div className="modal-overlay" style={{ cursor: 'default' }}>
          <div className="modal-content">
            <h2 className="font-headline text-3xl text-app-text mb-2 text-center">Hoş Geldin</h2>
            <p className="text-app-muted text-center mb-8 text-sm italic">Sadece Kayra ve Hazal girebilir.</p>
            <form onSubmit={doLogin}>
              <div className="form-group">
                <div className="flex bg-app-card border border-app-border p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => setLoginUser('Kayra')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${loginUser === 'Kayra' ? 'bg-app-accent/25 text-app-accent shadow' : 'text-app-text/40'}`}
                  >
                    {kayraLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginUser('Hazal')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${loginUser === 'Hazal' ? 'bg-app-accent/25 text-app-accent shadow' : 'text-app-text/40'}`}
                  >
                    {HazalLabel}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <input
                  type="password"
                  className="form-input text-center"
                  placeholder="Şifreni Gir..."
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && <p className="text-red-400 text-xs text-center mb-4">{loginError}</p>}
              <button type="submit" disabled={loginLoading} className="btn-primary">
                {loginLoading ? 'Kontrol ediliyor...' : 'Giriş Yap'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
