/* global process */

import cors from 'cors'
import crypto from 'crypto'
import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

dotenv.config({ override: true })

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

const defaultSettings = {
  key: 'main',
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
  homeNoteText: 'Burasi zamanla buyuyecek; anilar, kucuk notlar ve icten cumleler burada birikecek.',
  kayraName: 'Kayra',
  hazalName: 'Hazal',
  logoUrl: '/favicon.svg',
  purposeTitle: "Hazal'ya bu siteyi yapma amacim",
  purposeText:
    'Sana hissettiklerimi siradan bir mesajla degil, kalici bir sey ile anlatmak istedim. Bu sayfa ikimizin anilarini saklasin diye var.',
}

const memorySchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    author: { type: String, enum: ['Kayra', 'Hazal'], default: 'Kayra' },
    imageUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
)

const thoughtSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    mood: { type: String, default: '', trim: true, maxlength: 40 },
    author: { type: String, enum: ['Kayra', 'Hazal'], required: true },
  },
  { versionKey: false, timestamps: true },
)

const galleryImageSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true, trim: true },
    caption: { type: String, default: '', trim: true, maxlength: 300 },
    author: { type: String, enum: ['Kayra', 'Hazal'], required: true },
  },
  { versionKey: false, timestamps: true },
)

const movieSchema = new mongoose.Schema(
  {
    imdbId: { type: String, trim: true, required: true, unique: true },
    title: { type: String, trim: true, required: true, maxlength: 200 },
    year: { type: String, trim: true, default: '' },
    posterUrl: { type: String, trim: true, default: '' },
    runtime: { type: String, trim: true, default: '' },
    genres: [{ type: String, trim: true }],
    language: { type: String, trim: true, default: '' },
    plot: { type: String, trim: true, default: '', maxlength: 3000 },
    status: { type: String, enum: ['watchlist', 'watched'], default: 'watchlist' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    note: { type: String, trim: true, default: '', maxlength: 1000 },
    watchedAt: { type: Date, default: null },
    addedBy: { type: String, enum: ['Kayra', 'Hazal'], required: true },
    comments: [
      {
        author: { type: String, enum: ['Kayra', 'Hazal'], required: true },
        text: { type: String, trim: true, required: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { versionKey: false, timestamps: true },
)

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    brandTitle: String,
    theme: { type: String, default: 'night' },
    homeTitle: String,
    homeHighlight: String,
    homeQuote: String,
    homeCard1Tag: String,
    homeCard1Title: String,
    homeCard1Text: String,
    homeCard2Tag: String,
    homeCard2Title: String,
    homeCard2Text: String,
    homeCard3Tag: String,
    homeCard3Title: String,
    homeCard3Text: String,
    homeNoteLabel: String,
    homeNoteQuote: String,
    homeNoteText: String,
    kayraName: String,
    hazalName: String,
    logoUrl: String,
    purposeTitle: String,
    purposeText: String,
  },
  { versionKey: false },
)

const bucketListItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 300 },
    category: { type: String, required: true, enum: ['Gezilecek Yerler', 'Cilginliklar', 'Tatlar', 'Diger'], default: 'Gezilecek Yerler' },
    isCompleted: { type: Boolean, default: false },
    author: { type: String, enum: ['Kayra', 'Hazal'], required: true },
  },
  { versionKey: false, timestamps: true },
)

const chatMessageSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    author: { type: String, enum: ['Kayra', 'Hazal'], required: true },
  },
  { versionKey: false, timestamps: true },
)

const lyricsSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true, maxlength: 300 },
    artist: { type: String, trim: true, default: '', maxlength: 200 },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
    author: { type: String, enum: ['Kayra', 'Hazal'], required: true },
  },
  { versionKey: false, timestamps: true },
)

const chordSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true, maxlength: 300 },
    artist: { type: String, trim: true, default: '', maxlength: 200 },
    originalKey: { type: String, trim: true, default: '', maxlength: 10 },
    capo: { type: Number, default: 0 },
    content: { type: String, required: true, trim: true, maxlength: 10000 },
    author: { type: String, enum: ['Kayra', 'Hazal'], required: true },
  },
  { versionKey: false, timestamps: true },
)

