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
  const navItems = [
    { id: 'home', icon: 'home', label: 'Evim', path: '/' },
    { id: 'journal', icon: 'auto_stories', label: 'Anılar', path: '/journal', protected: true },
    { id: 'chat', icon: 'forum', label: 'Sohbet', path: '/chat', protected: true },
    { id: 'gallery', icon: 'collections', label: 'Galeri', path: '/gallery', protected: true },
    { id: 'thoughts', icon: 'psychology', label: 'Düşünceler', path: '/thoughts', protected: true },
    { id: 'lyrics', icon: 'music_note', label: 'Sözler', path: '/lyrics', protected: true },
    { id: 'chords', icon: 'AK', label: 'Akor Defteri', path: '/chords', protected: true },
    { id: 'movies', icon: 'movie', label: 'Filmler', path: '/movies', protected: true },
    { id: 'bucketlist', icon: 'checklist', label: 'Hayaller', path: '/bucketlist', protected: true },
    { id: 'typing', icon: 'KEYBOARD', label: 'Hız Testi', path: '/typing' },
    { id: 'capsules', icon: 'CAPSULE', label: 'Kapsül', path: '/capsules', protected: true },
  ]

  const filteredNavItems = navItems.filter(item => !item.protected || canAccessSettings)

  return (
    <div className="relative min-h-screen bg-app-bg text-app-text font-sans overflow-x-hidden transition-colors duration-1000">
      {/* Background Layer */}
      <StarField theme={theme} />

      {/* Minimal Top Header */}
      <header className="fixed top-0 left-0 w-full z-[100] px-4 py-4 flex items-center justify-between bg-app-bg border-b border-app-border transition-all duration-300">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 border border-app-border bg-app-card flex items-center justify-center overflow-hidden">
             <img src={settings.logoUrl || '/favicon.svg'} alt="Logo" className="w-8 h-8 object-cover grayscale" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-app-text font-serif">
              {settings.brandTitle}
            </span>
            <span className="hidden xs:block text-[10px] uppercase tracking-[0.2em] text-app-muted font-medium">Celestial Sanctuary</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 border border-app-border bg-app-card flex items-center justify-center hover:bg-app-accent/10 transition-colors"
          >
            <span className="material-symbols-outlined text-app-text">palette</span>
          </button>

          {canAccessSettings && (
             <button 
              onClick={() => navigate('/settings')}
              className={`w-10 h-10 border flex items-center justify-center transition-colors ${activePage === 'settings' ? 'bg-app-text text-app-bg border-app-text' : 'bg-app-card border-app-border text-app-text hover:bg-app-accent/10'}`}
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          )}

          <button 
            onClick={handleLogout}
            className="w-10 h-10 border border-app-border bg-app-card flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative pt-24 sm:pt-32 pb-40 px-3 sm:px-8 max-w-6xl mx-auto">
        <div className="modern-content-wrapper">
          {children}
        </div>
      </main>

      {/* Minimal Navigation Bar */}
      <div className="fixed bottom-0 md:bottom-8 left-0 right-0 z-[100] px-0 md:px-4 flex justify-center pointer-events-none">
        <nav className="flex items-center justify-start md:justify-center gap-4 sm:gap-6 w-full md:w-auto md:min-w-[400px] max-w-full overflow-x-auto no-scrollbar border-t md:border border-app-border bg-app-bg md:rounded-[2rem] px-4 py-2 pointer-events-auto shadow-sm">
          {filteredNavItems.map((item) => {
            const isActive = activePage === item.id || (item.id === 'home' && activePage === 'home')
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 min-w-[64px] transition-colors py-2 ${isActive ? 'text-app-text' : 'text-app-muted hover:text-app-text'} focus:outline-none`}
              >
                {item.icon === 'AK' ? (
                  <span className="font-bold tracking-tighter text-lg leading-none">AK</span>
                ) : item.icon === 'KEYBOARD' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z M7 10h1v1H7v-1z M11 10h1v1h-1v-1z M15 10h1v1h-1v-1z M7 14h10v1H7v-1z" />
                  </svg>
                ) : item.icon === 'CAPSULE' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 9v3l1.5 1.5" />
                  </svg>
                ) : (
                  <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>
                    {item.icon}
                  </span>
                )}
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      <style>{`
        .modern-content-wrapper {
          animation: page-enter 0.6s ease-out;
        }
        @keyframes page-enter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        h1, h2, h3 {
          font-family: 'Outfit', 'Inter', sans-serif !important;
          letter-spacing: -0.01em !important;
        }
      `}</style>
    </div>
  )
}
