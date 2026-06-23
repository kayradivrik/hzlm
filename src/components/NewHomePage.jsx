import { useEffect, useState } from 'react'

export default function NewHomePage({ settings }) {
  const [mounted, setMounted] = useState(false)
  const [elapsed, setElapsed] = useState({ years: 0, months: 0, days: 0, hours: 0, minutes: 0 })

  useEffect(() => {
    setMounted(true)
    
    const startDate = settings.relationshipStartDate 
      ? new Date(settings.relationshipStartDate) 
      : new Date('2026-06-08T00:00:00');

    const updateTimer = () => {
      const now = new Date()
      let diff = now - startDate
      if (diff < 0) diff = 0
      
      const daysTotal = Math.floor(diff / (1000 * 60 * 60 * 24))
      const years = Math.floor(daysTotal / 365)
      const months = Math.floor((daysTotal % 365) / 30)
      const days = (daysTotal % 365) % 30
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      setElapsed({ years, months, days, hours, minutes })
    }

    updateTimer()
    const timer = setInterval(updateTimer, 60000)
    return () => clearInterval(timer)
  }, [settings.relationshipStartDate])

  return (
    <div className={`space-y-12 sm:space-y-24 pb-20 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Hero Section */}
      <section className="pt-8">
        <div className="max-w-3xl">
          <span className="text-sm text-app-accent font-medium mb-3 block">Bize Özel</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-app-text leading-tight mb-4">
            {settings.homeTitle}{' '}
            <span className="text-app-accent italic font-serif">
              {settings.homeHighlight}
            </span>
          </h1>
          <p className="mt-6 text-xl sm:text-2xl text-app-text/80 font-light italic leading-relaxed pl-6 border-l-2 border-app-accent/30">
            "{settings.homeQuote}"
          </p>
        </div>
      </section>

      {/* Relationship Counter */}
      <section className="bg-app-card border border-app-border rounded-2xl p-6 sm:p-10 shadow-sm">
        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-widest text-app-muted font-bold">Birlikte Geçen Zaman</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
          {elapsed.years > 0 && (
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-serif text-app-text">{elapsed.years}</span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-app-muted mt-2">Yıl</span>
            </div>
          )}
          {(elapsed.years > 0 || elapsed.months > 0) && (
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-serif text-app-text">{elapsed.months}</span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-app-muted mt-2">Ay</span>
            </div>
          )}
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-5xl font-serif text-app-text">{elapsed.days}</span>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-app-muted mt-2">Gün</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-5xl font-serif text-app-text">{elapsed.hours}</span>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-app-muted mt-2">Saat</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-5xl font-serif text-app-text">{elapsed.minutes}</span>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-app-muted mt-2">Dakika</span>
          </div>
        </div>
      </section>

      {/* Editorial Content Layout */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mt-16">
        {/* Purpose Block */}
        <div className="bg-app-card border border-app-border rounded-2xl p-8 sm:p-10 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-2xl font-bold text-app-text mb-4 font-serif">{settings.purposeTitle}</h2>
          <p className="text-lg text-app-text/80 leading-relaxed whitespace-pre-wrap">
            {settings.purposeText}
          </p>
        </div>

        {/* Note Block */}
        <div className="bg-app-accent/5 border border-app-accent/10 rounded-2xl p-8 sm:p-10 shadow-sm flex flex-col justify-center">
          <span className="text-sm text-app-accent font-medium mb-3">{settings.homeNoteLabel}</span>
          <p className="text-xl italic text-app-text leading-relaxed font-serif mb-6">
            "{settings.homeNoteQuote}"
          </p>
          <p className="text-sm text-app-text/70">
            {settings.homeNoteText}
          </p>
        </div>
      </section>

      {/* Feature Blocks */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-12">
        {[
          { tag: settings.homeCard1Tag, title: settings.homeCard1Title, text: settings.homeCard1Text },
          { tag: settings.homeCard2Tag, title: settings.homeCard2Title, text: settings.homeCard2Text },
          { tag: settings.homeCard3Tag, title: settings.homeCard3Title, text: settings.homeCard3Text },
        ].map((card, idx) => (
          <div key={idx} className="bg-app-card border border-app-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-xs text-app-accent font-semibold mb-2 block">{card.tag}</span>
            <h3 className="text-xl font-bold text-app-text mb-3">{card.title}</h3>
            <p className="text-sm text-app-text/70 leading-relaxed">
              {card.text}
            </p>
          </div>
        ))}
      </section>
    </div>
  )
}