const Memory = mongoose.models.Memory || mongoose.model('Memory', memorySchema)
const Thought = mongoose.models.Thought || mongoose.model('Thought', thoughtSchema)
const GalleryImage = mongoose.models.GalleryImage || mongoose.model('GalleryImage', galleryImageSchema)
const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema)
const SiteSettings = mongoose.models.SiteSettings || mongoose.model('SiteSettings', settingsSchema)
const BucketListItem = mongoose.models.BucketListItem || mongoose.model('BucketListItem', bucketListItemSchema)
const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema)
const Lyrics = mongoose.models.Lyrics || mongoose.model('Lyrics', lyricsSchema)
const Chord = mongoose.models.Chord || mongoose.model('Chord', chordSchema)

let connectionPromise = null

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return
  if (!connectionPromise) {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) {
      throw new Error('MONGO_URI eksik. .env dosyasini doldur.')
    }
    connectionPromise = mongoose.connect(mongoUri)
  }
  await connectionPromise
}

app.use(async (_req, res, next) => {
  try {
    await connectToDatabase()
    next()
  } catch (err) {
    res.status(500).json({ message: err.message || 'Veritabani baglantisi kurulamadı.' })
  }
})

function getJwtSecret() {
  return process.env.JWT_SECRET || 'change-this-secret-in-production'
}

function createToken(user) {
  return jwt.sign({ user }, getJwtSecret(), { expiresIn: '7d' })
}

function verifyAuth(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return res.status(401).json({ message: 'Giris gerekli.' })
  try {
    const decoded = jwt.verify(token, getJwtSecret())
    req.authUser = decoded.user
    return next()
  } catch {
    return res.status(401).json({ message: 'Gecersiz oturum.' })
  }
}

function validateImageUrl(raw) {
  const imageUrl = typeof raw === 'string' ? raw.trim() : ''
  if (!imageUrl) return ''
  const isDataUrl = imageUrl.startsWith('data:image/')
  const isHttpUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://')
  if (!isDataUrl && !isHttpUrl) return null
  if (imageUrl.length > 1_500_000) return null
  return imageUrl
}

function createCloudinarySignature({ timestamp, folder, apiSecret }) {
  const payload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  return crypto.createHash('sha1').update(payload).digest('hex')
}

function parseCloudinaryUrl(raw) {
  const value = String(raw || '').trim()
  if (!value.startsWith('cloudinary://')) return null
  const withoutProto = value.slice('cloudinary://'.length)
  const atIndex = withoutProto.lastIndexOf('@')
  if (atIndex <= 0) return null
  const creds = withoutProto.slice(0, atIndex)
  const cloudName = withoutProto.slice(atIndex + 1).trim().toLowerCase()
  const colonIndex = creds.indexOf(':')
  if (colonIndex <= 0) return null
  const apiKey = decodeURIComponent(creds.slice(0, colonIndex))
  const apiSecret = decodeURIComponent(creds.slice(colonIndex + 1))
  if (!apiKey || !apiSecret || !cloudName) return null
  return { cloudName, apiKey, apiSecret }
}

function parseOmdbMovie(raw) {
  const title = typeof raw?.Title === 'string' ? raw.Title.trim() : ''
  const imdbId = typeof raw?.imdbID === 'string' ? raw.imdbID.trim() : ''
  if (!title || !imdbId) return null
  const year = typeof raw?.Year === 'string' ? raw.Year.trim() : ''
  const poster = typeof raw?.Poster === 'string' ? raw.Poster.trim() : ''
  const posterUrl = poster && poster !== 'N/A' ? poster : ''
  return { title, imdbId, year, posterUrl }
}

