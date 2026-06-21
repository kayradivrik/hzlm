import { useCallback, useEffect, useMemo, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

// Chords Transposition Logic
const notesSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const notesFlat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const noteMap = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
  'A#': 10, 'Bb': 10, 'B': 11
}

function transposeNote(noteStr, semitones, preferSharp = true) {
  let noteIndex = noteMap[noteStr]
  if (noteIndex === undefined) return noteStr
  
  let newIndex = (noteIndex + semitones) % 12
  if (newIndex < 0) newIndex += 12
  
  const scale = preferSharp ? notesSharp : notesFlat
  return scale[newIndex]
}

function transposeChordToken(chordToken, semitones, preferSharp = true) {
  const noteRegex = /[A-G][#b]?/g
  return chordToken.replace(noteRegex, (match) => {
    return transposeNote(match, semitones, preferSharp)
  })
}

function transposeContent(originalContent, semitones, preferSharp = true) {
  if (semitones === 0) return originalContent
  return originalContent.replace(/\[([^\]]+)\]/g, (match, chordToken) => {
    const transposed = transposeChordToken(chordToken, semitones, preferSharp)
    return `[${transposed}]`
  })
}

// Parsing bracketed lyrics to align chords on top of lyrics line by line
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

const recommendedChords = [
  {
    _id: 'rec_1',
    title: "İstanbul'da Sonbahar",
    artist: 'Teoman',
    originalKey: 'Am',
    capo: 0,
    content: `[Am]Mevsim rüzgarları, ne [Dm]zaman eserse
[G]Yolum düşerse, is[C]tanbul'a
[Am]Bir pazar günü, kar[Dm]şımda görürsem
[G]Seni yanımda, is[C]tanbul'a

[Dm]Gözlerimi açarım, [Am]gözlerimi kaparım
[G]Bir tatlı rüya, is[C]tanbul'a
[Dm]İstanbul'da sonbahar, [Am]yine geldi sonbahar
[G]İstanbul'da sonbahar, [C]yine geldi sonbahar`,
    isRecommended: true
  },
  {
    _id: 'rec_2',
    title: "Bak",
    artist: 'Pilli Bebek',
    originalKey: 'Am',
    capo: 2,
    content: `[Am]Bak, hayat [G]geçiyor, [F]akıp gi[E]diyor
[Am]Zamanın [G]koynunda, [F]izler ka[E]lıyor
[Am]Sözler [G]uçuyor, [F]şarkı ka[E]lıyor
[Am]Bizden geriye, [G]bu aşk ka[F]lı[E]yor

[Dm]Ah o gün[Am]ler, [G]güzel gün[C]ler
[Dm]Kalbimizde [Am]hep, [G]yaşaya[E]caklar`,
    isRecommended: true
  },
  {
    _id: 'rec_3',
    title: "Senden Daha Güzel",
    artist: 'Duman',
    originalKey: 'Em',
    capo: 0,
    content: `[Em]Kimseyi görmedim ben, [Am]senden daha güzel
[D]Kimseyi tanımadım ben, [G]senden daha [B7]özel
[Em]Kimselere bakmadım ben, [Am]asla görmedim ben
[D]Senden daha güzel, [G]senden daha [B7]özel

[C]Sana ne [D]şarkılar, [G]yaz[D]dım da [Em]söyledim
[C]Sana ne [D]sözler ver[Em]dim`,
    isRecommended: true
  }
]

