import { useEffect, useRef, useState } from 'react'

export default function ChatSection({ currentUser }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const apiBase = import.meta.env.VITE_API_BASE_URL || ''
  const resolvedApiBase = import.meta.env.DEV
    ? apiBase
    : apiBase && apiBase.includes('localhost')
      ? ''
      : apiBase

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${resolvedApiBase}/api/chat`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [resolvedApiBase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`${resolvedApiBase}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: text.trim() })
      })
      if (res.ok) {
        setText('')
        await fetchMessages()
      }
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-700">Sohbet yükleniyor...</div>
  }

  return (
    <section className="fade-section flex flex-col h-[75vh] min-h-[400px] glass-card rounded-[2rem] border border-[#4a454d]/20 overflow-hidden" data-fade>
      <div className="p-4 border-b border-[#4a454d]/30 bg-[#1a0b2e]/40 flex-shrink-0">
        <h2 className="font-headline text-xl text-rose-600 flex items-center gap-2">
          <span className="material-symbols-outlined">forum</span>
          Sohbet
        </h2>
        <p className="text-gray-500 text-xs mt-1">Bu alan sadece Kayra ve Hazal'ya ozeldir.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-700 mt-10 text-sm">Henüz mesaj yok. İlk mesajı sen gönder!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.author === currentUser
            return (
              <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] text-gray-500 mb-1 ml-1 mr-1">{msg.author}</div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm break-words ${
                    isMe
                      ? 'bg-rose-100 text-rose-600 rounded-tr-sm'
                      : 'bg-gray-100 text-[#eddcff] rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-[#4a454d]/30 bg-[#1a0b2e]/40 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesaj yaz..."
          className="flex-1 bg-black/20 border border-[#4a454d]/40 rounded-full px-4 py-2 text-sm text-[#eddcff] placeholder:text-gray-700 focus:outline-none focus:border-rose-300 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </form>
    </section>
  )
}