function parseOmdbMovieDetail(raw) {
  const base = parseOmdbMovie(raw)
  if (!base) return null
  const runtime = typeof raw?.Runtime === 'string' && raw.Runtime !== 'N/A' ? raw.Runtime.trim() : ''
  const language = typeof raw?.Language === 'string' && raw.Language !== 'N/A' ? raw.Language.trim() : ''
  const plot = typeof raw?.Plot === 'string' && raw.Plot !== 'N/A' ? raw.Plot.trim() : ''
  const genreRaw = typeof raw?.Genre === 'string' ? raw.Genre : ''
  const genres = genreRaw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 6)
  return { ...base, runtime, language, plot, genres }
}

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase()
  const password = String(req.body?.password || '').trim()

  const kayraPass = String(process.env.KAYRA_PASSWORD || 'kayra').trim()
  const hazalPass = String(process.env.HAZAL_PASSWORD || 'hazal').trim()

  if (username === 'kayra' && password === kayraPass && kayraPass) {
    return res.json({ token: createToken('Kayra'), user: 'Kayra' })
  }
  if (username === 'hazal' && password === hazalPass && hazalPass) {
    return res.json({ token: createToken('Hazal'), user: 'Hazal' })
  }
  return res.status(401).json({ message: 'Kullanici adi veya sifre hatali.' })
})

app.post('/api/movies/search', async (req, res) => {
  const query = String(req.body?.query || '').trim()
  if (query.length < 2) return res.status(400).json({ message: 'En az 2 karakter gir.' })

  const apiKey = String(process.env.OMDB_API_KEY || '').trim()
  if (!apiKey) return res.status(500).json({ message: 'OMDB_API_KEY eksik. .env dosyasina ekle.' })

  try {
    const url = new URL('https://www.omdbapi.com/')
    url.searchParams.set('apikey', apiKey)
    url.searchParams.set('s', query)
    url.searchParams.set('type', 'movie')
    url.searchParams.set('page', '1')
    const omdbRes = await fetch(url)
    const omdbData = await omdbRes.json().catch(() => ({}))
    if (!omdbRes.ok) return res.status(502).json({ message: 'IMDb aramasi basarisiz.' })
    if (omdbData?.Response === 'False') return res.json([])

    const results = Array.isArray(omdbData?.Search)
      ? omdbData.Search.map(parseOmdbMovie).filter(Boolean).slice(0, 12)
      : []

    const imdbIds = results.map((item) => item.imdbId)
    const existing = imdbIds.length > 0 ? await Movie.find({ imdbId: { $in: imdbIds } }).select('imdbId status').lean() : []
    const existingMap = new Map(existing.map((doc) => [doc.imdbId, doc.status]))

    res.json(
      results.map((item) => ({
        ...item,
        alreadyAdded: existingMap.has(item.imdbId),
        existingStatus: existingMap.get(item.imdbId) || '',
      })),
    )
  } catch {
    res.status(500).json({ message: 'IMDb servisine baglanilamadi.' })
  }
})

app.get('/api/movies', async (req, res) => {
  const status = String(req.query?.status || '').trim()
  const filter = {}
  if (status === 'watchlist' || status === 'watched') filter.status = status
  const sort = status === 'watched' ? { watchedAt: -1, updatedAt: -1 } : { createdAt: -1 }
  const movies = await Movie.find(filter).sort(sort).lean()
  res.json(movies)
})

app.get('/api/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).lean()
    if (!movie) return res.status(404).json({ message: 'Film bulunamadi.' })
    res.json(movie)
  } catch {
    res.status(500).json({ message: 'Film detayi getirilemedi.' })
  }
})

