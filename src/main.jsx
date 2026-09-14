import React, { useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore"
import { loginAnonymous, db } from "./firebase"
import "./styles.css"

const defaultMessages = [
  "Mirudulaa,\n\nEnnaku puriyudhu.\nNaa Bangalore la panna vishayam\nunakku evlo hurt aagirukkum nu.",
  "Naa edhuvum justify panna virumbala.\nNaa pannadhu thappu.",
  "Unna hurt pannadhu\ndhaan enakku romba varuthama irukku.\n\nI'm genuinely sorry.",
  "Unna lose pannidanum nu\nnaan eppovume nenachadhu illa.\n\nAnd I really hope\nnamma rendu perum\noru naal normal-aa pesuvom."
]

const demoPhotos = [
  "/demo/memory-1.svg",
  "/demo/memory-2.svg",
  "/demo/memory-3.svg",
  "/demo/memory-4.svg"
]

const CLOUDINARY_CLOUD_NAME = "wsfw9iex"
const CLOUDINARY_UPLOAD_PRESET = "special_photos"

function makeCardId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  const values = new Uint32Array(10)

  crypto.getRandomValues(values)

  return Array.from(
    values,
    value => chars[value % chars.length]
  ).join("")
}

function App() {
  const isReceiver =
    window.location.pathname.startsWith("/sorry/")

  return isReceiver ? <Receiver /> : <Creator />
}

