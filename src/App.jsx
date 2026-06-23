import { useEffect, useMemo, useState } from 'react'
import AdminPanel from './components/AdminPanel'
import EntryGate from './components/EntryGate'
import StarField from './components/StarField'
import ModernLayout from './components/ModernLayout'
import NewHomePage from './components/NewHomePage'
import NewMemoriesSection from './components/NewMemoriesSection'
import NewGallerySection from './components/NewGallerySection'
import NewChatSection from './components/NewChatSection'
import NewThoughtsSection from './components/NewThoughtsSection'
import NewMoviesSection from './components/NewMoviesSection'
import NewBucketListSection from './components/NewBucketListSection'
import NewLyricsSection from './components/NewLyricsSection'
import NewChordsSection from './components/NewChordsSection'
import NewTimeCapsuleSection from './components/NewTimeCapsuleSection'
import NewTypingTestSection from './components/NewTypingTestSection'

const defaultSettings = {
  brandTitle: 'Kayra & Hazal',
  theme: 'night',
  homeTitle: 'Hos geldin',
  homeHighlight: 'Kayra & Hazal',
  homeQuote: 'Seninle gecen her an, gokyuzundeki en parlak yildizdan daha kiymetli.',
  homeCard1Tag: 'Birlikte',
  homeCard1Title: 'Ayni gokyuzu',
  homeCard1Text: 'Nereye gidersek gidelim, ayni yildizlara bakip ayni duayi ediyoruz.',
  homeCard2Tag: 'Sabir',
  homeCard2Title: 'Her gun yeniden',
  homeCard2Text: 'Birlikte guzel olmamiz tesaduf degil; her gun secilen bir emek.',
  homeCard3Tag: 'Huzur',
  homeCard3Title: 'Kalbimin evi',
  homeCard3Text: 'Sesini duydugumda dunya yavaslar; her sey yerini bulmus gibi olur.',
  homeNoteLabel: 'Bugunun notu',
  homeNoteQuote: 'Bazi insanlar hayata sonradan girer ama sanki hep varmis gibi hissettirir.',
  homeNoteText: 'Burasi zamanla buyuyecek; anilar, kucuk notlar and icten cumleler burada birikecek.',
  kayraName: 'Kayra',
  hazalName: 'Hazal',
  logoUrl: '/celestial_logo.png',
  purposeTitle: "Hazal'ya bu siteyi yapma amacim",
  purposeText:
    'Sana hissettiklerimi siradan bir mesajla degil, kalici bir sey ile anlatmak istedim. Bu sayfa ikimizin anilarini saklasin diye var.',
  kayraAvatarUrl: '',
  hazalAvatarUrl: '',
  loginBgUrl: '/dune_background.png',
  relationshipStartDate: '2026-06-08T00:00:00', // 8 Haziran
}