app.post('/api/movies', verifyAuth, async (req, res) => {
  const imdbId = String(req.body?.imdbId || '').trim()
  if (!/^tt\d{5,}$/.test(imdbId)) return res.status(400).json({ message: 'Gecersiz imdbId.' })

  const apiKey = String(process.env.OMDB_API_KEY || '').trim()
  if (!apiKey) return res.status(500).json({ message: 'OMDB_API_KEY eksik. .env dosyasina ekle.' })

  try {
    const existing = await Movie.findOne({ imdbId }).lean()
    if (existing) return res.status(409).json({ message: 'Bu film zaten listede.' })

    const url = new URL('https://www.omdbapi.com/')
    url.searchParams.set('apikey', apiKey)
    url.searchParams.set('i', imdbId)
    const omdbRes = await fetch(url)
    const omdbData = await omdbRes.json().catch(() => ({}))
    if (!omdbRes.ok || omdbData?.Response === 'False') {
      return res.status(502).json({ message: 'IMDb film detayi alinamadi.' })
    }
    const movieDetail = parseOmdbMovieDetail(omdbData)
    if (!movieDetail) return res.status(400).json({ message: 'Film verisi gecersiz.' })

    const created = await Movie.create({
      ...movieDetail,
      status: 'watchlist',
      note: '',
      rating: 0,
      watchedAt: null,
      addedBy: req.authUser === 'Hazal' ? 'Hazal' : 'Kayra',
      comments: [],
    })
    res.status(201).json(created)
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: 'Bu film zaten listede.' })
    res.status(500).json({ message: 'Film eklenemedi.' })
  }
})

app.post('/api/movies/:id/comments', verifyAuth, async (req, res) => {
  const text = String(req.body?.text || '').trim()
  if (!text) return res.status(400).json({ message: 'Yorum bos olamaz.' })
  if (text.length > 1000) return res.status(400).json({ message: 'Yorum en fazla 1000 karakter olabilir.' })

  try {
    const movie = await Movie.findById(req.params.id)
    if (!movie) return res.status(404).json({ message: 'Film bulunamadi.' })
    if (movie.status !== 'watched') {
      return res.status(400).json({ message: 'Yorum yapmak icin filmi izlenenlere almalisin.' })
    }
    movie.comments.push({
      author: req.authUser === 'Hazal' ? 'Hazal' : 'Kayra',
      text,
      createdAt: new Date(),
    })
    await movie.save()
    return res.status(201).json(movie.toObject())
  } catch {
    return res.status(500).json({ message: 'Yorum eklenemedi.' })
  }
})

app.patch('/api/movies/:id', verifyAuth, async (req, res) => {
  const payload = {}

  if (typeof req.body?.status === 'string') {
    const nextStatus = req.body.status.trim()
    if (nextStatus === 'watchlist' || nextStatus === 'watched') payload.status = nextStatus
    else return res.status(400).json({ message: 'status watchlist veya watched olmali.' })
  }
  if (typeof req.body?.note === 'string') payload.note = req.body.note.trim().slice(0, 1000)
  if (typeof req.body?.rating !== 'undefined') {
    const rating = Number(req.body.rating)
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      return res.status(400).json({ message: 'rating 0-5 arasinda olmali.' })
    }
    payload.rating = rating
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    payload.watchedAt = payload.status === 'watched' ? new Date() : null
  }
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: 'Guncellenecek alan yok.' })
  }

  try {
    const updated = await Movie.findByIdAndUpdate(req.params.id, payload, { new: true }).lean()
    if (!updated) return res.status(404).json({ message: 'Film bulunamadi.' })
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Film guncellenemedi.' })
  }
})

