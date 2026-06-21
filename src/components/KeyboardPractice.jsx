import React, { useState, useEffect, useCallback } from 'react'

const chars = ['%', '&', '+', ')', '(', '/', '=', '^', '!', "'", '_', '-', '<', '>']

export default function KeyboardPractice() {
  const [targetChar, setTargetChar] = useState('')
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState(null)

  const pickNewChar = useCallback(() => {
    let nextChar = chars[Math.floor(Math.random() * chars.length)]
    while (nextChar === targetChar) {
      nextChar = chars[Math.floor(Math.random() * chars.length)]
    }
    setTargetChar(nextChar)
    setFeedback(null)
  }, [targetChar])

  useEffect(() => {
    pickNewChar()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!targetChar) return
    const handleKeyDown = (e) => {
      // Ignore bare modifiers
      if (['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock'].includes(e.key)) return

      if (e.key === targetChar) {
        setScore(s => s + 10)
        setStreak(s => s + 1)
        setFeedback('correct')
        setTimeout(() => pickNewChar(), 300)
      } else {
        setStreak(0)
        setFeedback('wrong')
        setTimeout(() => setFeedback(null), 300)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [targetChar, pickNewChar])

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-10 min-h-[60vh]">
      <header className="text-center mb-8">
        <h2 className="font-display text-3xl font-semibold mb-2">Klavye Pratiği</h2>
        <p className="text-app-muted text-sm">Zorlu karakterleri hızlı yazma alıştırması.</p>
      </header>

      <div className="flex gap-8 mb-8 text-app-muted text-sm glass-panel px-6 py-2 rounded-full">
        <div>Skor: <span className="text-app-text font-medium">{score}</span></div>
        <div>Seri: <span className="text-app-accent font-medium">{streak} 🔥</span></div>
      </div>

      <div className={`w-40 h-40 glass-panel flex items-center justify-center text-6xl font-display transition-all duration-300 ${
        feedback === 'correct' ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] text-green-400 scale-110' :
        feedback === 'wrong' ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)] text-red-400 scale-95' :
        'border-app-border text-app-accent'
      }`}>
        {targetChar}
      </div>

      <p className="text-xs text-app-muted mt-8 opacity-70">
        Klavyeden ekrandaki karaktere bas.
      </p>
    </div>
  )
}
