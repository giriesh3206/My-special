import React, { useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import "./styles.css"

const defaultMessages = [
  "I know I messed up.",
  "I'm sorry for hurting you. You mean more to me than I can explain.",
  "I wish I could take that moment back and make things right.",
  "Please forgive me. I really do want to make things better."
]

const demoPhotos = [
  "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=900&q=85"
]

function App() {
  const path = window.location.pathname
  const isReceiver = path.startsWith("/sorry/")
  return isReceiver ? <Receiver /> : <Creator />
}

function Creator() {
  const [recipient, setRecipient] = useState("Giriesh")
  const [sender, setSender] = useState("Someone who is sorry")
  const [messages, setMessages] = useState(defaultMessages)
  const [photos, setPhotos] = useState([])
  const [created, setCreated] = useState(false)

  const addMessage = () => {
    setMessages(value => [...value, "Write another thing you want them to know."])
  }

  const updateMessage = (index, value) => {
    setMessages(items => items.map((item, i) => i === index ? value : item))
  }

  const removeMessage = index => {
    setMessages(items => items.filter((_, i) => i !== index))
  }

  const addPhotos = event => {
    const files = [...event.target.files]
    const mapped = files.map(file => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      name: file.name
    }))
    setPhotos(items => [...items, ...mapped])
    event.target.value = ""
  }

  const removePhoto = id => {
    setPhotos(items => items.filter(item => item.id !== id))
  }

  const createCard = () => {
    const data = {
      recipient,
      sender,
      messages: messages.filter(Boolean),
      photos: photos.map(item => item.url)
    }
    localStorage.setItem("sorry-card-demo", JSON.stringify(data))
    setCreated(true)
  }

  return (
    <main className="creator-shell">
      <section className="creator-card">
        <div className="eyebrow">FROM MY HEART</div>
        <h1>Create the message they should see.</h1>
        <p className="lead">Your words stay in the middle. Your memories sit around them.</p>

        <label>
          Their name
          <input value={recipient} onChange={e => setRecipient(e.target.value)} />
        </label>

        <label>
          Your name
          <input value={sender} onChange={e => setSender(e.target.value)} />
        </label>

        <div className="section-heading">
          <div>
            <h2>Your messages</h2>
            <span>One message per section.</span>
          </div>
          <button className="small-button" onClick={addMessage}>+ Add</button>
        </div>

        <div className="message-editor">
          {messages.map((message, index) => (
            <div className="message-row" key={index}>
              <span>{index + 1}</span>
              <textarea value={message} onChange={e => updateMessage(index, e.target.value)} />
              {messages.length > 1 && <button className="delete-button" onClick={() => removeMessage(index)}>×</button>}
            </div>
          ))}
        </div>

        <div className="section-heading">
          <div>
            <h2>Your photos</h2>
            <span>These appear around the messages.</span>
          </div>
        </div>

        <label className="upload-box">
          <input type="file" accept="image/*" multiple onChange={addPhotos} />
          <strong>+ Add photos</strong>
          <span>Select several memories from your phone.</span>
        </label>

        {photos.length > 0 && (
          <div className="creator-photos">
            {photos.map(photo => (
              <div className="creator-photo" key={photo.id}>
                <img src={photo.url} alt="" />
                <button onClick={() => removePhoto(photo.id)}>×</button>
              </div>
            ))}
          </div>
        )}

        <button className="primary-button" onClick={createCard}>Preview receiver experience</button>

        {created && (
          <div className="created-box">
            <strong>Your preview is ready.</strong>
            <a href="/sorry/demo">Open receiver experience →</a>
            <span>For now this stores the photos in this browser. Firebase can be connected next.</span>
          </div>
        )}
      </section>
    </main>
  )
}

function Receiver() {
  const [card, setCard] = useState(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem("sorry-card-demo")
    if (saved) {
      try {
        setCard(JSON.parse(saved))
      } catch {
        setCard(null)
      }
    }
  }, [])

  const data = card || {
    recipient: "Giriesh",
    sender: "Someone who is sorry",
    messages: defaultMessages,
    photos: demoPhotos
  }

  const sections = useMemo(() => data.messages.map((message, i) => ({
    message,
    photo: data.photos.length ? data.photos[i % data.photos.length] : null
  })), [data])

  return (
    <main className="receiver-shell">
      <div className="receiver-top">
        <span>for {data.recipient}</span>
        <span>♥</span>
      </div>

      <section className="intro">
        <p className="tiny-label">A message from {data.sender}</p>
        <h1>I'm sorry, {data.recipient}.</h1>
        <p className="intro-copy">There are a few things I really need you to know.</p>
      </section>

      <div className="message-stack">
        {sections.map((section, i) => (
          <MessageSection
            key={i}
            message={section.message}
            photo={section.photo}
            position={i}
          />
        ))}
      </div>

      <section className="final-section">
        <div className="final-photo-cluster">
          {data.photos.slice(0, 3).map((photo, i) => (
            <img className={`final-photo final-${i}`} key={photo + i} src={photo} alt="" />
          ))}
        </div>
        <p className="tiny-label">One last thing</p>
        <h2>Can we make things right?</h2>
        <p>{data.recipient}, I'm genuinely sorry.</p>
        <button className="forgive-button" onClick={() => setIndex(value => value + 1)}>
          I forgive you ❤️
        </button>
        {index > 0 && <div className="reply">Thank you for hearing me out.</div>}
      </section>
    </main>
  )
}

function MessageSection({ message, photo, position }) {
  const layouts = ["left", "right", "wide", "left"]
  const [visible, setVisible] = useState(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const element = document.getElementById(`message-${position}`)
    if (!element) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true)
            setTimeout(() => setSettled(true), 850)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.35 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [position])

  return (
    <section
      id={`message-${position}`}
      className={`message-section ${layouts[position % layouts.length]} ${visible ? "is-visible" : ""} ${settled ? "is-settled" : ""}`}
    >
      {photo && <img className="memory-photo" src={photo} alt="" />}
      <div className="message-copy">
        <span className="message-number">0{position + 1}</span>
        <p>{message}</p>
      </div>
    </section>
  )
}

createRoot(document.getElementById("root")).render(<App />)