import { useState } from 'react'

export default function EntryGate({ settings, loginEndpoint, onGuestEnter, onLoginSuccess }) {
  const [step, setStep] = useState('choose')
  const [selectedUser, setSelectedUser] = useState('Kayra')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const kayraLabel = settings?.kayraName || 'Kayra'
  const HazalLabel = settings?.hazalName || 'Hazal'
  const selectedLabel = selectedUser === 'Hazal' ? HazalLabel : kayraLabel

  const startPasswordStep = (user) => {
    setSelectedUser(user)
    setPassword('')
    setError('')
    setShowPassword(false)
    setStep('password')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const username = selectedUser === 'Hazal' ? 'Hazal' : 'kayra'
      const res = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Giriş başarısız.')
      onLoginSuccess(data.user, data.token)
    } catch (err) {
      setError(err?.message || 'Giriş başarısız.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center p-4 md:p-6 lg:p-8">
      <div className="w-full overflow-hidden bg-[#1a1a1a] border border-[#333] flex flex-col md:flex-row min-h-[550px] md:min-h-[600px]">
        
        {/* Left Side: Visual Sidebar (hidden on mobile, shown on md+) */}
        <div className="relative hidden md:flex w-1/2 flex-col justify-between p-8 overflow-hidden select-none border-r border-[#333]">
          {/* Background Image with Dark Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={settings?.loginBgUrl || '/dune_background.png'} 
              alt="Dune Landscape" 
              className="h-full w-full object-cover object-center grayscale opacity-30"
            />
            {/* Soft solid overlay */}
            <div className="absolute inset-0 bg-[#1a1a1a]/80" />
          </div>

          {/* Top Row: Logo & Brand & Guest Entry */}
          <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="font-headline text-lg font-bold tracking-wider text-white">
                {settings?.brandTitle || 'Celestial'}
              </span>
            </div>
            <button
              onClick={onGuestEnter}
              className="flex items-center gap-1.5 border border-[#444] bg-[#222] hover:bg-[#333] px-4 py-1.5 text-xs text-white transition-colors cursor-pointer"
            >
              Ziyaretçi Girişi
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>

          {/* Bottom Row: Quote and Pagination dots */}
          <div className="relative z-10 mt-auto space-y-6">
            <p className="text-lg font-medium tracking-wide text-white leading-relaxed font-serif italic max-w-sm">
              "{settings?.homeQuote || 'Sonsuz Bir Yolculuk'}"
            </p>
            
            {/* Pagination Dots */}
            <div className="flex items-center gap-2 pt-2">
              <span className="h-1.5 w-6 rounded-full bg-white transition-all duration-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40 transition-all duration-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40 transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Right Side: Form/Action Panel */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-12 md:py-16 bg-[#1a1a1a]">
          {step === 'choose' ? (
            <div className="w-full max-w-sm mx-auto space-y-8 animate-fade-in">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white font-sans">
                  Giriş Yap
                </h2>
                <p className="text-sm text-gray-400">
                  Devam etmek için profilini seç.
                </p>
              </div>

              {/* Profile Selection Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Kayra Profile Card */}
                <button
                  type="button"
                  onClick={() => startPasswordStep('Kayra')}
                  className="group flex flex-col items-center gap-3 bg-[#222] border border-[#333] hover:border-gray-400 p-5 transition-colors cursor-pointer"
                >
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden bg-[#333] text-xl font-bold text-white transition-transform group-hover:scale-105">
                    {settings?.kayraAvatarUrl ? (
                      <img src={settings.kayraAvatarUrl} alt={kayraLabel} className="h-full w-full object-cover grayscale opacity-80" />
                    ) : (
                      'K'
                    )}
                  </div>
                  <span className="font-semibold text-gray-400 group-hover:text-white">
                    {kayraLabel}
                  </span>
                </button>

                {/* Hazal Profile Card */}
                <button
                  type="button"
                  onClick={() => startPasswordStep('Hazal')}
                  className="group flex flex-col items-center gap-3 bg-[#222] border border-[#333] hover:border-gray-400 p-5 transition-colors cursor-pointer"
                >
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden bg-[#333] text-xl font-bold text-white transition-transform group-hover:scale-105">
                    {settings?.hazalAvatarUrl ? (
                      <img src={settings.hazalAvatarUrl} alt={HazalLabel} className="h-full w-full object-cover grayscale opacity-80" />
                    ) : (
                      'Z'
                    )}
                  </div>
                  <span className="font-semibold text-gray-400 group-hover:text-white">
                    {HazalLabel}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#333]"></div>
                </div>
                <span className="relative px-3 text-[11px] uppercase tracking-wider text-gray-500 bg-[#1a1a1a]">
                  Veya
                </span>
              </div>

              {/* Guest Access Button */}
              <button
                type="button"
                onClick={onGuestEnter}
                className="w-full flex items-center justify-center gap-2 border border-[#333] hover:border-gray-500 bg-[#222] hover:bg-[#333] py-3.5 px-4 text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">explore</span>
                Ziyaretçi Olarak Göz At
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm mx-auto space-y-8 animate-fade-in">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setStep('choose')
                  setPassword('')
                  setError('')
                }}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-white uppercase tracking-wider transition-colors duration-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Geri Dön
              </button>

              <div className="space-y-4">
                {/* Active user display */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden text-base font-bold text-white bg-[#333]">
                    {selectedUser === 'Hazal' ? (
                      settings?.hazalAvatarUrl ? (
                        <img src={settings.hazalAvatarUrl} alt={HazalLabel} className="h-full w-full object-cover" />
                      ) : (
                        'Z'
                      )
                    ) : (
                      settings?.kayraAvatarUrl ? (
                        <img src={settings.kayraAvatarUrl} alt={kayraLabel} className="h-full w-full object-cover" />
                      ) : (
                        'K'
                      )
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white leading-none">
                      {selectedLabel}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Hesabına giriş yapılıyor
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Password field with show/hide toggle */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Şifre
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Şifreni gir"
                      className="w-full bg-[#222] border border-[#333] focus:border-gray-500 focus:outline-none px-4 py-3.5 pr-11 text-sm transition-colors text-white placeholder:text-gray-600"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Keep me logged in checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-white/[0.05] text-[#7C5DFA] focus:ring-[#7C5DFA]/50 focus:ring-offset-0 focus:ring-1"
                  />
                  <span className="text-xs text-gray-400 font-medium">Oturumu açık tut</span>
                </label>

                {/* Error Box */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs text-red-400 font-medium text-center">{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black font-semibold py-3.5 px-4 text-sm transition-colors disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Giriş Yapılıyor...
                    </>
                  ) : (
                    'Giriş Yap'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
