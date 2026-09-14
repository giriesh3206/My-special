import React, { useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import "./styles.css"

const defaultMessages = [
  "I know I messed up.",
  "I'm sorry for hurting you. You mean more to me than I can explain.",
  "I wish I could take that moment back and make things right.",
  "Please forgive me. I really do want to make things better."
]

const demoPhotos = ["/demo/memory-1.svg", "/demo/memory-2.svg", "/demo/memory-3.svg", "/demo/memory-4.svg"]

function App() {
  const isReceiver = window.location.pathname.startsWith("/sorry/")
  return isReceiver ? <Receiver /> : <Creator />
}

function Creator() {
  const [recipient, setRecipient] = useState("Giriesh")
  const [sender, setSender] = useState("Someone who is sorry")
  const [messages, setMessages] = useState(defaultMessages)
  const [photos, setPhotos] = useState([])
  const [shareUrl, setShareUrl] = useState("")

  const addMessage = () => setMessages(value => [...value, "Write another thing you want them to know."])
  const updateMessage = (index, value) => setMessages(items => items.map((item, i) => i === index ? value : item))
  const removeMessage = index => setMessages(items => items.filter((_, i) => i !== index))
  const addPhotos = event => {
    const files = [...event.target.files]
    setPhotos(items => [...items, ...files.map(file => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file), name: file.name }))])
    event.target.value = ""
  }
  const removePhoto = id => setPhotos(items => items.filter(item => item.id !== id))
  const createCard = () => {
    const payload = { recipient, sender, messages: messages.filter(Boolean) }
    const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))))
    const url = `${window.location.origin}/sorry/share?data=${encoded}`
    localStorage.setItem("sorry-card-demo", JSON.stringify({ ...payload, photos: photos.map(item => item.url) }))
    setShareUrl(url)
  }

  return <main className="creator-shell"><section className="creator-card">
    <div className="eyebrow">FROM MY HEART</div><h1>Create the message they should see.</h1><p className="lead">Your words stay in the middle. Your memories sit around them.</p>
    <label>Their name<input value={recipient} onChange={e => setRecipient(e.target.value)} /></label>
    <label>Your name<input value={sender} onChange={e => setSender(e.target.value)} /></label>
    <div className="section-heading"><div><h2>Your messages</h2><span>One message per section.</span></div><button className="small-button" onClick={addMessage}>+ Add</button></div>
    <div className="message-editor">{messages.map((message, index) => <div className="message-row" key={index}><span>{index + 1}</span><textarea value={message} onChange={e => updateMessage(index, e.target.value)} />{messages.length > 1 && <button className="delete-button" onClick={() => removeMessage(index)}>×</button>}</div>)}</div>
    <div className="section-heading"><div><h2>Your photos</h2><span>These appear around the messages.</span></div></div>
    <label className="upload-box"><input type="file" accept="image/*" multiple onChange={addPhotos} /><strong>+ Add photos</strong><span>Select several memories from your phone.</span></label>
    {photos.length > 0 && <div className="creator-photos">{photos.map(photo => <div className="creator-photo" key={photo.id}><img src={photo.url} alt="" /><button onClick={() => removePhoto(photo.id)}>×</button></div>)}</div>}
    <button className="primary-button" onClick={createCard}>Create receiver link</button>
    {shareUrl && <div className="created-box"><strong>Your receiver link is ready.</strong><a href={shareUrl}>Open receiver experience →</a><input className="share-link" value={shareUrl} readOnly onFocus={e => e.target.select()} /><button className="copy-button" onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy link</button><span>The message is encoded into the link, so the receiver can open it on another device without Firebase.</span></div>}
  </section></main>
}

function Receiver() {
  const [card, setCard] = useState(null)
  const isDemo = window.location.pathname === "/sorry/demo"

  useEffect(() => {
    if (isDemo) return
    const data = new URLSearchParams(window.location.search).get("data")
    if (data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(data)))))
        if (Array.isArray(parsed.messages) && parsed.messages.length) setCard(parsed)
        return
      } catch {}
    }
    const saved = localStorage.getItem("sorry-card-demo")
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      setCard(parsed)
    } catch {}
  }, [isDemo])

  const stored = card || {}
  const data = {
    recipient: stored.recipient || "Giriesh",
    sender: stored.sender || "Someone who is sorry",
    messages: Array.isArray(stored.messages) && stored.messages.length ? stored.messages : defaultMessages,
    photos: Array.isArray(stored.photos) && stored.photos.length ? stored.photos : demoPhotos
  }
  const sections = useMemo(() => data.messages.map((message, i) => ({
    message,
    photos: [data.photos[(i * 2) % data.photos.length], data.photos[(i * 2 + 1) % data.photos.length]].filter(Boolean)
  })), [data])

  return <main className="receiver-shell">
    <header className="receiver-nav"><span>for {data.recipient}</span><span className="nav-mark">♥</span></header>
    <section className="receiver-opening">
      <div className="opening-glow" />
      <p className="tiny-label">A little something from {data.sender}</p>
      <h1>I wanted you<br /><em>to know.</em></h1>
      <p className="opening-copy">Not to make excuses. Just to say the things I should have said.</p>
      <div className="scroll-cue"><span>keep reading</span><i /></div>
    </section>
    <section className="message-intro">
      <span className="chapter-label">01 · what I mean</span>
      <p>There are a few things<br />I need you to hear.</p>
    </section>
    <div className="message-stack">
      {sections.map((section, i) => <MessageSection key={i} message={section.message} photos={section.photos} position={i} />)}
    </div>
    <section className="receiver-ending">
      <div className="ending-line" />
      <p className="tiny-label">And finally</p>
      <h2>I am<br /><em>sorry.</em></h2>
      <p className="ending-copy">I don't expect an answer right now.<br />I just wanted you to know.</p>
      <div className="ending-heart">♥</div>
    </section>
  </main>
}

function MessageSection({ message, photos, position }) {
  const layouts = ["left", "right", "split", "left"]
  const [visible, setVisible] = useState(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const element = document.getElementById(`message-${position}`)
    if (!element) return
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true)
          setTimeout(() => setSettled(true), 900)
          observer.disconnect()
        }
      })
    }, { threshold: 0.3 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [position])

  return <section id={`message-${position}`} className={`message-section ${layouts[position % layouts.length]} ${visible ? "is-visible" : ""} ${settled ? "is-settled" : ""}`}>
    <div className="message-photo photo-one">{photos[0] && <img src={photos[0]} alt="" />}</div>
    {photos[1] && <div className="message-photo photo-two"><img src={photos[1]} alt="" /></div>}
    <div className="message-copy">
      <span className="message-number">0{position + 1}</span>
      <p>{message}</p>
    </div>
  </section>
}

createRoot(document.getElementById("root")).render(<App />)