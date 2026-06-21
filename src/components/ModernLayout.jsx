import { useMemo, useState, useEffect } from 'react'
import StarField from './StarField'

export default function ModernLayout({ 
  children, 
  theme, 
  toggleTheme, 
  settings, 
  activePage, 
  navigate, 
  handleLogout, 
  canAccessSettings
}) {
  const [parallaxY, setParallaxY] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setParallaxY(window.scrollY * 0.15)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const themeGlows = useMemo(() => {
    if (theme === 'aurora') return { top: 'bg-teal-400/10', bottom: 'bg-emerald-300/10' }
    if (theme === 'sunset') return { top: 'bg-orange-500/10', bottom: 'bg-rose-400/10' }
    if (theme === 'light') return { top: 'bg-rose-400/5', bottom: 'bg-pink-400/5' }
    return { top: 'bg-purple-500/10', bottom: 'bg-fuchsia-500/10' }
  }, [theme])

  const navItems = [
    { id: 'home', icon: 'favorite', label: 'Evim', path: '/' },
    { id: 'journal', icon: 'auto_stories', label: 'Anılar', path: '/journal', protected: true },
    { id: 'chat', icon: 'forum', label: 'Sohbet', path: '/chat', protected: true },
    { id: 'gallery', icon: 'collections', label: 'Galeri', path: '/gallery', protected: true },
    { id: 'thoughts', icon: 'psychology', label: 'Düşünceler', path: '/thoughts', protected: true },
    { id: 'lyrics', icon: 'music_note', label: 'Sözler', path: '/lyrics', protected: true },
    { id: 'chords', icon: 'AK', label: 'Akor Defteri', path: '/chords', protected: true },
    { id: 'movies', icon: 'movie', label: 'Filmler', path: '/movies', protected: true },
    { id: 'bucketlist', icon: 'checklist', label: 'Hayaller', path: '/bucketlist', protected: true },
  ]

  const filteredNavItems = navItems.filter(item => !item.protected || canAccessSettings)

  return (
    <div className="relative min-h-screen bg-app-bg text-app-text font-sans overflow-x-hidden transition-colors duration-1000">
      {/* Background Layer */}
      <StarField theme={theme} />
      
      {/* Dynamic Glows */}
      <div 
        className={`fixed -top-[10%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[120px] transition-colors duration-1000 opacity-60 pointer-events-none ${themeGlows.top}`}
        style={{ transform: `translateY(${parallaxY * 0.2}px)` }}
      />
      <div 
        className={`fixed -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[120px] transition-colors duration-1000 opacity-60 pointer-events-none ${themeGlows.bottom}`}
        style={{ transform: `translateY(${-parallaxY * 0.2}px)` }}
      />

      {/* Modern Top Header */}
      <header className="fixed top-0 left-0 w-full z-[100] px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between backdrop-blur-xl bg-app-card/70 border-b border-app-border transition-all duration-300">
        <div className="flex items-center gap-2 sm:gap-4 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-app-accent to-rose-400 p-[1px] shadow-lg shadow-app-accent/20 group-hover:scale-110 transition-transform duration-500">
            <div className="w-full h-full rounded-2xl bg-app-bg flex items-center justify-center overflow-hidden">
               <img src={settings.logoUrl || '/favicon.svg'} alt="Logo" className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity object-cover" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-app-accent to-rose-400 whitespace-nowrap">
              {settings.brandTitle}
            </span>
            <span className="hidden xs:block text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-app-muted font-medium">Celestial Sanctuary</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-app-card border border-app-border flex items-center justify-center hover:bg-app-accent/10 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-app-accent text-xl sm:text-2xl">palette</span>
          </button>

          {canAccessSettings && (
             <button 
              onClick={() => navigate('/settings')}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all active:scale-90 ${activePage === 'settings' ? 'bg-app-accent/20 border-app-accent text-app-accent' : 'bg-app-card border-app-border text-app-text hover:bg-app-accent/10'}`}
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">settings</span>
            </button>
          )}

          <button 
            onClick={handleLogout}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-app-card border border-app-border flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all active:scale-90 text-red-400"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative pt-24 sm:pt-32 pb-40 px-3 sm:px-8 max-w-6xl mx-auto">
        <div className="modern-content-wrapper">
          {children}
        </div>
      </main>

      {/* Modern Floating Dock Navigation */}
      <div className="fixed bottom-6 sm:bottom-8 left-0 right-0 z-[100] px-2 flex justify-center pointer-events-none">
        <nav className="flex items-center gap-0.5 sm:gap-1 p-1 sm:p-2 rounded-[2rem] sm:rounded-[2.5rem] bg-app-card border border-app-border backdrop-blur-2xl shadow-[0_10px_40px_-10px_var(--nav-shadow)] pointer-events-auto max-w-full overflow-x-auto no-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = activePage === item.id || (item.id === 'home' && activePage === 'home')
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`relative group flex items-center justify-center h-10 sm:h-12 transition-all duration-500 ${isActive ? 'px-4 sm:px-6' : 'w-10 sm:w-12 hover:w-14 sm:hover:w-16'}`}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-[1.5rem] sm:rounded-[1.8rem] bg-gradient-to-r from-app-accent/15 to-rose-400/15 border border-app-accent/30 animate-in fade-in zoom-in-95 duration-300" />
                )}
                <div className={`flex items-center gap-1.5 sm:gap-2 relative z-10 transition-colors duration-300 ${isActive ? 'text-app-accent' : 'text-app-text group-hover:text-app-accent'}`}>
                  {item.icon === 'AK' ? (
                    <span className={`font-bold tracking-tighter ${isActive ? 'text-[14px] sm:text-[16px]' : 'text-[16px] sm:text-[18px]'}`}>
                      AK
                    </span>
                  ) : (
                    <span className={`material-symbols-outlined ${isActive ? 'text-[20px] sm:text-[22px]' : 'text-[22px] sm:text-[24px]'}`}>
                      {item.icon}
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-500 hidden xs:inline">
                      {item.label}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      <style>{`
        .modern-content-wrapper {
          animation: page-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes page-enter {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Modern Card Overrides for New Design */
        [data-design-version="new"] .glass-card {
          background: var(--card-bg) !important;
          border: 1px solid var(--card-border) !important;
          border-radius: 2rem !important;
          backdrop-filter: blur(25px) !important;
          box-shadow: 0 20px 40px var(--nav-shadow) !important;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        
        [data-design-version="new"] .glass-card:hover {
          background: var(--card-hover-bg) !important;
          border-color: var(--card-hover-border) !important;
          transform: translateY(-4px) !important;
        }

        [data-design-version="new"] h1 {
          font-family: 'Outfit', 'Inter', sans-serif !important;
          letter-spacing: -0.02em !important;
        }
      `}</style>
    </div>
  )
}
