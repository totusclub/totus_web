/**
 * Маша на телефоне и планшете (ширина до 1024px) — чат на весь экран.
 * Макет «Маша на телефоне» утверждён владельцем 09.10.2026.
 *
 * Компьютер не трогаем: там по-прежнему ChatWidget из пакета (см. GlobalAiChat).
 * Данные и сокет — те же, что у ChatWidget: useAssistant / useAssistantStore из пакета,
 * сообщения и карточки туров рисует ChatMessage из пакета.
 *
 * Что решает:
 *  - страница не увеличивается при нажатии на поле: шрифт поля 16px (iOS увеличивает при < 16px);
 *  - нет прокрутки вбок: чат во всю ширину, лента режет всё, что шире экрана;
 *  - поле ввода прямо над клавиатурой: высота чата = видимая часть экрана (visualViewport);
 *  - страница под чатом не прокручивается; «Назад» (жест / кнопка Android) закрывает чат.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useRouter } from 'next/router'
import { ChatMessage, useAssistant, useAssistantStore } from '@tosmedia/ai-assistant'
import styles from './mobileMilaChat.module.css'
import TotusIcon from '@/components/icons/totus/TotusIcon'
import { iconChevronLeft, iconClose, iconMila, iconPlus, iconSend } from '@/components/icons/totus/icons.generated'

/** Готовые вопросы на первом экране — те же, что в пакете (QuickActions). */
export const MILA_STARTS = [
  { label: 'Совет, куда ехать', prompt: 'Посоветуйте, куда поехать в отпуск' },
  { label: 'Туры в Турцию', prompt: 'Найди туры в Турцию' },
  { label: 'Туры в Египет', prompt: 'Найди туры в Египет' },
  {
    label: 'Что такое «ультра всё включено»',
    prompt: 'Чем «ультра всё включено» отличается от «всё включено»? Что лучше для семьи с детьми?',
  },
]

/** Подсказки следующего шага — под лентой, когда Маша показала туры. */
export const MILA_FOLLOW_UPS = [
  { label: 'Дешевле', prompt: 'Покажи варианты дешевле' },
  { label: 'Ближе к морю', prompt: 'Покажи отели ближе к морю' },
  { label: 'Другие даты', prompt: 'Подбери варианты на другие даты' },
]

/** Поле растёт до 5 строк (строка 20px + отступы 24px + рамка 2px), дальше прокручивается внутри. */
const FIELD_MAX_HEIGHT = 5 * 20 + 24 + 2

const isWelcome = (id: string) => id === 'welcome' || id.startsWith('welcome')

const CloseIcon = () => <TotusIcon icon={iconClose} />
const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
)
const BackIcon = () => <TotusIcon icon={iconChevronLeft} />
const SendIcon = () => <TotusIcon icon={iconSend} accent={false} />
const PlusIcon = () => <TotusIcon icon={iconPlus} accent={false} />
const ChatIcon = () => <TotusIcon icon={iconMila} accent={false} />

