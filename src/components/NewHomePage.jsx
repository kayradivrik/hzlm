import { useEffect, useRef } from 'react'

export default function NewHomePage({ settings }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0')
            entry.target.classList.remove('opacity-0', 'translate-y-10')
          }
        })
      },
      { threshold: 0.1 }
    )

    const sections = containerRef.current.querySelectorAll('.animate-on-scroll')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="space-y-12 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 ease-out">
        <div className="relative px-2 sm:px-0">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.5em] text-app-accent font-bold mb-4 block">Sana Özel Bir Alan</span>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight text-app-text leading-[1.1] sm:leading-tight">
            {settings.homeTitle}
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-app-accent via-rose-400 to-app-accent bg-[length:200%_auto] animate-gradient-flow italic">
              {settings.homeHighlight}
            </span>
          </h1>
          <p className="mt-6 sm:mt-8 text-lg sm:text-xl md:text-2xl text-app-text/90 max-w-2xl font-light italic leading-relaxed border-l-2 border-app-accent/30 pl-4 sm:pl-6">
            "{settings.homeQuote}"
          </p>
        </div>
      </section>

      {/* Purpose & Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Purpose Card - Large */}
        <div className="md:col-span-8 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 delay-100 ease-out">
          <div className="glass-card group relative h-full p-6 sm:p-8 overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-app-accent/10 rounded-full blur-[80px] group-hover:bg-app-accent/20 transition-all duration-700" />
            <h2 className="text-2xl sm:text-3xl font-bold text-app-text mb-4 sm:mb-6 relative z-10">{settings.purposeTitle}</h2>
            <p className="text-base sm:text-lg text-app-text/90 leading-relaxed relative z-10 whitespace-pre-wrap">
              {settings.purposeText}
            </p>
          </div>
        </div>

        {/* Note Card - Vertical */}
        <div className="md:col-span-4 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 delay-200 ease-out">
          <div className="h-full p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-app-accent/15 via-app-accent/5 to-transparent border border-app-accent/20 flex flex-col justify-between hover:shadow-lg hover:border-app-accent/30 hover:-translate-y-1 transition-all duration-500 shadow-md">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-app-accent font-bold">{settings.homeNoteLabel}</span>
              <p className="mt-4 sm:mt-6 text-lg sm:text-xl italic text-app-text leading-relaxed font-medium">
                "{settings.homeNoteQuote}"
              </p>
            </div>
            <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-app-muted font-semibold">
              {settings.homeNoteText}
            </p>
          </div>
        </div>

        {/* Feature Cards - 3 Columns */}
        {[
          { tag: settings.homeCard1Tag, title: settings.homeCard1Title, text: settings.homeCard1Text, delay: 300 },
          { tag: settings.homeCard2Tag, title: settings.homeCard2Title, text: settings.homeCard2Text, delay: 400 },
          { tag: settings.homeCard3Tag, title: settings.homeCard3Title, text: settings.homeCard3Text, delay: 500 },
        ].map((card, idx) => (
          <div key={idx} className="md:col-span-4 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 ease-out" style={{ transitionDelay: `${card.delay}ms` }}>
            <div className="glass-card p-6 sm:p-8 group h-full">
              <span className="text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-app-accent font-bold group-hover:text-rose-400 transition-colors">{card.tag}</span>
              <h3 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-app-text">{card.title}</h3>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-app-muted leading-relaxed">
                {card.text}
              </p>
            </div>
          </div>
        ))}
      </section>

      <style>{`
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-flow {
          background-size: 200% auto;
          animation: gradient-flow 6s linear infinite;
        }
      `}</style>
    </div>
  )
}