app.delete('/api/movies/:id', verifyAuth, async (req, res) => {
  try {
    const deleted = await Movie.findByIdAndDelete(req.params.id).lean()
    if (!deleted) return res.status(404).json({ message: 'Film bulunamadi.' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ message: 'Film silinemedi.' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/settings', async (_req, res) => {
  const doc = await SiteSettings.findOne({ key: 'main' }).lean()
  if (!doc) return res.json(defaultSettings)
  res.json({ ...defaultSettings, ...doc })
})

app.put('/api/settings', verifyAuth, async (req, res) => {
  if (req.authUser !== 'Kayra' && req.authUser !== 'Hazal') return res.status(403).json({ message: 'Yetersiz izin.' })

  const payload = {
    brandTitle: String(req.body?.brandTitle || '').trim(),
    theme: String(req.body?.theme || 'night').trim(),
    homeTitle: String(req.body?.homeTitle || '').trim(),
    homeHighlight: String(req.body?.homeHighlight || '').trim(),
    homeQuote: String(req.body?.homeQuote || '').trim(),
    homeCard1Tag: String(req.body?.homeCard1Tag || '').trim(),
    homeCard1Title: String(req.body?.homeCard1Title || '').trim(),
    homeCard1Text: String(req.body?.homeCard1Text || '').trim(),
    homeCard2Tag: String(req.body?.homeCard2Tag || '').trim(),
    homeCard2Title: String(req.body?.homeCard2Title || '').trim(),
    homeCard2Text: String(req.body?.homeCard2Text || '').trim(),
    homeCard3Tag: String(req.body?.homeCard3Tag || '').trim(),
    homeCard3Title: String(req.body?.homeCard3Title || '').trim(),
    homeCard3Text: String(req.body?.homeCard3Text || '').trim(),
    homeNoteLabel: String(req.body?.homeNoteLabel || '').trim(),
    homeNoteQuote: String(req.body?.homeNoteQuote || '').trim(),
    homeNoteText: String(req.body?.homeNoteText || '').trim(),
    kayraName: String(req.body?.kayraName || '').trim(),
    hazalName: String(req.body?.hazalName || '').trim(),
    logoUrl: String(req.body?.logoUrl || '').trim(),
    purposeTitle: String(req.body?.purposeTitle || '').trim(),
    purposeText: String(req.body?.purposeText || '').trim(),
  }

  const saved = await SiteSettings.findOneAndUpdate(
    { key: 'main' },
    { key: 'main', ...payload },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean()

  res.json({ ...defaultSettings, ...saved })
})

app.get('/api/memories', async (_req, res) => {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 }).lean()
    res.json(memories)
  } catch {
    res.status(500).json({ message: 'Anilar getirilemedi.' })
  }
})

app.post('/api/memories', verifyAuth, async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  const author = req.body?.author === 'Hazal' ? 'Hazal' : req.body?.author === 'Kayra' ? 'Kayra' : null
  const imageUrl = validateImageUrl(req.body?.imageUrl)
  if (!text) return res.status(400).json({ message: 'text alani zorunludur.' })
  if (!author) return res.status(400).json({ message: 'author Kayra veya Hazal olmali.' })
  if (imageUrl === null) return res.status(400).json({ message: 'Gecersiz fotograf formati.' })
  try {
    const created = await Memory.create({ text, author, imageUrl: imageUrl || '' })
    res.status(201).json(created)
  } catch {
    res.status(500).json({ message: 'Ani eklenemedi.' })
  }
})

app.patch('/api/memories/:id', verifyAuth, async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  const author = req.body?.author === 'Hazal' ? 'Hazal' : req.body?.author === 'Kayra' ? 'Kayra' : null
  const imageUrl = validateImageUrl(req.body?.imageUrl)
  if (!text) return res.status(400).json({ message: 'text alani zorunludur.' })
  if (!author) return res.status(400).json({ message: 'author Kayra veya Hazal olmali.' })
  if (imageUrl === null) return res.status(400).json({ message: 'Gecersiz fotograf formati.' })
  try {
    const updated = await Memory.findByIdAndUpdate(
      req.params.id,
      { text, author, imageUrl: imageUrl || '' },
      { new: true },
    ).lean()
    if (!updated) return res.status(404).json({ message: 'Kayit bulunamadi.' })
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Duzenleme basarisiz.' })
  }
})

app.delete('/api/memories/:id', verifyAuth, async (req, res) => {
  try {
    const deleted = await Memory.findByIdAndDelete(req.params.id).lean()
    if (!deleted) return res.status(404).json({ message: 'Kayit bulunamadi.' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ message: 'Silme basarisiz.' })
  }
})

