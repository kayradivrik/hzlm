import { useEffect, useRef, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const resolvedApiBase = import.meta.env.DEV
  ? apiBase
  : apiBase && apiBase.includes('localhost')
    ? ''
    : apiBase

export default function NewChatSection({ currentUser }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

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

  return (
    <div className="modern-chat-container">
      <style>{`
        .modern-chat-container {
          height: calc(100vh - 180px);
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 1rem;
          overflow: hidden;
          color: var(--text-primary);
          animation: fadeInUp 0.8s ease-out;
        }

        @media (max-width: 768px) {
          .modern-chat-container {
            height: calc(100dvh - 230px);
            border-radius: 1.5rem;
          }
          .chat-header {
            padding: 1rem 1.25rem !important;
          }
          .messages-area {
            padding: 1.25rem !important;
            gap: 1rem !important;
          }
          .message-bubble {
            max-width: 85% !important;
            padding: 0.75rem 1.15rem !important;
          }
          .chat-input-area {
            padding: 1rem 1.25rem !important;
          }
          .input-wrapper {
            padding-left: 1rem !important;
          }
        }

        .chat-header {
          padding: 1.5rem 2rem;
          background: var(--input-bg);
          border-bottom: 1px solid var(--card-border);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--accent-color);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-info h2 {
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          color: var(--text-primary);
        }

        .header-info p {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          scrollbar-width: thin;
          scrollbar-color: var(--scroll-thumb) transparent;
        }

        .message-bubble {
          max-width: 70%;
          padding: 1rem 1.5rem;
          border-radius: 1.5rem;
          position: relative;
          font-size: 0.95rem;
          line-height: 1.5;
          animation: messageIn 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .message-bubble.me {
          align-self: flex-end;
          background: var(--accent-color);
          color: #ffffff;
          font-weight: 500;
          border-bottom-right-radius: 0.25rem;
        }

        .message-bubble.other {
          align-self: flex-start;
          background: var(--input-bg);
          color: var(--text-primary);
          border: 1px solid var(--card-border);
          border-bottom-left-radius: 0.25rem;
        }

        .message-author {
          font-size: 0.7rem;
          margin-bottom: 0.25rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .me .message-author { text-align: right; color: var(--text-muted); }

        .chat-input-area {
          padding: 1.5rem 2rem;
          background: var(--card-bg);
          border-top: 1px solid var(--card-border);
        }

        .input-wrapper {
          display: flex;
          gap: 1rem;
          background: var(--input-bg);
          padding: 0.5rem;
          padding-left: 1.5rem;
          border-radius: 2rem;
          border: 1px solid var(--input-border);
          transition: all 0.3s ease;
        }

        .input-wrapper:focus-within {
          border-color: var(--accent-color);
          background: var(--input-bg);
          box-shadow: 0 0 0 3px var(--input-focus-ring);
        }

        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--input-text);
          outline: none;
          padding: 0.75rem 0;
          font-size: 0.95rem;
        }

        .send-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--accent-color);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05) rotate(-10deg);
          opacity: 0.9;
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes messageIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="chat-header">
        <div className="header-icon">
          <span className="material-symbols-outlined">forum</span>
        </div>
        <div className="header-info">
          <h2>Özel Sohbet</h2>
          <p>Sadece Kayra ve Hazal arasındakiler...</p>
        </div>
      </div>

      <div className="messages-area">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-300"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-app-muted/40 italic">
            <span className="material-symbols-outlined text-4xl mb-2">chat_bubble_outline</span>
            <p>Henüz mesaj yok. İlk adımı sen at!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.author === currentUser
            return (
              <div key={msg._id} className={`message-bubble ${isMe ? 'me' : 'other'}`}>
                <div className="message-author">{msg.author}</div>
                <div className="message-text">{msg.text}</div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <div className="input-wrapper">
          <input
            className="chat-input"
            type="text"
            placeholder="Neler düşünüyorsun?"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button className="send-btn" type="submit" disabled={!text.trim() || sending}>
            <span className="material-symbols-outlined">{sending ? 'sync' : 'send'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