/** Строка «Мои чаты»: смахивание влево открывает «Удалить». */
function ChatRow({
  title,
  updatedAt,
  active,
  onOpen,
  onDelete,
}: {
  title: string
  updatedAt: number
  active: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  const [shift, setShift] = useState(0)
  const [open, setOpen] = useState(false)
  const start = useRef<{ x: number; y: number; base: number; moved: boolean } | null>(null)
  const dragged = useRef(false) // после смахивания нажатие не открывает чат
  const REVEAL = 96

  const onDown = (e: ReactPointerEvent) => {
    dragged.current = false
    start.current = { x: e.clientX, y: e.clientY, base: open ? -REVEAL : 0, moved: false }
  }
  const onMove = (e: ReactPointerEvent) => {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x
    if (!s.moved && Math.abs(dx) < 8) return
    if (!s.moved && Math.abs(e.clientY - s.y) > Math.abs(dx)) {
      start.current = null // вертикальная прокрутка списка
      return
    }
    if (!s.moved) {
      dragged.current = true
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    }
    s.moved = true
    setShift(Math.max(-REVEAL, Math.min(0, s.base + dx)))
  }
  const onUp = () => {
    const s = start.current
    start.current = null
    if (!s || !s.moved) {
      setShift(open ? -REVEAL : 0)
      return
    }
    const next = shift < -REVEAL / 2
    setOpen(next)
    setShift(next ? -REVEAL : 0)
  }

  const date = new Date(updatedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })

  return (
    <li className={styles.rowWrap}>
      <button type="button" className={styles.rowDelete} onClick={onDelete} tabIndex={open ? 0 : -1}>
        Удалить
      </button>
      <div
        className={`${styles.row} ${active ? styles.rowActive : ''}`}
        style={{ transform: `translateX(${shift}px)` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <button
          type="button"
          className={styles.rowOpen}
          onClick={() => {
            if (dragged.current) {
              dragged.current = false
              return
            }
            if (open) {
              setOpen(false)
              setShift(0)
              return
            }
            onOpen()
          }}
        >
          <span className={styles.rowTitle}>{title || 'Новый чат'}</span>
          <time className={styles.rowDate}>{date}</time>
        </button>
      </div>
    </li>
  )
}

export default function MobileMilaChat({ hideFab = false }: { hideFab?: boolean }) {
  const router = useRouter()
  const { isOpen, isConnected, isTyping, messages, setOpen, send, newChat, openChat } = useAssistant()
  const chats = useAssistantStore((s) => s.chats)
  const activeChatId = useAssistantStore((s) => s.activeChatId)
  const deleteChat = useAssistantStore((s) => s.deleteChat)
  const typingStatus = useAssistantStore((s) => s.typingStatus)

  const [view, setView] = useState<'chat' | 'list'>('chat')
  const [draft, setDraft] = useState('')
  const sheetRef = useRef<HTMLDivElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const historyPushedRef = useRef(false)

  const visible = messages.filter((m) => !isWelcome(m.id))
  const isEmpty = visible.length === 0
  const last = visible[visible.length - 1]
  const showFollowUps =
    !isTyping && !!last && last.role === 'assistant' && Boolean(last.metadata?.tour_results?.length)

  // Сообщения в чат из других мест сайта (как у ChatWidget пакета).
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      if (detail) send(detail)
    }
    window.addEventListener('assistant:send', handler)
    return () => window.removeEventListener('assistant:send', handler)
  }, [send])

  // Высота чата = видимая часть экрана: при открытой клавиатуре поле ввода стоит прямо над ней.
  useLayoutEffect(() => {
    if (!isOpen) return
    const vv = window.visualViewport
    const apply = () => {
      const el = sheetRef.current
      if (!el) return
      const height = vv ? vv.height : window.innerHeight
      const top = vv ? vv.offsetTop : 0
      el.style.setProperty('--mila-vh', `${Math.round(height)}px`)
      el.style.setProperty('--mila-top', `${Math.round(top)}px`)
      const feed = feedRef.current
      if (feed && document.activeElement === fieldRef.current) feed.scrollTop = feed.scrollHeight
    }
    apply()
    vv?.addEventListener('resize', apply)
    vv?.addEventListener('scroll', apply)
    window.addEventListener('resize', apply)
    return () => {
      vv?.removeEventListener('resize', apply)
      vv?.removeEventListener('scroll', apply)
      window.removeEventListener('resize', apply)
    }
  }, [isOpen])

  // Страница под чатом не прокручивается и не сдвигается (iOS: position fixed + возврат прокрутки).
  useEffect(() => {
    if (!isOpen) return
    const { body, documentElement: html } = document
    const scrollY = window.scrollY
    const prev = {
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
    return () => {
      body.style.position = prev.bodyPosition
      body.style.top = prev.bodyTop
      body.style.width = prev.bodyWidth
      body.style.overflow = prev.bodyOverflow
      html.style.overflow = prev.htmlOverflow
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  // «Назад» закрывает чат: при открытии кладём в историю запись с тем же адресом.
  // Next.js эту запись не обрабатывает (beforePopState → false), страница не перезагружается.
  useEffect(() => {
    if (isOpen) {
      if (!historyPushedRef.current) {
        window.history.pushState({ ...window.history.state, milaChat: true }, '')
        historyPushedRef.current = true
      }
    } else if (historyPushedRef.current) {
      window.history.back() // закрыли крестиком — убираем свою запись
    }
  }, [isOpen])
  useEffect(() => {
    router.beforePopState(() => !historyPushedRef.current)
    const onPop = () => {
      if (!historyPushedRef.current) return
      historyPushedRef.current = false
      useAssistantStore.getState().setOpen(false)
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      router.beforePopState(() => true)
      if (historyPushedRef.current) {
        historyPushedRef.current = false
        window.history.back()
      }
    }
  }, [router])

  // После закрытия в следующий раз открываем сам чат, а не список.
  useEffect(() => {
    if (!isOpen) setView('chat')
  }, [isOpen])

  // Лента — к последнему сообщению.
  useEffect(() => {
    const feed = feedRef.current
    if (feed) feed.scrollTop = feed.scrollHeight
  }, [messages, isTyping, isOpen, view])

  const resizeField = useCallback(() => {
    const el = fieldRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(46, Math.min(el.scrollHeight + 2, FIELD_MAX_HEIGHT))}px`
  }, [])
  useEffect(resizeField, [draft, resizeField])

  const submit = () => {
    const text = draft.trim()
    if (!text || isTyping) return
    send(text)
    setDraft('')
  }
  const sendPrompt = (prompt: string) => {
    if (isTyping) return
    send(prompt)
  }
  const close = () => setOpen(false)

  if (!isOpen) {
    if (hideFab) return null
    return (
      <div className={styles.fabWrap}>
        <button type="button" className={styles.fab} onClick={() => setOpen(true)} aria-label="Открыть чат с Машей">
          <ChatIcon />
        </button>
      </div>
    )
  }

  return (
    <div ref={sheetRef} className={styles.sheet} role="dialog" aria-modal="true" aria-label="Чат с Машей">
      {view === 'list' ? (
        <>
          <header className={styles.head}>
            <button type="button" className={styles.iconBtn} onClick={() => setView('chat')} aria-label="Назад к чату">
              <BackIcon />
            </button>
            <p className={styles.headTitle}>Мои чаты</p>
          </header>
          <div className={styles.list}>
            <button
              type="button"
              className={styles.newChat}
              onClick={() => {
                newChat()
                setView('chat')
              }}
            >
              <PlusIcon />
              Новый чат
            </button>
            {chats.length > 0 ? (
              <>
                <p className={styles.listLabel}>Недавние</p>
                <ul className={styles.rows}>
                  {[...chats].reverse().map((chat) => (
                    <ChatRow
                      key={chat.id}
                      title={chat.title}
                      updatedAt={chat.updatedAt}
                      active={chat.id === activeChatId}
                      onOpen={() => {
                        openChat(chat.id)
                        setView('chat')
                      }}
                      onDelete={() => deleteChat(chat.id)}
                    />
                  ))}
                </ul>
                <p className={styles.listHint}>Чтобы удалить чат, смахните строку влево</p>
              </>
            ) : (
              <p className={styles.listHint}>Здесь появятся ваши разговоры с Машей</p>
            )}
          </div>
        </>
      ) : (
        <>
          <header className={styles.head}>
            <button type="button" className={styles.iconBtn} onClick={close} aria-label="Закрыть чат">
              <CloseIcon />
            </button>
            <span className={styles.ava} aria-hidden="true">
              ☀️
            </span>
            <div className={styles.who}>
              <p className={styles.headTitle}>Маша</p>
              <small className={isConnected ? styles.online : styles.offline}>
                {isConnected ? 'Онлайн · подбор туров' : 'Переподключение…'}
              </small>
            </div>
            <button type="button" className={styles.iconBtn} onClick={() => setView('list')} aria-label="Мои чаты">
              <ListIcon />
            </button>
          </header>

          <div ref={feedRef} className={styles.feed}>
            {isEmpty ? (
              <div className={styles.hello}>
                <span className={`${styles.ava} ${styles.avaBig}`} aria-hidden="true">
                  ☀️
                </span>
                <h2 className={styles.helloTitle}>Здравствуйте! Я Маша, помогу выбрать тур</h2>
                <p className={styles.helloText}>Напишите, куда и когда хотите поехать, или начните с готового вопроса.</p>
                <div className={styles.starts}>
                  {MILA_STARTS.map((s) => (
                    <button key={s.label} type="button" className={styles.start} onClick={() => sendPrompt(s.prompt)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.messages}>
                {visible.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && (
                  <div className={styles.typing}>
                    <span />
                    <span />
                    <span />
                    {typingStatus ?? 'Думаю'}…
                  </div>
                )}
              </div>
            )}
          </div>

          {showFollowUps && (
            <div className={styles.chips}>
              {MILA_FOLLOW_UPS.map((c) => (
                <button key={c.label} type="button" className={styles.chip} onClick={() => sendPrompt(c.prompt)}>
                  {c.label}
                </button>
              ))}
            </div>
          )}

          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <div className={styles.composerRow}>
              {/* 16px — iOS не увеличивает страницу. «Ввод» переносит строку, отправка — кнопкой. */}
              <textarea
                id="mila-mobile-input"
                ref={fieldRef}
                className={styles.field}
                rows={1}
                value={draft}
                placeholder={isEmpty ? 'Куда хотите поехать?' : 'Сообщение Маше'}
                onChange={(e) => setDraft(e.target.value)}
                enterKeyHint="enter"
                aria-label="Сообщение Маше"
              />
              <button
                type="submit"
                className={styles.send}
                disabled={!draft.trim() || isTyping}
                // Клавиатура не закрывается после отправки.
                onPointerDown={(e) => e.preventDefault()}
                aria-label="Отправить"
              >
                <SendIcon />
              </button>
            </div>
            {!isEmpty && <p className={styles.hint}>Маша может ошибаться — проверяйте детали тура перед оплатой</p>}
          </form>
        </>
      )}
    </div>
  )
}