app.post('/api/uploads/image', verifyAuth, async (req, res) => {
  const imageData = typeof req.body?.imageData === 'string' ? req.body.imageData.trim() : ''
  if (!imageData.startsWith('data:image/')) {
    return res.status(400).json({ message: 'Gecersiz gorsel verisi.' })
  }

  const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL)
  const cloudName = (fromUrl?.cloudName || process.env.CLOUDINARY_CLOUD_NAME || '').trim().toLowerCase()
  const apiKey = (fromUrl?.apiKey || process.env.CLOUDINARY_API_KEY || '').trim()
  const apiSecret = (fromUrl?.apiSecret || process.env.CLOUDINARY_API_SECRET || '').trim()
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ message: 'Cloudinary ayarlari eksik.' })
  }
  if (!/^[a-z0-9-]+$/.test(cloudName)) {
    return res.status(500).json({ message: 'Cloudinary cloud_name gecersiz. Dashboarddaki cloud name degerini kontrol et.' })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'celestial-sanctuary'
  const signature = createCloudinarySignature({ timestamp, folder, apiSecret })

  try {
    const formData = new FormData()
    formData.append('file', imageData)
    formData.append('api_key', apiKey)
    formData.append('timestamp', String(timestamp))
    formData.append('folder', folder)
    formData.append('signature', signature)

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    })
    const uploadData = await uploadRes.json().catch(() => ({}))
    if (!uploadRes.ok) {
      return res.status(500).json({ message: uploadData?.error?.message || 'Cloudinary yukleme basarisiz.' })
    }

    return res.json({ url: uploadData.secure_url || uploadData.url || '' })
  } catch {
    return res.status(500).json({ message: 'Cloudinary baglantisi kurulamadı.' })
  }
})

app.get('/api/gallery', async (_req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 }).lean()
    res.json(images)
  } catch {
    res.status(500).json({ message: 'Galeri getirilemedi.' })
  }
})

app.post('/api/gallery', verifyAuth, async (req, res) => {
  const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : ''
  const caption = typeof req.body?.caption === 'string' ? req.body.caption.trim() : ''
  if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
    return res.status(400).json({ message: 'Gecersiz fotograf linki.' })
  }
  try {
    const created = await GalleryImage.create({
      imageUrl,
      caption,
      author: req.authUser === 'Hazal' ? 'Hazal' : 'Kayra',
    })
    res.status(201).json(created)
  } catch {
    res.status(500).json({ message: 'Galeriye eklenemedi.' })
  }
})

app.patch('/api/gallery/:id', verifyAuth, async (req, res) => {
  const caption = typeof req.body?.caption === 'string' ? req.body.caption.trim() : ''
  try {
    const existing = await GalleryImage.findById(req.params.id).lean()
    if (!existing) return res.status(404).json({ message: 'Kayit bulunamadi.' })
    if (existing.author !== req.authUser) return res.status(403).json({ message: 'Bu kaydi duzenleyemezsin.' })
    const updated = await GalleryImage.findByIdAndUpdate(req.params.id, { caption }, { new: true }).lean()
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Duzenleme basarisiz.' })
  }
})

app.delete('/api/gallery/:id', verifyAuth, async (req, res) => {
  try {
    const existing = await GalleryImage.findById(req.params.id).lean()
    if (!existing) return res.status(404).json({ message: 'Kayit bulunamadi.' })
    if (existing.author !== req.authUser) return res.status(403).json({ message: 'Bu kaydi silemezsin.' })
    await GalleryImage.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ message: 'Silme basarisiz.' })
  }
})

app.get('/api/thoughts', async (_req, res) => {
  try {
    const thoughts = await Thought.find().sort({ createdAt: -1 }).lean()
    res.json(thoughts)
  } catch {
    res.status(500).json({ message: 'Aklindakiler getirilemedi.' })
  }
})

app.post('/api/thoughts', verifyAuth, async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  const mood = typeof req.body?.mood === 'string' ? req.body.mood.trim() : ''
  if (!text) return res.status(400).json({ message: 'text alani zorunludur.' })
  try {
    const created = await Thought.create({ text, mood, author: req.authUser === 'Hazal' ? 'Hazal' : 'Kayra' })
    res.status(201).json(created)
  } catch {
    res.status(500).json({ message: 'Kayit eklenemedi.' })
  }
})