export default function NewChordsSection({ settings }) {
  const [dbChords, setDbChords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChordId, setSelectedChordId] = useState(null)
  const [currentTranspose, setCurrentTranspose] = useState(0)
  const [preferSharp, setPreferSharp] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'recommended'

  const endpoint = useMemo(() => `${resolvedApiBase}/api/chords`, [])

  const loadChords = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(endpoint)
      if (res.ok) {
        const data = await res.json()
        setDbChords(Array.isArray(data) ? data : [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    loadChords()
  }, [loadChords])

  // Merge database chords with recommended chords
  const allChords = useMemo(() => {
    return [...dbChords, ...recommendedChords]
  }, [dbChords])

  const selectedChord = useMemo(() => {
    return allChords.find(item => item._id === selectedChordId)
  }, [allChords, selectedChordId])

  // Filter based on active tab and search query
  const filteredChords = useMemo(() => {
    const baseList = activeTab === 'recommended' 
      ? allChords.filter(c => c.isRecommended)
      : allChords

    const query = searchQuery.trim().toLowerCase()
    if (!query) return baseList
    return baseList.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        (item.artist && item.artist.toLowerCase().includes(query))
    )
  }, [allChords, activeTab, searchQuery])

  const processedLines = useMemo(() => {
    if (!selectedChord) return []
    const transposed = transposeContent(selectedChord.content, currentTranspose, preferSharp)
    const lines = transposed.split('\n')
    return lines.map(line => parseBracketLine(line))
  }, [selectedChord, currentTranspose, preferSharp])

  const handleSelectChord = (id) => {
    setSelectedChordId(id)
    setCurrentTranspose(0)
    setPreferSharp(true)
  }

  const handleTransposeChange = (amount) => {
    setCurrentTranspose(prev => {
      let next = prev + amount
      if (next > 11) next = -11
      if (next < -11) next = 11
      return next
    })
  }

  return (
    <div className="modern-chords-container">
      <style>{`
        .modern-chords-container {
          max-width: 950px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .chords-header {
          text-align: center;
          margin-bottom: 3.5rem;
          animation: chordsFadeInUp 0.8s ease-out;
        }

        .chords-header h1 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2.5rem, 8vw, 4rem);
          font-weight: 800;
          color: var(--accent-color);
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .chords-header p {
          color: var(--text-muted);
          font-size: 1.15rem;
          font-style: italic;
        }

        /* Handwritten Tabs Navigation */
        .handwritten-tabs {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .tabs-btn-hand {
          position: relative;
          padding: 0.6rem 2rem;
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-muted);
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tabs-btn-hand.active {
          color: var(--accent-color);
        }

        .tabs-btn-hand.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 10%;
          width: 80%;
          height: 3px;
          background: var(--accent-color);
          border-radius: 2px;
          animation: sketchLine 0.4s forwards;
        }

        @keyframes sketchLine {
          from { width: 0; left: 50%; }
          to { width: 80%; left: 10%; }
        }

        /* Search input styling */
        .search-wrapper-hand {
          position: relative;
          margin-bottom: 3.5rem;
          max-width: 550px;
          margin-left: auto;
          margin-right: auto;
        }

        .search-input-hand {
          width: 100%;
          padding: 1.1rem 1.5rem 1.1rem 3.5rem;
          border-radius: 1.75rem;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          color: var(--text-primary);
          outline: none;
          font-size: 1.05rem;
          box-shadow: 0 10px 25px var(--nav-shadow);
          transition: all 0.3s ease;
        }

        .search-input-hand:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 15px var(--accent-glow);
        }

        .search-icon-hand {
          position: absolute;
          left: 1.35rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        /* Index Card Grid with Washi Tape Details */
        .chords-grid-hand {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 2.5rem 2rem;
          padding-top: 1rem;
        }

        .chord-index-card {
          position: relative;
          background: var(--card-bg);
          backdrop-filter: blur(15px);
          border: 1px solid var(--card-border);
          border-radius: 1.25rem;
          padding: 1.75rem 1.25rem 1.25rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 20px var(--nav-shadow);
        }

        /* Washi Tape - Makes it look completely handdrawn/custom */
        .washi-tape {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%) rotate(-2deg);
          width: 80px;
          height: 22px;
          background: rgba(244, 114, 182, 0.35); /* default sticky color */
          backdrop-filter: blur(2px);
          border-left: 2px dashed rgba(255,255,255,0.4);
          border-right: 2px dashed rgba(255,255,255,0.4);
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          pointer-events: none;
        }

        .chord-index-card:nth-child(2n) .washi-tape {
          background: rgba(14, 165, 233, 0.3); /* sky blue tape */
          transform: translateX(-50%) rotate(3deg);
        }

        .chord-index-card:nth-child(3n) .washi-tape {
          background: rgba(234, 179, 8, 0.28); /* amber tape */
          transform: translateX(-50%) rotate(-1.5deg);
        }

        .chord-index-card:hover {
          transform: translateY(-8px) rotate(1deg);
          border-color: var(--card-hover-border);
          box-shadow: 0 15px 30px var(--accent-glow);
        }

        .chord-card-badge {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-color) 0%, #f43f5e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #ffffff;
          font-size: 0.9rem;
          box-shadow: 0 4px 10px var(--accent-glow);
          margin-bottom: 1rem;
        }

        .chord-card-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .chord-card-artist {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
          font-style: italic;
        }

        .chord-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.25rem;
          padding-top: 0.75rem;
          border-top: 1px dashed var(--card-border);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Spiral Notebook Style details view */
        .notebook-container {
          position: relative;
          margin-top: 1rem;
        }

        .notebook-spiral {
          position: absolute;
          left: 10px;
          top: 0;
          bottom: 0;
          width: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-around;
          padding: 2rem 0;
          pointer-events: none;
          z-index: 10;
        }

        .spiral-ring {
          width: 12px;
          height: 24px;
          border-radius: 6px;
          background: linear-gradient(90deg, #94a3b8, #e2e8f0, #475569);
          border: 1px solid #334155;
          box-shadow: -2px 2px 4px rgba(0,0,0,0.15);
          margin-bottom: 25px;
        }

        .notebook-sheet {
          background: #fdfdf9; /* Warm vintage paper color */
          border-radius: 1.5rem;
          position: relative;
          padding: 3rem 2.5rem 3rem 4rem;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.18);
          border-left: 15px solid #e2e8f0; /* binding edge */
          color: #1e293b; /* Dark text for contrast on paper */
          background-image: 
            linear-gradient(#e2e8f0 1px, transparent 1px), /* notebook paper lines */
            linear-gradient(90deg, rgba(239, 68, 68, 0.18) 1px, transparent 1px); /* margin line */
          background-size: 100% 2.2rem, 100% 100%;
          background-position: 0 1.5rem, 3rem 0;
        }

        .notebook-title-area h2 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(1.35rem, 5vw, 2.25rem);
          font-weight: 800;
          color: #0f172a;
        }

        .notebook-title-area p {
          color: #e11d48; /* Red/pink handwriting theme */
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 0.25rem;
          font-style: italic;
        }

        .notebook-meta-badges {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .badge-paper {
          background: rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 0.75rem;
          padding: 0.4rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
        }

        /* Notebook transposer block */
        .notebook-transposer {
          background: rgba(0, 0, 0, 0.03);
          border: 1px dashed rgba(0, 0, 0, 0.12);
          border-radius: 1.25rem;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 2rem;
          font-family: 'Outfit', sans-serif;
        }

        .transposer-label-hand {
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          letter-spacing: 0.05em;
        }

        .btn-trans-hand {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.15);
          color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }

        .btn-trans-hand:hover {
          border-color: #e11d48;
          color: #e11d48;
          transform: translateY(-1px);
        }

        .val-transpose-hand {
          font-weight: 700;
          color: #0f172a;
          font-size: 1.1rem;
          min-width: 44px;
          text-align: center;
        }

        .flat-sharp-toggle-hand {
          display: flex;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.12);
          padding: 0.2rem;
          border-radius: 0.75rem;
        }

        .btn-toggle-option-hand {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 0.5rem;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-toggle-option-hand.active {
          background: #e11d48;
          color: #ffffff;
        }

        /* Chords Notebook sheet layout */
        .notebook-lines-container {
          font-family: 'Courier New', Courier, monospace;
          font-size: clamp(0.95rem, 2.5vw, 1.15rem);
          line-height: 2.2rem; /* Matches paper line height */
          white-space: pre;
          overflow-x: auto;
          padding: 0.5rem 0.5rem 0.5rem 1rem;
        }

        .chord-line-hand {
          color: #e11d48; /* Ruby/Rose handwriting color */
          font-weight: 800;
          user-select: none;
          display: block;
          height: 1.1rem;
        }

        .lyric-line-hand {
          color: #334155;
          display: block;
          height: 1.1rem;
        }

        .notebook-line-block {
          margin-bottom: 1.1rem;
        }

        @keyframes chordsFadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes chordsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 600px) {
          .notebook-sheet {
            padding: 2rem 1rem 2rem 2rem;
            border-left-width: 8px;
            background-position: 0 1.25rem, 1.25rem 0;
          }
          .notebook-spiral {
            display: none;
          }
          .notebook-transposer {
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .modern-chords-container {
            padding: 1rem 0.25rem;
          }
          .chords-header h1 {
            font-size: 2.2rem;
          }
          .handwritten-tabs {
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          .tabs-btn-hand {
            padding: 0.5rem 0.75rem;
            font-size: 0.95rem;
          }
          .notebook-sheet {
            padding: 1.75rem 0.75rem 1.75rem 1.5rem;
            border-left-width: 6px;
            background-size: 100% 1.8rem, 100% 100%;
            background-position: 0 1.15rem, 1rem 0;
          }
          .notebook-lines-container {
            font-size: 0.75rem;
            line-height: 1.8rem;
            padding: 0.25rem;
          }
          .chord-line-hand {
            height: 0.9rem;
          }
          .lyric-line-hand {
            height: 0.9rem;
          }
          .notebook-line-block {
            margin-bottom: 0.9rem;
          }
        }
      `}</style>

      {selectedChordId && selectedChord ? (
        <div className="chord-detail-view">
          <div className="btn-back-link" onClick={() => setSelectedChordId(null)}>
            <span className="material-symbols-outlined">arrow_back</span>
            Akor Listesine Geri Dön
          </div>

          <div className="notebook-container">
            {/* 3D Notebook spiral rings */}
            <div className="notebook-spiral">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="spiral-ring" />
              ))}
            </div>

            <div className="notebook-sheet animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-200 pb-6 mb-8">
                <div className="notebook-title-area">
                  <h2>{selectedChord.title}</h2>
                  {selectedChord.artist && <p>{selectedChord.artist}</p>}
                </div>
                <div className="notebook-meta-badges">
                  {selectedChord.originalKey && (
                    <div className="badge-paper">
                      Orijinal Ton: {selectedChord.originalKey}
                    </div>
                  )}
                  {selectedChord.capo > 0 && (
                    <div className="badge-paper">
                      Kapo: {selectedChord.capo}. Perde
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Transposer Toolbar */}
              <div className="notebook-transposer">
                <span className="transposer-label-hand">Transpoze Et</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <button className="btn-trans-hand" onClick={() => handleTransposeChange(-1)}>-</button>
                    <span className="val-transpose-hand">
                      {currentTranspose >= 0 ? `+${currentTranspose}` : currentTranspose}
                    </span>
                    <button className="btn-trans-hand" onClick={() => handleTransposeChange(1)}>+</button>
                  </div>
                  {currentTranspose !== 0 && (
                    <button 
                      className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                      onClick={() => setCurrentTranspose(0)}
                    >
                      Sıfırla
                    </button>
                  )}
                </div>

                <div className="flat-sharp-toggle-hand">
                  <button 
                    className={`btn-toggle-option-hand ${preferSharp ? 'active' : ''}`}
                    onClick={() => setPreferSharp(true)}
                  >
                    #
                  </button>
                  <button 
                    className={`btn-toggle-option-hand ${!preferSharp ? 'active' : ''}`}
                    onClick={() => setPreferSharp(false)}
                  >
                    ♭
                  </button>
                </div>
              </div>

              {/* Chords monospaced sheet content */}
              <div className="notebook-lines-container">
                {processedLines.map((line, idx) => {
                  if (!line.chordLine && !line.lyricLine) {
                    return <div key={idx} className="h-8" />
                  }
                  return (
                    <div key={idx} className="notebook-line-block">
                      {line.chordLine ? (
                        <span className="chord-line-hand">{line.chordLine}</span>
                      ) : (
                        <span className="chord-line-hand"></span>
                      )}
                      <span className="lyric-line-hand">{line.lyricLine}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <header className="chords-header">
            <h1>Akor Defterimiz</h1>
            <p>Birlikte çalıp söylemekten en çok keyif aldığımız şarkılar.</p>
          </header>

          {/* Handwritten Style Tabs Selector */}
          <div className="handwritten-tabs">
            <button 
              className={`tabs-btn-hand ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Tüm Akorlar
            </button>
            <button 
              className={`tabs-btn-hand ${activeTab === 'recommended' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommended')}
            >
              Önerilen Akorlar
            </button>
          </div>

          <div className="search-wrapper-hand">
            <span className="material-symbols-outlined search-icon-hand">search</span>
            <input
              type="text"
              className="search-input-hand"
              placeholder="Şarkı adı veya sanatçı ile ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-app-accent"></div>
            </div>
          ) : filteredChords.length === 0 ? (
            <div className="text-center py-20 text-app-muted/40 italic">Bu sekmede akor bulunamadı.</div>
          ) : (
            <div className="chords-grid-hand animate-in fade-in duration-500">
              {filteredChords.map((chord) => (
                <div 
                  key={chord._id} 
                  className="chord-index-card"
                  onClick={() => handleSelectChord(chord._id)}
                >
                  {/* Human touch - Washi tape strip holding the index card */}
                  <div className="washi-tape" />

                  <div className="chord-card-badge">AK</div>
                  <h3 className="chord-card-title">{chord.title}</h3>
                  <p className="chord-card-artist">{chord.artist || 'Sanatçı Belirtilmedi'}</p>
                  
                  <div className="chord-card-footer">
                    <span className="font-mono text-rose-400 font-bold">{chord.originalKey || 'Key'}</span>
                    <span>{chord.capo > 0 ? `Kapo: ${chord.capo}` : 'Kapo yok'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