function Creator() {
  const [recipient, setRecipient] = useState("Giriesh")
  const [sender, setSender] = useState("Someone who is sorry")
  const [messages, setMessages] = useState(defaultMessages)
  const [photos, setPhotos] = useState([])
  const [shareUrl, setShareUrl] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loginAnonymous().catch(() => {})
  }, [])

  const addMessage = () => {
    setMessages(value => [
      ...value,
      "Write another thing you want them to know."
    ])
  }

  const updateMessage = (index, value) => {
    setMessages(items =>
      items.map((item, i) =>
        i === index ? value : item
      )
    )
  }

  const removeMessage = index => {
    setMessages(items =>
      items.filter((_, i) => i !== index)
    )
  }

  const addPhotos = event => {
    const files = [...event.target.files]

    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        return false
      }

      if (file.size > 8 * 1024 * 1024) {
        return false
      }

      return true
    })

    const remainingSlots = Math.max(
      0,
      8 - photos.length
    )

    const selectedFiles =
      validFiles.slice(
        0,
        remainingSlots
      )

    const newPhotos =
      selectedFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        name: file.name
      }))

    setPhotos(items => [
      ...items,
      ...newPhotos
    ])

    event.target.value = ""

    if (
      files.some(
        file =>
          file.size >
          8 * 1024 * 1024
      )
    ) {
      setError(
        "Each photo must be smaller than 8 MB."
      )
    } else if (
      files.length >
      remainingSlots
    ) {
      setError(
        "You can add up to 8 photos."
      )
    } else {
      setError("")
    }
  }

  const removePhoto = id => {
    setPhotos(items => {
      const photo =
        items.find(
          item => item.id === id
        )

      if (photo?.url) {
        URL.revokeObjectURL(
          photo.url
        )
      }

      return items.filter(
        item => item.id !== id
      )
    })
  }

  const uploadPhoto =
    async file => {
      const formData =
        new FormData()

      formData.append(
        "file",
        file
      )

      formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
      )

      const response =
        await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData
          }
        )

      if (!response.ok) {
        throw new Error(
          "Photo upload failed."
        )
      }

      const result =
        await response.json()

      if (!result.secure_url) {
        throw new Error(
          "Cloudinary did not return an image URL."
        )
      }

      return result.secure_url
    }

  const createCard =
    async () => {
      setError("")

      const cleanRecipient =
        recipient.trim()

      const cleanSender =
        sender.trim()

      const cleanMessages =
        messages
          .map(message =>
            message.trim()
          )
          .filter(Boolean)

      if (!cleanRecipient) {
        setError(
          "Please enter their name."
        )

        return
      }

      if (!cleanSender) {
        setError(
          "Please enter your name."
        )

        return
      }

      if (!cleanMessages.length) {
        setError(
          "Please add at least one message."
        )

        return
      }

      setCreating(true)

      try {
        const firebaseUser =
          await loginAnonymous()

        const cardId =
          makeCardId()

        const photoUrls = []

        for (
          const photo of photos
        ) {
          const url =
            await uploadPhoto(
              photo.file
            )

          photoUrls.push(url)
        }

        await setDoc(
          doc(
            collection(
              db,
              "cards"
            ),
            cardId
          ),
          {
            recipient:
              cleanRecipient,

            sender:
              cleanSender,

            messages:
              cleanMessages,

            photos:
              photoUrls,

            ownerUid:
              firebaseUser.uid,

            createdAt:
              serverTimestamp()
          }
        )

        const url =
          `${window.location.origin}/sorry/${cardId}`

        setShareUrl(url)
      } catch (err) {
        console.error(err)

        setError(
          "Something went wrong while creating your message. Please try again."
        )
      } finally {
        setCreating(false)
      }
    }

  return (
    <main className="creator-shell">
      <section className="creator-card">
        <div className="eyebrow">
          FROM MY HEART
        </div>

        <h1>
          Create the message they should see.
        </h1>

        <p className="lead">
          Your words stay in the middle.
          Your memories sit around them.
        </p>

        <label>
          Their name

          <input
            value={recipient}
            onChange={e =>
              setRecipient(
                e.target.value
              )
            }
          />
        </label>

        <label>
          Your name

          <input
            value={sender}
            onChange={e =>
              setSender(
                e.target.value
              )
            }
          />
        </label>

        <div className="section-heading">
          <div>
            <h2>
              Your messages
            </h2>

            <span>
              One message per section.
            </span>
          </div>

          <button
            className="small-button"
            onClick={addMessage}
            type="button"
          >
            + Add
          </button>
        </div>

        <div className="message-editor">
          {messages.map(
            (message, index) => (
              <div
                className="message-row"
                key={index}
              >
                <span>
                  {index + 1}
                </span>

                <textarea
                  value={message}
                  onChange={e =>
                    updateMessage(
                      index,
                      e.target.value
                    )
                  }
                />

                {messages.length >
                  1 && (
                  <button
                    className="delete-button"
                    onClick={() =>
                      removeMessage(
                        index
                      )
                    }
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
            )
          )}
        </div>

        <div className="section-heading">
          <div>
            <h2>
              Your photos
            </h2>

            <span>
              These appear around the messages.
            </span>
          </div>
        </div>

        <label className="upload-box">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={addPhotos}
          />

          <strong>
            + Add photos
          </strong>

          <span>
            Select several memories
            from your phone or computer.
          </span>
        </label>

        {photos.length > 0 && (
          <div className="creator-photos">
            {photos.map(
              photo => (
                <div
                  className="creator-photo"
                  key={photo.id}
                >
                  <img
                    src={photo.url}
                    alt=""
                  />

                  <button
                    onClick={() =>
                      removePhoto(
                        photo.id
                      )
                    }
                    type="button"
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <button
          className="primary-button"
          onClick={createCard}
          disabled={creating}
          type="button"
        >
          {creating
            ? "Creating your message..."
            : "Create receiver link"}
        </button>

        {shareUrl && (
          <div className="created-box">
            <strong>
              Your receiver link is ready.
            </strong>

            <a href={shareUrl}>
              Open receiver experience →
            </a>

            <input
              className="share-link"
              value={shareUrl}
              readOnly
              onFocus={e =>
                e.target.select()
              }
            />

            <button
              className="copy-button"
              onClick={() =>
                navigator.clipboard.writeText(
                  shareUrl
                )
              }
              type="button"
            >
              Copy link
            </button>

            <span>
              Send this link to them.
              Their browser will load the
              message and photos directly
              from the cloud.
            </span>
          </div>
        )}
      </section>
    </main>
  )
}

function Receiver() {
  const [card, setCard] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [forgiven, setForgiven] =
    useState(false)

  const pathParts =
    window.location.pathname
      .split("/")
      .filter(Boolean)

  const cardId =
    pathParts[1]

  const isDemo =
    cardId === "demo"

  useEffect(() => {
    if (isDemo) {
      setLoading(false)
      return
    }

    if (!cardId) {
      setError(
        "This message link is not valid."
      )

      setLoading(false)

      return
    }

    const loadCard =
      async () => {
        try {
          const snapshot =
            await getDoc(
              doc(
                db,
                "cards",
                cardId
              )
            )

          if (!snapshot.exists()) {
            setError(
              "This message could not be found."
            )

            return
          }

          setCard(
            snapshot.data()
          )
        } catch (err) {
          console.error(err)

          setError(
            "Unable to load this message."
          )
        } finally {
          setLoading(false)
        }
      }

    loadCard()
  }, [cardId, isDemo])

  const data =
    useMemo(
      () => ({
        recipient:
          card?.recipient ||
          "Giriesh",

        sender:
          card?.sender ||
          "Someone who is sorry",

        messages:
          Array.isArray(
            card?.messages
          ) &&
          card.messages.length
            ? card.messages
            : defaultMessages,

        photos:
          Array.isArray(
            card?.photos
          ) &&
          card.photos.length
            ? card.photos
            : demoPhotos
      }),
      [card]
    )

  const sections =
    useMemo(() => {
      const result = []

      let cursor = 0

      for (
        let i = 0;
        i < data.messages.length;
        i++
      ) {
        const remainingMessages =
          data.messages.length - i

        const remainingPhotos =
          data.photos.length - cursor

        let count = 0

        if (remainingPhotos > 0) {
          count =
            remainingPhotos >=
            remainingMessages * 2
              ? 2
              : 1
        }

        result.push({
          message:
            data.messages[i],

          photos:
            data.photos.slice(
              cursor,
              cursor + count
            )
        })

        cursor += count
      }

      return result
    }, [
      data.messages,
      data.photos
    ])

  if (loading) {
    return (
      <main className="receiver-shell receiver-state">
        <p>
          Loading something from the heart...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="receiver-shell receiver-state">
        <p>
          {error}
        </p>
      </main>
    )
  }

  const handleForgive =
    () => {
      setForgiven(true)

      setTimeout(() => {
        document
          .getElementById(
            "forgiven-message"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          })
      }, 100)
    }

  return (
    <main className="receiver-shell">
      <header className="receiver-nav">
        <span>
          for {data.recipient}
        </span>

        <span className="nav-mark">
          ♥
        </span>
      </header>

      <section className="receiver-opening">
        <div className="opening-glow" />

        <p className="tiny-label">
          A little something from{" "}
          {data.sender}
        </p>

        <h1>
          I wanted you
          <br />
          <em>
            to know.
          </em>
        </h1>

        <p className="opening-copy">
          Not to make excuses.
          Just to say the things
          I should have said.
        </p>

        <div className="scroll-cue">
          <span>
            keep reading
          </span>

          <i />
        </div>
      </section>

      <section className="message-intro">
        <p>
          There are some things
          I should have said sooner.
        </p>
      </section>

      <div className="message-stack">
        {sections.map(
          (section, index) => (
            <MessageSection
              key={`${index}-${section.message}`}
              message={section.message}
              photos={section.photos}
              index={index}
            />
          )
        )}
      </div>

      <section className="receiver-ending">
        <p className="tiny-label">
          And finally
        </p>

        <h2>
          I am sorry.
        </h2>

        <div className="ending-copy">
          <p>
            I know I can't undo what happened.
          </p>

          <p>
            I just wanted you to know that it truly
            <br />
            matters to me,
            <br />
            and I'm really sorry.
          </p>
        </div>

        <p className="ending-secondary">
          You don't have to reply.
          <br />
          Just know that I care about you,
          <br />
          and I hope we can be okay again someday.
        </p>

        <div className="ending-heart">
          ♥
        </div>

        <button
          className="forgive-button"
          onClick={handleForgive}
          type="button"
        >
          Forgive me ♥
        </button>

        <div
          className={`forgiven-message ${forgiven ? "show" : ""}`}
          id="forgiven-message"
        >
          <span>♥</span>
          <strong>
            Thank you.
          </strong>
          <p>
            That means more to me than you know.
          </p>
        </div>

        <div className="final-thanks">
          <span>
            THANK YOU FOR BEING HERE
          </span>
        </div>
      </section>
    </main>
  )
}

function MessageSection({ message, photos, index }) {
  const [visible, setVisible] =
    useState(false)

  const layout =
    photos.length === 2
      ? "split"
      : index % 2 === 0
        ? "left"
        : "right"

  useEffect(() => {
    const element =
      document.getElementById(
        `message-${index}`
      )

    if (!element) {
      return
    }

    const observer =
      new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setVisible(true)
              observer.disconnect()
            }
          })
        },
        {
          threshold: 0.22
        }
      )

    observer.observe(element)

    return () => observer.disconnect()
  }, [index])

  return (
    <section
      className={`message-section ${layout} ${visible ? "is-visible" : ""}`}
      id={`message-${index}`}
    >
      {photos.map(
        (photo, photoIndex) => (
          <div
            className={`message-photo photo-${photoIndex + 1}`}
            key={photo}
          >
            <img
              src={photo}
              alt=""
              loading="lazy"
            />
          </div>
        )
      )}

      <div className="message-copy">
        <span className="message-number">
          {String(index + 1).padStart(2, "0")}
        </span>

        <p>
          {message}
        </p>
      </div>
    </section>
  )
}

createRoot(
  document.getElementById("root")
).render(<App />)