app.patch('/api/thoughts/:id', verifyAuth, async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  const mood = typeof req.body?.mood === 'string' ? req.body.mood.trim() : ''
  if (!text) return res.status(400).json({ message: 'text alani zorunludur.' })
  try {
    const existing = await Thought.findById(req.params.id).lean()
    if (!existing) return res.status(404).json({ message: 'Kayit bulunamadi.' })
    if (existing.author !== req.authUser) return res.status(403).json({ message: 'Bu kaydi duzenleyemezsin.' })
    const updated = await Thought.findByIdAndUpdate(req.params.id, { text, mood }, { new: true }).lean()
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Duzenleme basarisiz.' })
  }
})

app.delete('/api/thoughts/:id', verifyAuth, async (req, res) => {
  try {
    const existing = await Thought.findById(req.params.id).lean()
    if (!existing) return res.status(404).json({ message: 'Kayit bulunamadi.' })
    if (existing.author !== req.authUser) return res.status(403).json({ message: 'Bu kaydi silemezsin.' })
    await Thought.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ message: 'Silme basarisiz.' })
  }
})

app.get('/api/bucketlist', async (_req, res) => {
  try {
    const items = await BucketListItem.find().sort({ isCompleted: 1, createdAt: -1 }).lean()
    res.json(items)
  } catch {
    res.status(500).json({ message: 'Liste getirilemedi.' })
  }
})

app.post('/api/bucketlist', verifyAuth, async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  const category = ['Gezilecek Yerler', 'Cilginliklar', 'Tatlar', 'Diger'].includes(req.body?.category) ? req.body.category : 'Diger'
  if (!text) return res.status(400).json({ message: 'Hedef metni zorunludur.' })
  try {
    const created = await BucketListItem.create({ text, category, author: req.authUser === 'Hazal' ? 'Hazal' : 'Kayra' })
    res.status(201).json(created)
  } catch {
    res.status(500).json({ message: 'Hedef eklenemedi.' })
  }
})

app.patch('/api/bucketlist/:id', verifyAuth, async (req, res) => {
  try {
    const existing = await BucketListItem.findById(req.params.id).lean()
    if (!existing) return res.status(404).json({ message: 'Kayit bulunamadi.' })
    const isCompleted = typeof req.body?.isCompleted === 'boolean' ? req.body.isCompleted : existing.isCompleted
    const updated = await BucketListItem.findByIdAndUpdate(req.params.id, { isCompleted }, { new: true }).lean()
    res.json(updated)
  } catch {
    res.status(500).json({ message: 'Durum guncellenemedi.' })
  }
})

app.delete('/api/bucketlist/:id', verifyAuth, async (req, res) => {
  try {
    const existing = await BucketListItem.findById(req.params.id).lean()
    if (!existing) return res.status(404).json({ message: 'Kayit bulunamadi.' })
    if (existing.author !== req.authUser) return res.status(403).json({ message: 'Bunu sen eklemedin, silemezsin.' })
    await BucketListItem.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ message: 'Silme basarisiz.' })
  }
})

app.get('/api/chat', verifyAuth, async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ createdAt: 1 }).lean()
    res.json(messages)
  } catch {
    res.status(500).json({ message: 'Mesajlar getirilemedi.' })
  }
})

app.post('/api/chat', verifyAuth, async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  if (!text) return res.status(400).json({ message: 'Mesaj bos olamaz.' })
  try {
    const created = await ChatMessage.create({ text, author: req.authUser })
    res.status(201).json(created)
  } catch {
    res.status(500).json({ message: 'Mesaj gonderilemedi.' })
  }
})

app.get('/api/lyrics', async (_req, res) => {
  try {
    const items = await Lyrics.find().sort({ createdAt: -1 }).lean()
    res.json(items)
  } catch {
    res.status(500).json({ message: 'Şarkı sözleri getirilemedi.' })
  }
})

app.post('/api/lyrics', verifyAuth, async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  const artist = typeof req.body?.artist === 'string' ? req.body.artist.trim() : ''
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  if (!title || !text) return res.status(400).json({ message: 'Başlık ve sözler zorunludur.' })
  try {
    const created = await Lyrics.create({
      title,
      artist,
      text,
      author: req.authUser === 'Hazal' ? 'Hazal' : 'Kayra'
    })
    res.status(201).json(created)
  } catch {
    res.status(500).json({ message: 'Şarkı sözü eklenemedi.' })
  }
})

