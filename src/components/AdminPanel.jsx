import { useEffect, useState, useMemo, useRef } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

// Parsing bracketed lyrics to align chords on top of lyrics (for live preview)
function parseBracketLine(line) {
  let chordLine = ''
  let lyricLine = ''
  let i = 0
  while (i < line.length) {
    if (line[i] === '[') {
      let closeIdx = line.indexOf(']', i)
      if (closeIdx !== -1) {
        let chord = line.substring(i + 1, closeIdx)
        if (chordLine.length < lyricLine.length) {
          chordLine += ' '.repeat(lyricLine.length - chordLine.length)
        }
        chordLine += chord
        i = closeIdx + 1
        continue
      }
    }
    lyricLine += line[i]
    i++
  }
  return { chordLine, lyricLine }
}

const quickChords = ['Am', 'C', 'D', 'Dm', 'E', 'Em', 'F', 'G', 'A', 'A7', 'B7', 'Bb']

export default function AdminPanel({ settings, setSettings, settingsEndpoint, loading }) {
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [activeTab, setActiveTab] = useState('dashboard')

  // Live Statistics
  const [stats, setStats] = useState({ memories: 0, thoughts: 0, chords: 0, lyrics: 0, gallery: 0, bucketlist: 0 })
  
  // 1. Chords State
  const [chords, setChords] = useState([])
  const [chordsLoading, setChordsLoading] = useState(false)
  const [addingChord, setAddingChord] = useState(false)
  const [newChord, setNewChord] = useState({ title: '', artist: '', originalKey: 'Am', capo: 0, content: '' })
  const [customChordInput, setCustomChordInput] = useState('')
  const [editingChordId, setEditingChordId] = useState(null)

  // 2. Lyrics State
  const [lyrics, setLyrics] = useState([])
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [addingLyric, setAddingLyric] = useState(false)
  const [newLyric, setNewLyric] = useState({ title: '', artist: '', text: '' })
  const [editingLyricId, setEditingLyricId] = useState(null)

  // 3. Thoughts State
  const [thoughts, setThoughts] = useState([])
  const [thoughtsLoading, setThoughtsLoading] = useState(false)
  const [addingThought, setAddingThought] = useState(false)
  const [newThought, setNewThought] = useState({ text: '', mood: 'Mutlu' })

  // 4. Gallery State
  const [gallery, setGallery] = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [addingGallery, setAddingGallery] = useState(false)
  const [newGallery, setNewGallery] = useState({ imageUrl: '', caption: '' })

  // 5. Bucket List State
  const [bucketList, setBucketList] = useState([])
  const [bucketLoading, setBucketLoading] = useState(false)
  const [addingBucket, setAddingBucket] = useState(false)
  const [newBucket, setNewBucket] = useState({ text: '', category: 'Gezilecek Yerler' })

  const textareaRef = useRef(null)

  const inputClass = 'input-field text-base py-3 px-4 w-full bg-app-card border border-app-border rounded-xl text-app-text outline-none focus:border-app-accent transition-all'
  const textareaClass = `${inputClass} resize-none h-48 font-mono`

  useEffect(() => {
    if (settings) {
      setForm(settings)
    }
  }, [settings])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Fetch Live Statistics
  const fetchStats = async () => {
    try {
      const [memRes, thoughtRes, chordRes, lyricRes, galRes, bucketRes] = await Promise.all([
        fetch(`${resolvedApiBase}/api/memories`),
        fetch(`${resolvedApiBase}/api/thoughts`),
        fetch(`${resolvedApiBase}/api/chords`),
        fetch(`${resolvedApiBase}/api/lyrics`),
        fetch(`${resolvedApiBase}/api/gallery`),
        fetch(`${resolvedApiBase}/api/bucketlist`),
      ])
      const mems = await memRes.json()
      const thoughtsData = await thoughtRes.json()
      const chordsData = await chordRes.json()
      const lyricsData = await lyricRes.json()
      const galleryData = await galRes.json()
      const bucketData = await bucketRes.json()

      setStats({
        memories: Array.isArray(mems) ? mems.length : 0,
        thoughts: Array.isArray(thoughtsData) ? thoughtsData.length : 0,
        chords: Array.isArray(chordsData) ? chordsData.length : 0,
        lyrics: Array.isArray(lyricsData) ? lyricsData.length : 0,
        gallery: Array.isArray(galleryData) ? galleryData.length : 0,
        bucketlist: Array.isArray(bucketData) ? bucketData.length : 0,
      })
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Tab Load triggers
  useEffect(() => {
    if (activeTab === 'chords') loadChordsList()
    if (activeTab === 'lyrics') loadLyricsList()
    if (activeTab === 'thoughts') loadThoughtsList()
    if (activeTab === 'gallery') loadGalleryList()
    if (activeTab === 'bucketlist') loadBucketList()
  }, [activeTab])

  // Image Upload helper
  const handleFileUpload = async (file, callbackUrlSetter) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = typeof reader.result === 'string' ? reader.result : ''
      if (!base64) return
      try {
        setMessage({ text: 'Görsel yükleniyor...', type: 'info' })
        const token = localStorage.getItem('authToken') || ''
        const uploadRes = await fetch(`${resolvedApiBase}/api/uploads/image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ imageData: base64 }),
        })
        let data = {}
        const contentType = uploadRes.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          data = await uploadRes.json().catch(() => ({}))
        }
        if (!uploadRes.ok || !data?.url) {
          throw new Error(data?.message || `Sunucu hatası (${uploadRes.status})`)
        }
        callbackUrlSetter(data.url)
        setMessage({ text: '✅ Görsel başarıyla yüklendi. Kaydetmeyi unutmayın!', type: 'success' })
        setTimeout(() => setMessage({ text: '', type: '' }), 5000)
      } catch (err) {
        setMessage({ text: `❌ Yükleme hatası: ${err.message}`, type: 'error' })
      }
    }
    reader.readAsDataURL(file)
  }

  // Chords methods
  const loadChordsList = async () => {
    setChordsLoading(true)
    try {
      const res = await fetch(`${resolvedApiBase}/api/chords`)
      if (res.ok) setChords(await res.json())
    } catch {} finally { setChordsLoading(false) }
  }

  const handleStartEditChord = (chord) => {
    setEditingChordId(chord._id)
    setNewChord({
      title: chord.title || '',
      artist: chord.artist || '',
      originalKey: chord.originalKey || 'Am',
      capo: chord.capo || 0,
      content: chord.content || ''
    })
    document.getElementById('chords-editor-title')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleCancelEditChord = () => {
    setEditingChordId(null)
    setNewChord({ title: '', artist: '', originalKey: 'Am', capo: 0, content: '' })
  }

  const insertChord = (chordName) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = newChord.content || ''
    const before = text.substring(0, start)
    const after = text.substring(end)
    const insertion = `[${chordName}]`
    setNewChord(prev => ({ ...prev, content: before + insertion + after }))
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + insertion.length, start + insertion.length)
    }, 50)
  }

  const handleAddChord = async (e) => {
    e.preventDefault()
    if (!newChord.title.trim() || !newChord.content.trim()) return
    setAddingChord(true)
    try {
      const token = localStorage.getItem('authToken') || ''
      const isEdit = Boolean(editingChordId)
      const url = isEdit ? `${resolvedApiBase}/api/chords/${editingChordId}` : `${resolvedApiBase}/api/chords`
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newChord)
      })
      if (res.ok) {
        setNewChord({ title: '', artist: '', originalKey: 'Am', capo: 0, content: '' })
        setEditingChordId(null)
        setMessage({ text: isEdit ? '✅ Akor başarıyla güncellendi.' : '✅ Akor başarıyla eklendi.', type: 'success' })
        setTimeout(() => setMessage({ text: '', type: '' }), 5000)
        loadChordsList()
        fetchStats()
      }
    } catch {} finally { setAddingChord(false) }
  }

  const handleDeleteChord = async (id) => {
    if (!window.confirm('Bu akoru silmek istediğine emin misin?')) return
    try {
      const token = localStorage.getItem('authToken') || ''
      await fetch(`${resolvedApiBase}/api/chords/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      loadChordsList()
      fetchStats()
    } catch {}
  }

  // Lyrics methods
  const loadLyricsList = async () => {
    setLyricsLoading(true)
    try {
      const res = await fetch(`${resolvedApiBase}/api/lyrics`)
      if (res.ok) setLyrics(await res.json())
    } catch {} finally { setLyricsLoading(false) }
  }

  const handleStartEditLyric = (lyric) => {
    setEditingLyricId(lyric._id)
    setNewLyric({
      title: lyric.title || '',
      artist: lyric.artist || '',
      text: lyric.text || ''
    })
    document.getElementById('lyrics-editor-title')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleAddLyric = async (e) => {
    e.preventDefault()
    if (!newLyric.title.trim() || !newLyric.text.trim()) return
    setAddingLyric(true)
    try {
      const token = localStorage.getItem('authToken') || ''
      const isEdit = Boolean(editingLyricId)
      const url = isEdit ? `${resolvedApiBase}/api/lyrics/${editingLyricId}` : `${resolvedApiBase}/api/lyrics`
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newLyric)
      })
      if (res.ok) {
        setNewLyric({ title: '', artist: '', text: '' })
        setEditingLyricId(null)
        setMessage({ text: isEdit ? '✅ Söz başarıyla güncellendi.' : '✅ Söz başarıyla eklendi.', type: 'success' })
        setTimeout(() => setMessage({ text: '', type: '' }), 5000)
        loadLyricsList()
        fetchStats()
      }
    } catch {} finally { setAddingLyric(false) }
  }

  const handleDeleteLyric = async (id) => {
    if (!window.confirm('Bu sözü silmek istediğine emin misin?')) return
    try {
      const token = localStorage.getItem('authToken') || ''
      await fetch(`${resolvedApiBase}/api/lyrics/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      loadLyricsList()
      fetchStats()
    } catch {}
  }

  // Thoughts methods
  const loadThoughtsList = async () => {
    setThoughtsLoading(true)
    try {
      const res = await fetch(`${resolvedApiBase}/api/thoughts`)
      if (res.ok) setThoughts(await res.json())
    } catch {} finally { setThoughtsLoading(false) }
  }

  const handleAddThought = async (e) => {
    e.preventDefault()
    if (!newThought.text.trim()) return
    setAddingThought(true)
    try {
      const token = localStorage.getItem('authToken') || ''
      const res = await fetch(`${resolvedApiBase}/api/thoughts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newThought)
      })
      if (res.ok) {
        setNewThought({ text: '', mood: 'Mutlu' })
        loadThoughtsList()
        fetchStats()
      }
    } catch {} finally { setAddingThought(false) }
  }

  const handleDeleteThought = async (id) => {
    if (!window.confirm('Düşünceyi silmek istediğine emin misin?')) return
    try {
      const token = localStorage.getItem('authToken') || ''
      await fetch(`${resolvedApiBase}/api/thoughts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      loadThoughtsList()
      fetchStats()
    } catch {}
  }

  // Gallery methods
  const loadGalleryList = async () => {
    setGalleryLoading(true)
    try {
      const res = await fetch(`${resolvedApiBase}/api/gallery`)
      if (res.ok) setGallery(await res.json())
    } catch {} finally { setGalleryLoading(false) }
  }

  const handleAddGallery = async (e) => {
    e.preventDefault()
    if (!newGallery.imageUrl) return
    setAddingGallery(true)
    try {
      const token = localStorage.getItem('authToken') || ''
      const res = await fetch(`${resolvedApiBase}/api/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newGallery)
      })
      if (res.ok) {
        setNewGallery({ imageUrl: '', caption: '' })
        loadGalleryList()
        fetchStats()
      }
    } catch {} finally { setAddingGallery(false) }
  }

  const handleDeleteGallery = async (id) => {
    if (!window.confirm('Bu fotoğrafı galeriden kaldırmak istediğine emin misin?')) return
    try {
      const token = localStorage.getItem('authToken') || ''
      await fetch(`${resolvedApiBase}/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      loadGalleryList()
      fetchStats()
    } catch {}
  }

  // Bucket list methods
  const loadBucketList = async () => {
    setBucketLoading(true)
    try {
      const res = await fetch(`${resolvedApiBase}/api/bucketlist`)
      if (res.ok) setBucketList(await res.json())
    } catch {} finally { setBucketLoading(false) }
  }

  const handleAddBucket = async (e) => {
    e.preventDefault()
    if (!newBucket.text.trim()) return
    setAddingBucket(true)
    try {
      const token = localStorage.getItem('authToken') || ''
      const res = await fetch(`${resolvedApiBase}/api/bucketlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newBucket)
      })
      if (res.ok) {
        setNewBucket({ text: '', category: 'Gezilecek Yerler' })
        loadBucketList()
        fetchStats()
      }
    } catch {} finally { setAddingBucket(false) }
  }

  const handleToggleBucket = async (item) => {
    try {
      const token = localStorage.getItem('authToken') || ''
      await fetch(`${resolvedApiBase}/api/bucketlist/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isCompleted: !item.isCompleted })
      })
      loadBucketList()
    } catch {}
  }

  const handleDeleteBucket = async (id) => {
    if (!window.confirm('Bu hedefi silmek istediğine emin misin?')) return
    try {
      const token = localStorage.getItem('authToken') || ''
      await fetch(`${resolvedApiBase}/api/bucketlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      loadBucketList()
      fetchStats()
    } catch {}
  }

  const onSave = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)
    setMessage({ text: 'Kaydediliyor...', type: 'info' })

    try {
      const token = localStorage.getItem('authToken') || ''
      if (!token) throw new Error('Oturumun süresi dolmuş olabilir. Lütfen tekrar giriş yap.')
      
      const res = await fetch(settingsEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Sunucu hatası oluştu.')
      
      setSettings((prev) => ({ ...prev, ...data }))
      setMessage({ text: '✅ Değişiklikler başarıyla kaydedildi.', type: 'success' })
      setTimeout(() => setMessage({ text: '', type: '' }), 5000)
    } catch (err) {
      setMessage({ text: `❌ Hata: ${err?.message || 'Bilinmeyen bir hata oluştu.'}`, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Pre-calculate line by line details preview
  const livePreviewLines = useMemo(() => {
    const lines = (newChord.content || '').split('\n')
    return lines.map(line => parseBracketLine(line))
  }, [newChord.content])

  const subTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'brand', label: 'Marka & Kimlik', icon: 'auto_awesome' },
    { id: 'home', label: 'Ana Sayfa Metinleri', icon: 'home' },
    { id: 'cards', label: 'Bilgi Kartları', icon: 'view_quilt' },
    { id: 'note', label: 'Günün Notu', icon: 'history_edu' },
    { id: 'chords', label: 'Akor Defteri', icon: 'music_video' },
    { id: 'lyrics', label: 'Söz Defteri', icon: 'music_note' },
    { id: 'thoughts', label: 'Düşünceler', icon: 'psychology' },
    { id: 'gallery', label: 'Galeri Yönetimi', icon: 'collections' },
    { id: 'bucketlist', label: 'Hayaller (Bucket List)', icon: 'checklist' },
  ]

  return (
    <div className="admin-dashboard-wrapper w-full max-w-full overflow-hidden px-1">
      <style>{`
        .admin-dashboard-wrapper {
          animation: dashboardFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .header-card {
  background: var(--input-bg);
  border: 1px solid var(--card-border);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}
.dashboard-grid-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        .side-nav-card {
  background: var(--input-bg);
  border: 1px solid var(--card-border);
  border-radius: 0.5rem;
  padding: 0.5rem;
}
.side-tab-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.9rem 1.1rem;
          border-radius: 1.25rem;
          color: var(--text-muted);
          font-weight: 700;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .side-tab-button:hover {
          background: var(--input-bg);
          color: var(--text-primary);
        }

        .side-tab-button.active {
  background: var(--accent-color);
  color: #ffffff;
  border-radius: 0.5rem;
}
.main-panel-card {
  background: var(--input-bg);
  border: 1px solid var(--card-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  overflow: hidden;
}
.premium-input-group {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .premium-label {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--accent-color);
          margin-bottom: 0.5rem;
        }

        .premium-input {
          width: 100%;
          padding: 0.85rem 1.1rem;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: 0.85rem;
          color: var(--input-text);
          outline: none;
          font-size: 0.95rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .premium-input:focus {
  border-color: var(--accent-color);
  background: var(--card-bg);
}
/* Drag/Drop Box for Uploading Logo */
        .upload-dashed-box {
          border: 2px dashed var(--card-border);
          border-radius: 1rem;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          background: var(--input-bg);
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .upload-dashed-box:hover {
          border-color: var(--accent-color);
          background: var(--card-bg);
        }

        /* Stats Cards */
        .neon-stat-card {
          background: var(--input-bg);
          border: 1px solid var(--card-border);
          border-radius: 1.25rem;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .neon-stat-card:hover {
          transform: translateY(-2px);
          border-color: var(--card-hover-border);
        }

        .neon-stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  background: var(--accent-color);
  color: #ffffff;
}
/* CRUD lists layout */
        .chord-list-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.25rem;
          background: var(--input-bg);
          border: 1px solid var(--card-border);
          border-radius: 1rem;
          margin-bottom: 0.6rem;
          transition: all 0.2s;
        }

        .chord-list-row:hover {
          border-color: var(--card-hover-border);
          background: var(--card-bg);
        }

        .chord-row-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 0;
          flex: 1;
        }

        .chord-row-badge {
  width: 32px;
  height: 32px;
  border-radius: 0.25rem;
  background: var(--accent-color);
  color: #ffffff;
  font-weight: 800;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.chord-row-title-block {
          min-width: 0;
        }

        .chord-row-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chord-row-artist {
          font-size: 0.8rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chord-row-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .badge-pill-micro {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 0.5rem;
          color: var(--text-primary);
        }

        .btn-trash-micro {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s;
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .btn-trash-micro:hover {
          color: var(--accent-color);
          background: var(--input-bg);
        }

        .btn-trash-micro.delete:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        /* Chord Quick Tool buttons */
        .chord-helper-toolbar-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          padding: 0.5rem;
          background: var(--input-bg);
          border: 1px dashed var(--card-border);
          border-radius: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .btn-chord-item-micro {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 800;
          border-radius: 0.35rem;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-chord-item-micro:hover {
          background: var(--accent-color);
          color: #ffffff;
          border-color: var(--accent-color);
        }

        /* Split Screen Mini Preview */
        .split-notebook-mini {
          background: #fefefb;
          border-radius: 1.25rem;
          border-left: 8px solid #e2e8f0;
          padding: 1.25rem 0.75rem 1.25rem 2rem;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06);
          max-height: 420px;
          overflow-y: auto;
          color: #0f172a;
          background-image: 
            linear-gradient(#f8fafc 1px, transparent 1px),
            linear-gradient(90deg, rgba(239,68,68,0.12) 1px, transparent 1px);
          background-size: 100% 2rem, 100% 100%;
          background-position: 0 0.85rem, 1.5rem 0;
        }

        .preview-lines-monoflex {
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.8rem;
          line-height: 2rem;
          white-space: pre;
        }

        .preview-chord-micro {
          color: #e11d48;
          font-weight: 800;
          display: block;
          height: 1rem;
        }

        .preview-lyric-micro {
          color: #334155;
          display: block;
          height: 1rem;
        }

        @keyframes dashboardFadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 350px) {
  .main-panel-card { padding: 0.75rem; }
  .header-card { padding: 0.75rem; }
  .chord-list-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .chord-row-meta { width: 100%; justify-content: flex-end; }
  .neon-stat-card { flex-direction: column; text-align: center; padding: 0.75rem; }
}
@media (max-width: 950px) {
          .dashboard-grid-layout {
            grid-template-columns: 1fr;
          }
          .side-nav-card {
  background: var(--input-bg);
  border: 1px solid var(--card-border);
  border-radius: 0.5rem;
  padding: 0.5rem;
}
.side-tab-button {
            width: auto;
            white-space: nowrap;
            padding: 0.6rem 1rem;
            font-size: 0.85rem;
          }
          .main-panel-card {
            padding: 1.25rem;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="header-card flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-app-text flex items-center gap-2">
            
            Celestial Dashboard
          </h2>
          <p className="text-xs text-app-muted mt-0.5">Sistem ayarları ve tüm sayfa içeriklerinin yönetim merkezi.</p>
        </div>
        <div className="flex items-center gap-3">
          {message.text && (
            <div className={`status-msg ${message.type} py-1.5 px-3 text-xs`}>
              {message.text}
            </div>
          )}
          {activeTab !== 'dashboard' && activeTab !== 'chords' && activeTab !== 'lyrics' && activeTab !== 'thoughts' && activeTab !== 'gallery' && activeTab !== 'bucketlist' && (
            <button
              onClick={onSave}
              disabled={saving || loading}
              className="btn-primary-save py-2 px-5 text-sm"
            >
              
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          )}
        </div>
      </div>

      {/* Grid Dashboard content */}
      <div className="dashboard-grid-layout">
        {/* Navigation Sidebar */}
        <aside className="side-nav-card">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              className={`side-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="main-panel-card w-full overflow-hidden">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-app-text">Kontrol Paneli</h3>
                <p className="text-xs text-app-muted">Tüm site içeriklerinin yönetim durum özeti.</p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="neon-stat-card">
                  <div className="neon-stat-icon bg-rose-400">
                    
                  </div>
                  <div className="stat-info">
                    <h4>Anılar</h4>
                    <p>{stats.memories}</p>
                  </div>
                </div>

                <div className="neon-stat-card">
                  <div className="neon-stat-icon bg-sky-400">
                    
                  </div>
                  <div className="stat-info">
                    <h4>Düşünce</h4>
                    <p>{stats.thoughts}</p>
                  </div>
                </div>

                <div className="neon-stat-card">
                  <div className="neon-stat-icon bg-rose-500">
                    
                  </div>
                  <div className="stat-info">
                    <h4>Akorlar</h4>
                    <p>{stats.chords}</p>
                  </div>
                </div>

                <div className="neon-stat-card">
                  <div className="neon-stat-icon bg-yellow-500">
                    
                  </div>
                  <div className="stat-info">
                    <h4>Sözler</h4>
                    <p>{stats.lyrics}</p>
                  </div>
                </div>

                <div className="neon-stat-card">
                  <div className="neon-stat-icon bg-teal-500">
                    
                  </div>
                  <div className="stat-info">
                    <h4>Galeri</h4>
                    <p>{stats.gallery}</p>
                  </div>
                </div>

                <div className="neon-stat-card">
                  <div className="neon-stat-icon bg-emerald-500">
                    
                  </div>
                  <div className="stat-info">
                    <h4>Hayaller</h4>
                    <p>{stats.bucketlist}</p>
                  </div>
                </div>
              </div>

              {/* System info */}
              <div className="p-5 rounded-2xl bg-app-bg border border-app-border space-y-3">
                <h4 className="font-bold text-sm text-app-text">Hızlı Eylemler</h4>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => setActiveTab('chords')} className="px-3.5 py-1.5 text-xs bg-app-accent/15 text-app-accent hover:bg-app-accent/25 rounded-lg font-bold transition-all">Akor Ekle</button>
                  <button onClick={() => setActiveTab('lyrics')} className="px-3.5 py-1.5 text-xs bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 rounded-lg font-bold transition-all">Şarkı Sözü Yaz</button>
                  <button onClick={() => setActiveTab('gallery')} className="px-3.5 py-1.5 text-xs bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 rounded-lg font-bold transition-all">Fotoğraf Ekle</button>
                  <button onClick={() => setActiveTab('bucketlist')} className="px-3.5 py-1.5 text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 rounded-lg font-bold transition-all">Hayal Ekle</button>
                </div>
              </div>
            </div>
          )}

                    {activeTab === 'brand' && (
            <div className="space-y-6">
              <h3 className="form-section-title">
                Marka & Kimlik
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="premium-input-group">
                    <label className="premium-label">Site Başlığı</label>
                    <input value={form.brandTitle || ''} onChange={(e) => updateField('brandTitle', e.target.value)} className="premium-input" placeholder="Kayra & Hazal" />
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Kayra'nın İsmi</label>
                    <input value={form.kayraName || ''} onChange={(e) => updateField('kayraName', e.target.value)} className="premium-input" />
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Logo Görseli Yükle</label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="logo-upload-box"
                        onChange={e => handleFileUpload(e.target.files?.[0], (url) => updateField('logoUrl', url))}
                      />
                      <label htmlFor="logo-upload-box" className="upload-dashed-box flex-1">
                        <span className="text-xs font-bold text-app-text truncate max-w-[150px]">
                          {form.logoUrl ? 'Görsel Seçildi ✓' : 'Dosya Seç...'}
                        </span>
                      </label>
                      {form.logoUrl && (
                        <div className="w-14 h-14 rounded-2xl bg-app-bg border border-app-border flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img src={form.logoUrl} alt="Logo" className="w-10 h-10 object-cover opacity-90" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">İlişki Başlangıç Tarihi (Tam Saat)</label>
                    <input 
                      type="datetime-local"
                      value={form.relationshipStartDate || ''} 
                      onChange={(e) => updateField('relationshipStartDate', e.target.value)} 
                      className="premium-input" 
                    />
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Logo Bağlantısı (URL)</label>
                    <input value={form.logoUrl || ''} onChange={(e) => updateField('logoUrl', e.target.value)} className="premium-input" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="premium-input-group">
                    <label className="premium-label">Hazal'ın İsmi</label>
                    <input value={form.hazalName || ''} onChange={(e) => updateField('hazalName', e.target.value)} className="premium-input" />
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Site Teması</label>
                    <select 
                      value={form.theme || 'night'} 
                      onChange={(e) => updateField('theme', e.target.value)} 
                      className="premium-input appearance-none cursor-pointer"
                    >
                      <option value="night">Kozmik Gece (Karanlık)</option>
                      <option value="sunset">Gün Batımı (Açık)</option>
                      <option value="aurora">Kuzey Işıkları (Açık)</option>
                      <option value="light">Klasik Beyaz (Açık)</option>
                    </select>
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Kayra Fotoğrafı (URL)</label>
                    <div className="flex gap-2">
                      <input value={form.kayraAvatarUrl || ''} onChange={(e) => updateField('kayraAvatarUrl', e.target.value)} className="premium-input flex-1" placeholder="Görsel linki..." />
                      <label className="bg-[#ccc] px-3 py-2 cursor-pointer font-bold text-black border-2 border-outset flex-shrink-0 text-xs flex items-center">
                        Yükle
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e.target.files?.[0], (url) => updateField('kayraAvatarUrl', url))} />
                      </label>
                    </div>
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Hazal Fotoğrafı (URL)</label>
                    <div className="flex gap-2">
                      <input value={form.hazalAvatarUrl || ''} onChange={(e) => updateField('hazalAvatarUrl', e.target.value)} className="premium-input flex-1" placeholder="Görsel linki..." />
                      <label className="bg-[#ccc] px-3 py-2 cursor-pointer font-bold text-black border-2 border-outset flex-shrink-0 text-xs flex items-center">
                        Yükle
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e.target.files?.[0], (url) => updateField('hazalAvatarUrl', url))} />
                      </label>
                    </div>
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Giriş Ekranı Arka Planı (URL)</label>
                    <div className="flex gap-2">
                      <input value={form.loginBgUrl || ''} onChange={(e) => updateField('loginBgUrl', e.target.value)} className="premium-input flex-1" placeholder="Görsel linki..." />
                      <label className="bg-[#ccc] px-3 py-2 cursor-pointer font-bold text-black border-2 border-outset flex-shrink-0 text-xs flex items-center">
                        Yükle
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e.target.files?.[0], (url) => updateField('loginBgUrl', url))} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'home' && (
            <div className="space-y-6">
              <h3 className="form-section-title">
                
                Ana Sayfa Metinleri
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="premium-input-group">
                    <label className="premium-label">Hoşgeldin Mesajı</label>
                    <input value={form.homeTitle || ''} onChange={(e) => updateField('homeTitle', e.target.value)} className="premium-input" />
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Vurgu Metni</label>
                    <input value={form.homeHighlight || ''} onChange={(e) => updateField('homeHighlight', e.target.value)} className="premium-input" />
                  </div>
                </div>
                <div className="premium-input-group">
                  <label className="premium-label">Şiirsel Alıntı</label>
                  <textarea value={form.homeQuote || ''} onChange={(e) => updateField('homeQuote', e.target.value)} rows={3} className="premium-input resize-none" />
                </div>
                <div className="pt-4 border-t border-app-border">
                  <div className="premium-input-group">
                    <label className="premium-label">Amaç Başlığı</label>
                    <input value={form.purposeTitle || ''} onChange={(e) => updateField('purposeTitle', e.target.value)} className="premium-input" />
                  </div>
                </div>
                <div className="premium-input-group">
                  <label className="premium-label">Amaç Açıklaması</label>
                  <textarea value={form.purposeText || ''} onChange={(e) => updateField('purposeText', e.target.value)} rows={3} className="premium-input resize-none" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="space-y-6">
              <h3 className="form-section-title">
                
                Ekstra Bilgi Kartları
              </h3>
              <div className="space-y-6">
                {[1, 2, 3].map(num => (
                  <div key={num} className="p-5 rounded-2xl bg-app-bg border border-app-border space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-app-accent/20 text-app-accent flex items-center justify-center font-bold text-xs">
                        {num}
                      </div>
                      <h4 className="text-app-text font-bold text-sm">Bilgi Kartı #{num}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="premium-input-group">
                        <label className="premium-label">Küçük Etiket</label>
                        <input value={form[`homeCard${num}Tag`] || ''} onChange={(e) => updateField(`homeCard${num}Tag`, e.target.value)} className="premium-input" />
                      </div>
                      <div className="premium-input-group">
                        <label className="premium-label">Kart Başlığı</label>
                        <input value={form[`homeCard${num}Title`] || ''} onChange={(e) => updateField(`homeCard${num}Title`, e.target.value)} className="premium-input" />
                      </div>
                    </div>
                    <div className="premium-input-group">
                      <label className="premium-label">Kart İçeriği</label>
                      <textarea value={form[`homeCard${num}Text`] || ''} onChange={(e) => updateField(`homeCard${num}Text`, e.target.value)} rows={2} className="premium-input resize-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'note' && (
            <div className="space-y-6">
              <h3 className="form-section-title">
                
                Günün Notu
              </h3>
              <div className="space-y-4">
                <div className="premium-input-group">
                  <label className="premium-label">Not Başlığı</label>
                  <input value={form.homeNoteLabel || ''} onChange={(e) => updateField('homeNoteLabel', e.target.value)} className="premium-input" />
                </div>
                <div className="premium-input-group">
                  <label className="premium-label">Vurgulu Söz</label>
                  <textarea value={form.homeNoteQuote || ''} onChange={(e) => updateField('homeNoteQuote', e.target.value)} rows={2} className="premium-input resize-none" />
                </div>
                <div className="premium-input-group">
                  <label className="premium-label">Detaylı Not</label>
                  <textarea value={form.homeNoteText || ''} onChange={(e) => updateField('homeNoteText', e.target.value)} rows={3} className="premium-input resize-none" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chords' && (
            <div className="space-y-8 w-full max-w-full overflow-hidden">
              <div>
                <h3 id="chords-editor-title" className="form-section-title">
                  
                  {editingChordId ? 'Akoru Düzenle' : 'Yeni Şarkı & Akor Ekle'}
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full overflow-hidden">
                  <form onSubmit={handleAddChord} className="lg:col-span-7 space-y-4 w-full overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="premium-input-group">
                        <label className="premium-label">Şarkı Adı</label>
                        <input 
                          type="text"
                          placeholder="Örn: İstanbul'da Sonbahar"
                          value={newChord.title}
                          onChange={e => setNewChord(prev => ({ ...prev, title: e.target.value }))}
                          className="premium-input"
                          required
                        />
                      </div>
                      <div className="premium-input-group">
                        <label className="premium-label">Sanatçı / Grup</label>
                        <input 
                          type="text"
                          placeholder="Örn: Teoman"
                          value={newChord.artist}
                          onChange={e => setNewChord(prev => ({ ...prev, artist: e.target.value }))}
                          className="premium-input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="premium-input-group">
                        <label className="premium-label">Orijinal Ton (Key)</label>
                        <input 
                          type="text"
                          placeholder="Örn: Am"
                          value={newChord.originalKey}
                          onChange={e => setNewChord(prev => ({ ...prev, originalKey: e.target.value }))}
                          className="premium-input"
                        />
                      </div>
                      <div className="premium-input-group">
                        <label className="premium-label">Kapo Perdesi</label>
                        <input 
                          type="number"
                          placeholder="Örn: 2"
                          value={newChord.capo || ''}
                          onChange={e => setNewChord(prev => ({ ...prev, capo: parseInt(e.target.value) || 0 }))}
                          className="premium-input"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="premium-label">Sözler ve Akorlar</label>
                      <div className="chord-helper-toolbar-flex mb-2">
                        {quickChords.map(q => (
                          <button key={q} type="button" className="btn-chord-item-micro" onClick={() => insertChord(q)}>{q}</button>
                        ))}
                      </div>
                      <textarea 
                        ref={textareaRef}
                        placeholder="Örn: [Am]Mevsim rüzgarları, ne [Dm]zaman eserse"
                        value={newChord.content}
                        onChange={e => setNewChord(prev => ({ ...prev, content: e.target.value }))}
                        className="premium-input resize-none h-44 font-mono w-full"
                        required
                      />
                    </div>

                    <div className="flex gap-4">
                      {editingChordId && (
                        <button type="button" onClick={handleCancelEditChord} className="flex-1 py-3 bg-app-bg border border-app-border hover:bg-app-card hover:border-app-accent transition-all font-bold rounded-xl text-app-text">İptal</button>
                      )}
                      <button type="submit" disabled={addingChord} className="flex-1 py-3 bg-app-accent hover:opacity-90 font-bold rounded-xl text-white shadow-lg">
                        {addingChord ? 'Kaydediliyor...' : editingChordId ? 'Akoru Güncelle' : 'Akor Defterine Ekle'}
                      </button>
                    </div>
                  </form>

                  {/* Preview pane */}
                  <div className="lg:col-span-5 space-y-3 w-full overflow-hidden">
                    <label className="premium-label mb-0">Canlı Önizleme</label>
                    <div className="split-notebook-mini w-full overflow-x-auto">
                      <div className="preview-lines-monoflex">
                        {livePreviewLines.map((line, idx) => (
                          <div key={idx} className="mb-2">
                            {line.chordLine && <span className="preview-chord-micro">{line.chordLine}</span>}
                            <span className="preview-lyric-micro">{line.lyricLine}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saved list */}
              <div className="pt-6 border-t border-app-border w-full max-w-full overflow-hidden">
                <h3 className="form-section-title">Kayıtlı Şarkı Listesi</h3>
                {chordsLoading ? (
                  <p className="text-sm text-app-muted italic">Yükleniyor...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    {chords.map(chord => (
                      <div key={chord._id} className="chord-list-row">
                        <div className="chord-row-info">
                          <div className="chord-row-badge">AK</div>
                          <div className="chord-row-title-block">
                            <h4 className="chord-row-title">{chord.title}</h4>
                            <p className="chord-row-artist">{chord.artist || 'Sanatçı Belirtilmedi'}</p>
                          </div>
                        </div>
                        <div className="chord-row-meta">
                          <span className="badge-pill-micro text-rose-400 font-mono font-bold">{chord.originalKey || 'Ton'}</span>
                          {chord.capo > 0 && <span className="badge-pill-micro">Kapo {chord.capo}</span>}
                          <button onClick={() => handleStartEditChord(chord)} className="btn-trash-micro text-xs px-2 w-auto" type="button">Düzenle</button>
                          <button onClick={() => handleDeleteChord(chord._id)} className="btn-trash-micro delete text-xs px-2 w-auto" type="button">Sil</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'lyrics' && (
            <div className="space-y-6 w-full max-w-full overflow-hidden">
              <h3 id="lyrics-editor-title" className="form-section-title">
                
                {editingLyricId ? 'Sözü Düzenle' : 'Söz Defterine Ekle'}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                <form onSubmit={handleAddLyric} className="lg:col-span-6 space-y-4 w-full">
                  <div className="premium-input-group">
                    <label className="premium-label">Şarkı veya Alıntı Adı</label>
                    <input 
                      type="text"
                      placeholder="Örn: Sor"
                      value={newLyric.title}
                      onChange={e => setNewLyric(prev => ({ ...prev, title: e.target.value }))}
                      className="premium-input"
                      required
                    />
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Sanatçı / Yazar (Opsiyonel)</label>
                    <input 
                      type="text"
                      placeholder="Örn: Duman"
                      value={newLyric.artist}
                      onChange={e => setNewLyric(prev => ({ ...prev, artist: e.target.value }))}
                      className="premium-input"
                    />
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Sözler / Alıntı Metni</label>
                    <textarea 
                      placeholder="Buraya yaz..."
                      value={newLyric.text}
                      onChange={e => setNewLyric(prev => ({ ...prev, text: e.target.value }))}
                      className="premium-input h-40 resize-none w-full"
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    {editingLyricId && (
                      <button type="button" onClick={() => { setEditingLyricId(null); setNewLyric({ title: '', artist: '', text: '' }) }} className="flex-1 py-3 bg-app-bg border border-app-border hover:bg-app-card transition-all font-bold rounded-xl text-app-text">İptal</button>
                    )}
                    <button type="submit" disabled={addingLyric} className="flex-1 py-3 bg-app-accent hover:opacity-90 font-bold rounded-xl text-white shadow-lg">
                      {addingLyric ? 'Kaydediliyor...' : editingLyricId ? 'Sözü Güncelle' : 'Söz Defterine Kaydet'}
                    </button>
                  </div>
                </form>

                {/* Lyrics List */}
                <div className="lg:col-span-6 space-y-3 w-full">
                  <label className="premium-label">Kayıtlı Sözler & Alıntılar</label>
                  {lyricsLoading ? (
                    <p className="text-xs text-app-muted italic">Yükleniyor...</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {lyrics.map(ly => (
                        <div key={ly._id} className="chord-list-row">
                          <div className="chord-row-info">
                            <div className="chord-row-badge bg-yellow-400">SÖZ</div>
                            <div className="chord-row-title-block">
                              <h4 className="chord-row-title">{ly.title}</h4>
                              <p className="chord-row-artist">{ly.artist || 'Yazar Belirtilmedi'}</p>
                            </div>
                          </div>
                          <div className="chord-row-meta">
                            <button onClick={() => handleStartEditLyric(ly)} className="btn-trash-micro text-xs px-2 w-auto" type="button">Düzenle</button>
                            <button onClick={() => handleDeleteLyric(ly._id)} className="btn-trash-micro delete text-xs px-2 w-auto" type="button">Sil</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'thoughts' && (
            <div className="space-y-6 w-full max-w-full overflow-hidden">
              <h3 className="form-section-title">
                
                Düşünce Defterini Yönet
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                <form onSubmit={handleAddThought} className="lg:col-span-5 space-y-4 w-full">
                  <div className="premium-input-group">
                    <label className="premium-label">Düşünceniz (Aklınızdakiler)</label>
                    <textarea 
                      placeholder="Şu an ne düşünüyorsun?"
                      value={newThought.text}
                      onChange={e => setNewThought(prev => ({ ...prev, text: e.target.value }))}
                      className="premium-input h-32 resize-none w-full"
                      required
                    />
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Ruh Hali (Mood)</label>
                    <input 
                      type="text"
                      placeholder="Örn: Mutlu, Aşık, Huzurlu"
                      value={newThought.mood}
                      onChange={e => setNewThought(prev => ({ ...prev, mood: e.target.value }))}
                      className="premium-input"
                    />
                  </div>
                  <button type="submit" disabled={addingThought} className="w-full py-3 bg-app-accent hover:opacity-90 font-bold rounded-xl text-white shadow-lg">
                    {addingThought ? 'Kaydediliyor...' : 'Düşünce Ekle'}
                  </button>
                </form>

                {/* Thoughts List */}
                <div className="lg:col-span-7 space-y-3 w-full">
                  <label className="premium-label">Kayıtlı Düşünceler</label>
                  {thoughtsLoading ? (
                    <p className="text-xs text-app-muted italic">Yükleniyor...</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {thoughts.map(th => (
                        <div key={th._id} className="chord-list-row">
                          <div className="chord-row-info">
                            <div className="chord-row-badge bg-sky-400">FIKR</div>
                            <div className="chord-row-title-block">
                              <h4 className="chord-row-title truncate max-w-[200px]">{th.text}</h4>
                              <p className="chord-row-artist">{th.mood ? `Mood: ${th.mood}` : 'Mood yok'} • {th.author}</p>
                            </div>
                          </div>
                          <div className="chord-row-meta">
                            <button onClick={() => handleDeleteThought(th._id)} className="btn-trash-micro delete text-xs px-2 w-auto" type="button">Sil</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-6 w-full max-w-full overflow-hidden">
              <h3 className="form-section-title">
                
                Fotoğraf Galerisini Yönet
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                <form onSubmit={handleAddGallery} className="lg:col-span-5 space-y-4 w-full">
                  <div className="premium-input-group">
                    <label className="premium-label">Görsel Seç & Yükle</label>
                    <div className="flex gap-4 items-center">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="gallery-file-picker" 
                        onChange={e => handleFileUpload(e.target.files?.[0], (url) => setNewGallery(prev => ({ ...prev, imageUrl: url })))}
                      />
                      <label htmlFor="gallery-file-picker" className="upload-dashed-box flex-1">
                        
                        <span className="text-xs font-bold text-app-text truncate max-w-[150px]">
                          {newGallery.imageUrl ? 'Görsel Yüklendi ✓' : 'Dosya Seç...'}
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Görsel Bağlantısı (URL)</label>
                    <input 
                      type="text"
                      placeholder="https://..."
                      value={newGallery.imageUrl}
                      onChange={e => setNewGallery(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="premium-input"
                      required
                    />
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Fotoğraf Açıklaması (Altyazı)</label>
                    <input 
                      type="text"
                      placeholder="Bizim en sevdiğimiz gün..."
                      value={newGallery.caption}
                      onChange={e => setNewGallery(prev => ({ ...prev, caption: e.target.value }))}
                      className="premium-input"
                    />
                  </div>
                  <button type="submit" disabled={addingGallery || !newGallery.imageUrl} className="w-full py-3 bg-app-accent hover:opacity-90 font-bold rounded-xl text-white shadow-lg">
                    {addingGallery ? 'Ekleniyor...' : 'Galeriye Ekle'}
                  </button>
                </form>

                {/* Gallery List */}
                <div className="lg:col-span-7 space-y-3 w-full">
                  <label className="premium-label">Galerideki Fotoğraflar</label>
                  {galleryLoading ? (
                    <p className="text-xs text-app-muted italic">Yükleniyor...</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
                      {gallery.map(img => (
                        <div key={img._id} className="relative group rounded-xl overflow-hidden border border-app-border aspect-square">
                          <img src={img.imageUrl} alt={img.caption} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                            <p className="text-[10px] truncate">{img.caption || 'Açıklama yok'}</p>
                            <button 
                              onClick={() => handleDeleteGallery(img._id)}
                              className="self-end bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                              type="button"
                            >
                              
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bucketlist' && (
            <div className="space-y-6 w-full max-w-full overflow-hidden">
              <h3 className="form-section-title">
                
                Hayaller & Hedefler (Bucket List)
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                <form onSubmit={handleAddBucket} className="lg:col-span-5 space-y-4 w-full">
                  <div className="premium-input-group">
                    <label className="premium-label">Yapılacak Hayal / Hedef</label>
                    <input 
                      type="text"
                      placeholder="Örn: Birlikte Kapadokya'da balona binmek"
                      value={newBucket.text}
                      onChange={e => setNewBucket(prev => ({ ...prev, text: e.target.value }))}
                      className="premium-input"
                      required
                    />
                  </div>
                  <div className="premium-input-group">
                    <label className="premium-label">Kategori</label>
                    <select 
                      value={newBucket.category}
                      onChange={e => setNewBucket(prev => ({ ...prev, category: e.target.value }))}
                      className="premium-input cursor-pointer"
                    >
                      <option value="Gezilecek Yerler">Gezilecek Yerler</option>
                      <option value="Cilginliklar">Çılgınlıklar</option>
                      <option value="Tatlar">Ortak Tatlar</option>
                      <option value="Diger">Diğer Hayaller</option>
                    </select>
                  </div>
                  <button type="submit" disabled={addingBucket} className="w-full py-3 bg-app-accent hover:opacity-90 font-bold rounded-xl text-white shadow-lg">
                    {addingBucket ? 'Ekleniyor...' : 'Hayal Defterine Ekle'}
                  </button>
                </form>

                {/* Bucket List */}
                <div className="lg:col-span-7 space-y-3 w-full">
                  <label className="premium-label">Ortak Hayallerimiz</label>
                  {bucketLoading ? (
                    <p className="text-xs text-app-muted italic">Yükleniyor...</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {bucketList.map(item => (
                        <div key={item._id} className="chord-list-row py-2 px-3">
                          <div className="flex items-center gap-3 truncate flex-1 mr-2">
                            <input 
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={() => handleToggleBucket(item)}
                              className="accent-rose-400 w-4 h-4 cursor-pointer flex-shrink-0"
                            />
                            <span className={`text-sm truncate ${item.isCompleted ? 'line-through text-app-muted' : 'text-app-text'}`}>
                              {item.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-app-muted px-2 py-0.5 rounded font-bold">{item.category}</span>
                            <button onClick={() => handleDeleteBucket(item._id)} className="btn-trash-micro delete text-xs px-2 w-auto" type="button">Sil</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