function getActivePage(pathname) {
  const p = pathname || '/'
  if (p === '/gallery') return 'gallery'
  if (p === '/journal') return 'journal'
  if (p === '/chat') return 'chat'
  if (p === '/thoughts') return 'thoughts'
  if (p === '/movies') return 'movies'
  if (p === '/bucketlist') return 'bucketlist'
  if (p === '/lyrics') return 'lyrics'
  if (p === '/chords') return 'chords'
  if (p === '/capsules') return 'capsules'
  if (p === '/typing') return 'typing'
  if (p === '/settings') return 'settings'
  return 'home'
}

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname || '/')
  const activePage = getActivePage(path)

  const [settings, setSettings] = useState(defaultSettings)
  const [settingsLoading, setSettingsLoading] = useState(true)

  const [theme, setTheme] = useState(() => localStorage.getItem('siteTheme') || 'night')

  useEffect(() => {
    localStorage.setItem('siteTheme', theme)
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme)
    }
  }, [settings])

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'night') return 'sunset'
      if (prev === 'sunset') return 'aurora'
      if (prev === 'aurora') return 'light'
      return 'night'
    })
  }



  const apiBase = import.meta.env.VITE_API_BASE_URL || ''
  const resolvedApiBase = import.meta.env.DEV
    ? apiBase
    : apiBase && apiBase.includes('localhost')
      ? ''
      : apiBase
  const settingsEndpoint = useMemo(() => `${resolvedApiBase}/api/settings`, [resolvedApiBase])
  const loginEndpoint = useMemo(() => `${resolvedApiBase}/api/auth/login`, [resolvedApiBase])
  
  const [authState, setAuthState] = useState(() => ({
    user: localStorage.getItem('authUser') || '',
    token: localStorage.getItem('authToken') || '',
  }))
  const [hasEnteredSite, setHasEnteredSite] = useState(() => window.sessionStorage.getItem('entryPassed') === '1')

  const navigate = (to) => {
    if (!to) return
    if (window.location.pathname === to) return
    window.history.pushState({}, '', to)
    setPath(to)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const markEntryAsDone = () => {
    window.sessionStorage.setItem('entryPassed', '1')
    setHasEnteredSite(true)
  }

  const handleGuestEnter = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    localStorage.setItem('pendingLoginUser', 'Guest')
    setAuthState({ user: '', token: '' })
    markEntryAsDone()
    navigate('/')
  }

  const handleLoginSuccess = (user, token) => {
    if (!user || !token) return
    localStorage.setItem('authUser', user)
    localStorage.setItem('authToken', token)
    localStorage.removeItem('pendingLoginUser')
    setAuthState({ user, token })
    markEntryAsDone()
    navigate('/')
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    localStorage.removeItem('pendingLoginUser')
    window.sessionStorage.removeItem('entryPassed')
    setAuthState({ user: '', token: '' })
    setHasEnteredSite(false)
    navigate('/')
  }

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname || '/')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setAuthState({
      user: localStorage.getItem('authUser') || '',
      token: localStorage.getItem('authToken') || '',
    })
  }, [path, hasEnteredSite])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(settingsEndpoint)
        if (!res.ok) throw new Error('Ayarlar alinamadi')
        const data = await res.json()
        setSettings((prev) => ({ ...prev, ...(data || {}) }))
      } catch {
        // Varsayılan değerler kalsın.
      } finally {
        setSettingsLoading(false)
      }
    }
    loadSettings()
  }, [settingsEndpoint])

  const canAccessSettings = Boolean(authState.token) && (authState.user === 'Kayra' || authState.user === 'Hazal')

  useEffect(() => {
    if (activePage !== 'home' && !canAccessSettings)
      navigate('/')
  }, [activePage, canAccessSettings])

  const mainContent = (
    <>
      {activePage === 'home' && <NewHomePage settings={settings} />}
      {activePage === 'journal' && <NewMemoriesSection settings={settings} />}
      {activePage === 'gallery' && <NewGallerySection settings={settings} />}
      {activePage === 'chat' && <NewChatSection currentUser={authState.user} />}
      {activePage === 'thoughts' && <NewThoughtsSection settings={settings} currentUser={authState.user} />}
      {activePage === 'movies' && <NewMoviesSection settings={settings} />}
      {activePage === 'bucketlist' && <NewBucketListSection settings={settings} />}
      {activePage === 'lyrics' && <NewLyricsSection settings={settings} />}
      {activePage === 'chords' && <NewChordsSection settings={settings} />}
      {activePage === 'capsules' && <NewTimeCapsuleSection settings={settings} currentUser={authState.user} />}
      {activePage === 'typing' && <NewTypingTestSection settings={settings} currentUser={authState.user} />}

      {activePage === 'settings' ? (
        <section className="fade-section space-y-8 pb-8" data-fade>
          {settingsLoading ? (
            <p className="text-sm text-app-muted">Ayarlar yükleniyor...</p>
          ) : canAccessSettings ? (
            <AdminPanel
              settings={settings}
              setSettings={setSettings}
              settingsEndpoint={settingsEndpoint}
              loading={settingsLoading}
            />
          ) : (
            <div className="glass-card rounded-[2rem] border border-app-border p-8 shadow-2xl text-center">
              <h2 className="font-headline text-3xl font-medium text-app-text">Ayarlar kilitli</h2>
              <p className="mt-3 text-app-muted">
                Bu alana sadece <span className="text-app-accent">Kayra</span> ve <span className="text-app-accent">Hazal</span>{' '}
                erişebilir.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </>
  )

  if (!hasEnteredSite) {
    return (
      <div className="relative min-h-screen overflow-hidden font-sans text-app-text">
        <StarField theme={theme} />

        <EntryGate settings={settings} loginEndpoint={loginEndpoint} onGuestEnter={handleGuestEnter} onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  return (
    <ModernLayout
      theme={theme}
      toggleTheme={toggleTheme}
      settings={settings}
      activePage={activePage}
      navigate={navigate}
      handleLogout={handleLogout}
      canAccessSettings={canAccessSettings}
      authState={authState}
    >
      {mainContent}
    </ModernLayout>
  )
}