app.delete('/api/lyrics/:id', verifyAuth, async (req, res) => {
  try {
    const existing = await Lyrics.findById(req.params.id).lean()
    if (!existing) return res.status(404).json({ message: 'Kayıt bulunamadı.' })
    if (existing.author !== req.authUser) return res.status(403).json({ message: 'Bunu sen eklemedin, silemezsin.' })
    await Lyrics.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ message: 'Silme başarısız.' })
  }
})

app.patch('/api/lyrics/:id', verifyAuth, async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : null
  const artist = typeof req.body?.artist === 'string' ? req.body.artist.trim() : null
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : null

  try {
    const existing = await Lyrics.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Kayıt bulunamadı.' })
    if (existing.author !== req.authUser) return res.status(403).json({ message: 'Bunu sen eklemedin, güncelleyemezsin.' })

    if (title !== null) existing.title = title
    if (artist !== null) existing.artist = artist
    if (text !== null) existing.text = text

    await existing.save()
    res.json(existing.toObject())
  } catch {
    res.status(500).json({ message: 'Güncelleme başarısız.' })
  }
})

app.get('/api/chords', async (_req, res) => {
  try {
    const items = await Chord.find().sort({ createdAt: -1 }).lean()
    res.json(items)
  } catch {
    res.status(500).json({ message: 'Akorlar getirilemedi.' })
  }
})

app.get('/api/chords/:id', async (req, res) => {
  try {
    const item = await Chord.findById(req.params.id).lean()
    if (!item) return res.status(404).json({ message: 'Akor bulunamadı.' })
    res.json(item)
  } catch {
    res.status(500).json({ message: 'Akor detayı getirilemedi.' })
  }
})

app.post('/api/chords', verifyAuth, async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
  const artist = typeof req.body?.artist === 'string' ? req.body.artist.trim() : ''
  const originalKey = typeof req.body?.originalKey === 'string' ? req.body.originalKey.trim() : ''
  const capo = typeof req.body?.capo !== 'undefined' ? Number(req.body.capo) : 0
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
  if (!title || !content) return res.status(400).json({ message: 'Başlık ve akor içeriği zorunludur.' })
  try {
    const created = await Chord.create({
      title,
      artist,
      originalKey,
      capo: isNaN(capo) ? 0 : capo,
      content,
      author: req.authUser === 'Hazal' ? 'Hazal' : 'Kayra'
    })
    res.status(201).json(created)
  } catch {
    res.status(500).json({ message: 'Akor eklenemedi.' })
  }
})

app.delete('/api/chords/:id', verifyAuth, async (req, res) => {
  try {
    const existing = await Chord.findById(req.params.id).lean()
    if (!existing) return res.status(404).json({ message: 'Akor bulunamadı.' })
    if (existing.author !== req.authUser) return res.status(403).json({ message: 'Bunu sen eklemedin, silemezsin.' })
    await Chord.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ message: 'Silme başarısız.' })
  }
})

app.patch('/api/chords/:id', verifyAuth, async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : null
  const artist = typeof req.body?.artist === 'string' ? req.body.artist.trim() : null
  const originalKey = typeof req.body?.originalKey === 'string' ? req.body.originalKey.trim() : null
  const capo = typeof req.body?.capo !== 'undefined' ? Number(req.body.capo) : null
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : null

  try {
    const existing = await Chord.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Akor bulunamadı.' })
    if (existing.author !== req.authUser) return res.status(403).json({ message: 'Bunu sen eklemedin, güncelleyemezsin.' })

    if (title !== null) existing.title = title
    if (artist !== null) existing.artist = artist
    if (originalKey !== null) existing.originalKey = originalKey
    if (capo !== null && !isNaN(capo)) existing.capo = capo
    if (content !== null) existing.content = content

    await existing.save()
    res.json(existing.toObject())
  } catch {
    res.status(500).json({ message: 'Güncelleme başarısız.' })
  }
})

export { app, connectToDatabase }
