import { useState, useEffect, useRef } from 'react'

// Extended list of common Turkish words for the typing test
const WORDS = [
  "ve", "bir", "bu", "da", "için", "ile", "çok", "ama", "daha", "var", "gibi", "en", "o", "ki", "ne", "kadar", "de", "iyi", "zaman", "yok", "ben", "kendi", "sen", "gün", "her", "veya", "şey", "diye", "sonra", "doğru", "büyük", "iki", "tek", "olur", "olan", "hem", "değil", "ise", "başka", "önce", "yeni", "yer", "aynı", "ilk", "hiç", "tüm", "ev", "iş", "siz", "yol", "güzel", "son", "fazla", "neden", "şimdi", "kötü", "hayat", "uzun", "küçük", "insan", "sadece", "artık", "biz", "bugün", "ay", "bütün", "nasıl", "ancak", "yine", "böyle", "olarak", "tam", "az", "hiçbir", "yıl", "onlar", "önemli", "zor", "bazı", "göre", "birlikte", "hemen", "gerçek", "belki", "büyük", "iyi", "yüz", "kız", "erkek", "çocuk", "anne", "baba", "kardeş", "göz", "el", "baş", "kalp", "sevgi", "aşk", "mutlu", "üzgün"
]

export default function NewTypingTestSection({ settings, currentUser }) {
  const [words, setWords] = useState([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentInput, setCurrentInput] = useState('')
  const [history, setHistory] = useState([]) // Array of true/false/undefined (undefined=not typed)
  
  const [status, setStatus] = useState('waiting') // waiting, playing, finished
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerInterval, setTimerInterval] = useState(null)
  
  const [scores, setScores] = useState([])
  const [loadingScores, setLoadingScores] = useState(false)

  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const activeWordRef = useRef(null)

  const apiBase = import.meta.env.VITE_API_BASE_URL || ''
  const resolvedApiBase = import.meta.env.DEV ? apiBase : (apiBase && apiBase.includes('localhost') ? '' : apiBase)
  const endpoint = `${resolvedApiBase}/api/typing-scores`

  useEffect(() => {
    generateWords()
    fetchScores()
    return () => clearInterval(timerInterval)
  }, [])

  const fetchScores = async () => {
    setLoadingScores(true)
    try {
      const res = await fetch(endpoint)
      if (res.ok) {
        const data = await res.json()
        setScores(data)
      }
    } catch {
      console.error('Skorlar yüklenemedi')
    } finally {
      setLoadingScores(false)
    }
  }

  const generateWords = () => {
    const shuffled = []
    for (let i = 0; i < 200; i++) {
      shuffled.push(WORDS[Math.floor(Math.random() * WORDS.length)])
    }
    setWords(shuffled)
    setCurrentWordIndex(0)
    setCurrentInput('')
    setHistory([])
  }

  const startGame = () => {
    setStatus('playing')
    setTimeLeft(60)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setStatus('finished')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setTimerInterval(interval)
  }

  useEffect(() => {
    if (status === 'finished') {
      calculateAndSaveScore()
    }
  }, [status])

  const calculateAndSaveScore = async () => {
    let correctKeystrokes = 0
    let incorrectKeystrokes = 0
    let correctWords = 0

    history.forEach((isCorrect, idx) => {
      if (isCorrect) {
        correctWords++
        correctKeystrokes += words[idx].length + 1 // +1 for space
      } else {
        incorrectKeystrokes += words[idx].length + 1
      }
    })

    const totalMinutes = 1
    const wpm = Math.round(correctKeystrokes / 5 / totalMinutes)
    const totalAttempted = correctKeystrokes + incorrectKeystrokes
    const accuracy = totalAttempted > 0 ? Math.round((correctKeystrokes / totalAttempted) * 100) : 0

    // Save to DB if logged in
    const token = localStorage.getItem('authToken')
    if (token) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ wpm, accuracy })
        })
        if (res.ok) {
          fetchScores()
        }
      } catch (err) {
        console.error('Score saving failed')
      }
    }
  }

  const handleInputChange = (e) => {
    if (status === 'waiting') {
      startGame()
    }
    
    if (status === 'finished') return

    const value = e.target.value
    
    if (value.endsWith(' ')) {
      const typedWord = value.trim()
      if (typedWord === '') {
        setCurrentInput('')
        return
      }
      
      const isCorrect = typedWord === words[currentWordIndex]
      setHistory(prev => {
        const newHistory = [...prev]
        newHistory[currentWordIndex] = isCorrect
        return newHistory
      })
      
      setCurrentWordIndex(prev => prev + 1)
      setCurrentInput('')
    } else {
      setCurrentInput(value)
    }
  }

  const handleRestart = () => {
    if (timerInterval) clearInterval(timerInterval)
    setStatus('waiting')
    generateWords()
    setTimeLeft(60)
    if (inputRef.current) inputRef.current.focus()
  }

  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      // Kelimenin yukarıdan uzaklığına (offsetTop) göre container'ı kaydır
      const container = containerRef.current;
      const activeWord = activeWordRef.current;
      // 40 piksel üstten boşluk bırakarak smooth scroll yap
      container.scrollTo({
        top: activeWord.offsetTop - 40,
        behavior: 'smooth'
      });
    }
  }, [currentWordIndex])

  const getWordClass = (index) => {
    if (index < currentWordIndex) {
      return history[index] ? 'text-green-600' : 'text-red-500 line-through'
    }
    if (index === currentWordIndex) {
      // Check partial match
      const isMismatch = currentInput && !words[index].startsWith(currentInput)
      return isMismatch ? 'bg-red-200 text-red-900 rounded px-1' : 'bg-app-accent/20 text-app-text rounded px-1'
    }
    return 'text-app-text/50'
  }

  // Calculate live stats
  const liveCorrectWords = history.filter(Boolean).length
  const liveWpm = Math.round((liveCorrectWords * 5) / 5) // Simplified live estimation

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-fade-in pt-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-serif text-app-text">Klavye Hız Testi</h1>
        <p className="text-app-text/70 italic">Dakikada kaç kelime yazabiliyorsun?</p>
      </div>

      <div className="bg-app-card border border-app-border rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-6">
            <div className="text-2xl font-serif text-app-text">
              <span className="text-app-accent">{timeLeft}</span> saniye
            </div>
            {status === 'playing' && (
               <div className="text-sm text-app-muted uppercase tracking-widest">WPM: {liveWpm}</div>
            )}
          </div>
          <button 
            onClick={handleRestart}
            className="flex items-center gap-2 px-4 py-2 text-sm text-app-text/70 hover:text-app-text hover:bg-app-accent/10 rounded-xl transition-colors border border-transparent hover:border-app-accent/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Yeniden Başlat
          </button>
        </div>

        {status !== 'finished' ? (
          <div className="space-y-6">
            <div 
              ref={containerRef}
              className="w-full text-2xl leading-relaxed tracking-wide font-serif h-[160px] overflow-hidden relative select-none rounded-xl bg-app-bg border border-app-border/50 p-4"
              onClick={() => inputRef.current && inputRef.current.focus()}
            >
              <div className="flex flex-wrap gap-x-3 gap-y-4">
                {words.map((word, idx) => (
                  <span 
                    key={idx} 
                    ref={idx === currentWordIndex ? activeWordRef : null}
                    className={`transition-colors duration-150 ${getWordClass(idx)}`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={handleInputChange}
                disabled={status === 'finished'}
                className="w-full max-w-md px-6 py-4 text-xl text-center bg-app-bg border-2 border-app-accent/30 rounded-2xl focus:border-app-accent focus:ring-0 outline-none transition-all placeholder-app-muted font-serif"
                placeholder={status === 'waiting' ? "Başlamak için yazmaya başla..." : ""}
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <h2 className="text-2xl font-serif text-app-text mb-8">Süre Doldu!</h2>
            <div className="flex justify-center gap-12">
              <div className="flex flex-col items-center">
                <span className="text-6xl font-serif text-app-accent">
                  {Math.round((history.filter(Boolean).length * 5) / 5)}
                </span>
                <span className="text-xs uppercase tracking-widest text-app-muted mt-3">WPM</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-6xl font-serif text-app-text">
                  {history.length > 0 ? Math.round((history.filter(Boolean).length / history.length) * 100) : 0}%
                </span>
                <span className="text-xs uppercase tracking-widest text-app-muted mt-3">Doğruluk</span>
              </div>
            </div>
            <button 
              onClick={handleRestart}
              className="mt-12 px-8 py-3 bg-app-accent text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium"
            >
              Tekrar Dene
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="mt-16">
        <h3 className="text-lg font-serif text-app-text text-center mb-6 flex items-center justify-center gap-3">
          <svg className="w-5 h-5 text-app-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Skor Tablosu
        </h3>
        
        <div className="bg-app-card border border-app-border rounded-2xl overflow-hidden shadow-sm max-w-2xl mx-auto">
          {loadingScores ? (
            <div className="p-8 text-center text-app-muted text-sm">Skorlar yükleniyor...</div>
          ) : scores.length === 0 ? (
            <div className="p-8 text-center text-app-muted text-sm">Henüz rekor kırılmamış. İlk sen ol!</div>
          ) : (
            <div className="divide-y divide-app-border">
              {scores.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-4 hover:bg-app-accent/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-app-muted font-mono w-6 text-right">#{i + 1}</span>
                    <span className={`font-serif font-medium ${s.author === 'Kayra' ? 'text-blue-600' : 'text-pink-600'}`}>
                      {s.author}
                    </span>
                  </div>
                  <div className="flex gap-8 text-sm">
                    <div className="w-16 text-right"><span className="font-bold text-app-text">{s.wpm}</span> <span className="text-app-muted text-xs">WPM</span></div>
                    <div className="w-16 text-right"><span className="font-bold text-app-text">{s.accuracy}%</span> <span className="text-app-muted text-xs">ACC</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
