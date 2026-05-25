import React, { useState, useEffect, useRef } from 'react'
import { useLang } from '../lang'
import { BOOKS, FILMS, MUSIC, READING_LOG } from '../data'
import { Stars } from '../hooks'
import { useNP } from '../np-context'

const LOG_STORAGE_KEY = 'chen.readingLog.userEntries'

export default function Library() {
  const { lang } = useLang()
  const [tab, setTab] = useState('books')

  const tabs = [
    { id: 'books',  label: lang === 'zh' ? '书'     : 'Books',       en: lang === 'zh' ? 'shū'  : '书',  count: BOOKS.length },
    { id: 'films',  label: lang === 'zh' ? '影'     : 'Cinema',      en: lang === 'zh' ? 'yǐng' : '影',  count: FILMS.length },
    { id: 'music',  label: lang === 'zh' ? '音'     : 'Sounds',      en: lang === 'zh' ? 'yīn'  : '音',  count: MUSIC.length },
    { id: 'log',    label: lang === 'zh' ? '读书日志': 'Reading log', en: lang === 'zh' ? 'log'  : 'log', count: '∞' },
  ]

  return (
    <section id="library">
      <div className="section-header">
        <div>
          <div className="section-num">04 / {lang === 'zh' ? '私藏' : 'Private stacks'}</div>
          <h2 className="section-title">
            {lang === 'zh' ? '愿意递给你的东西' : 'Things worth passing on'}
            <em>{lang === 'zh' ? 'library' : '私藏'}</em>
          </h2>
        </div>
        <div className="section-meta">{lang === 'zh' ? '随手记 · 每周更新' : 'Curated · updated weekly'}</div>
      </div>

      <div className="collection-tabs">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            className={`collection-tab ${tab === tb.id ? 'active' : ''}`}
            onClick={() => setTab(tb.id)}
          >
            <span>{tb.label}</span>
            <em>· {tb.en} · {typeof tb.count === 'number' ? String(tb.count).padStart(2, '0') : tb.count}</em>
          </button>
        ))}
      </div>

      {tab === 'books' && <Bookshelf />}
      {tab === 'films' && <Cinema />}
      {tab === 'music' && <Playlist />}
      {tab === 'log'   && <ReadingLog />}
    </section>
  )
}

function Bookshelf() {
  const { lang, t } = useLang()
  const [hovered, setHovered] = useState(null)
  return (
    <div className="bookshelf">
      {BOOKS.map((b, i) => (
        <div
          className="book"
          key={i}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(curr => curr === i ? null : curr)}
        >
          <div className="book-cover" style={{ background: b.color, color: b.text }}>
            <div className="spine"></div>
            <div className="label" style={{ color: b.text }}>
              <h5 style={{ color: b.text }}>{t(b.title)}</h5>
              <span className="author" style={{ color: b.text, opacity: 0.7 }}>{b.author}</span>
            </div>
          </div>
          <div className="book-meta">
            <Stars n={b.stars} />
            <span>{b.year}</span>
          </div>
          <p className="book-note">"{t(b.note)}"</p>

          {hovered === i && (
            <div className="book-block" data-col={i % 5}>
              <div className="bb-cover" style={{ background: b.color, color: b.text }}>
                <h5 style={{ color: b.text }}>{t(b.title)}</h5>
                <span className="bb-cover-auth" style={{ color: b.text, opacity: 0.7 }}>{b.author}</span>
              </div>
              <div className="bb-body">
                <div className="bb-meta">
                  <span className="bb-stars">{'★'.repeat(b.stars)}<span style={{ opacity: 0.3 }}>{'·'.repeat(5 - b.stars)}</span></span>
                  <span className="bb-year">{lang === 'zh' ? '读于' : 'read'} · {b.year}</span>
                </div>
                <h4 className="bb-title">{t(b.title)}</h4>
                <p className="bb-author">{b.author}</p>
                <p className="bb-note">{t(b.note)}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Cinema() {
  const { t } = useLang()
  return (
    <div className="cinema-grid">
      {FILMS.map((f, i) => (
        <div className="film" key={i}>
          <div className="ticket-top">
            <span>NO · {String(i + 1).padStart(3, '0')}</span>
            <span className="year">{f.year}</span>
          </div>
          <h4>
            {f.title}
            {f.subtitle && <em>{f.subtitle}</em>}
          </h4>
          <div className="director">dir. {f.director}</div>
          <p className="quote">{t(f.note)}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Playlist (music tab) ─── Click any song with a source ID to play it in NowPlaying.
function Playlist() {
  const { lang, t } = useLang()
  const np = useNP()
  const fileRef = useRef(null)

  const canPlay = (m) => !!(m.spotifyId || m.neteaseId || m.audio)
  const isPlaying = (m) => {
    const a = np.active
    if (!a) return false
    if (a.source === 'spotify' && a.spotifyId === m.spotifyId && !!m.spotifyId) return true
    if (a.source === 'netease' && a.neteaseId === m.neteaseId && !!m.neteaseId) return true
    if (a.source === 'html5'   && a.audio === m.audio && !!m.audio) return true
    return false
  }

  const play = (m) => {
    if (!canPlay(m)) return
    np.playTrack({ track: m.track, artist: m.artist, spotifyId: m.spotifyId, neteaseId: m.neteaseId, audio: m.audio })
  }

  const onUpload = (e) => {
    np.addUploads(e.target.files, { autoplay: true })
    e.target.value = ''
  }

  return (
    <>
      <div className="playlist-actions">
        <button className="np-upload-btn" style={{ marginBottom: 0 }} onClick={() => fileRef.current?.click()}>
          + {lang === 'zh' ? '上传歌曲' : 'Upload song'}
        </button>
        <input ref={fileRef} type="file" accept="audio/*" multiple onChange={onUpload} style={{ display: 'none' }} />
        <span className="playlist-hint">
          {lang === 'zh' ? '点击任意一首播放（需填好对应音源 ID）' : 'Click any row to play (requires source IDs)'}
        </span>
      </div>

      <div className="playlist">
        <div className="playlist-row header">
          <span>#</span>
          <span>{lang === 'zh' ? '曲目' : 'Track'}</span>
          <span>{lang === 'zh' ? '为什么' : 'Why'}</span>
          <span>{lang === 'zh' ? '心境' : 'Mood'}</span>
          <span style={{ textAlign: 'right' }}>{lang === 'zh' ? '时长' : 'Time'}</span>
        </div>
        {MUSIC.map((m, i) => {
          const playable = canPlay(m)
          const playing = isPlaying(m)
          return (
            <div
              className={`playlist-row ${playing ? 'playing' : ''} ${playable ? 'playable' : ''}`}
              key={i}
              onClick={() => play(m)}
              role={playable ? 'button' : undefined}
              tabIndex={playable ? 0 : undefined}
            >
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <span className="track">
                {m.track}
                <em>{m.artist} · {m.album}</em>
              </span>
              <span className="note">{t(m.note)}</span>
              <span className="mood">{t(m.mood)}</span>
              <span className="duration">{typeof m.duration === 'number' ? `${Math.floor(m.duration/60)}:${String(m.duration%60).padStart(2,'0')}` : m.duration}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─── Reading log — magazine layout + add-entry form ───
function ReadingLog() {
  const { lang, t } = useLang()
  const [userEntries, setUserEntries] = useState(() => {
    try {
      const raw = localStorage.getItem(LOG_STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)  // index of entry being edited, or null

  useEffect(() => {
    try { localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(userEntries)) } catch {}
  }, [userEntries])

  // Merge user entries (front, newest first) with curated READING_LOG.
  // User entries have shape: { date, title:{en,zh}, author, stars, status, cover, excerpt:{en,zh} }
  // Curated entries are the original simple shape; they coexist.
  const all = [
    ...userEntries.map((e, i) => ({ ...e, _userIdx: i })),
    ...READING_LOG,
  ]

  const statusLabel = (s) => ({
    finished:  lang === 'zh' ? '读完'   : 'finished',
    reread:    lang === 'zh' ? '重读'   : 'reread',
    skimmed:   lang === 'zh' ? '翻阅'   : 'skimmed',
    abandoned: lang === 'zh' ? '弃读'   : 'abandoned',
  }[s] || s)

  const addEntry = (entry) => {
    if (editing !== null) {
      setUserEntries(prev => prev.map((e, i) => i === editing ? entry : e))
    } else {
      setUserEntries(prev => [entry, ...prev])
    }
    setShowForm(false)
    setEditing(null)
  }

  const removeEntry = (idx) => {
    if (!window.confirm(lang === 'zh' ? '确定删除这条记录？' : 'Delete this entry?')) return
    setUserEntries(prev => prev.filter((_, i) => i !== idx))
  }

  const editEntry = (idx) => {
    setEditing(idx)
    setShowForm(true)
  }

  return (
    <div className="reading-log-v2">
      <div className="rlog-toolbar">
        <button className="btn" onClick={() => { setEditing(null); setShowForm(true) }}>
          <span>+ {lang === 'zh' ? '写一条' : 'Write entry'}</span>
        </button>
        <span className="rlog-count">
          {userEntries.length} {lang === 'zh' ? '条自己写的 ·' : 'personal entries ·'} {READING_LOG.length} {lang === 'zh' ? '条收录' : 'curated'}
        </span>
      </div>

      {/* Personal entries — magazine layout */}
      {userEntries.length > 0 && (
        <div className="rlog-articles">
          {userEntries.map((e, i) => (
            <article key={i} className="rlog-article">
              <div className="rlog-article-img">
                {e.cover ? (
                  <img src={e.cover} alt="" onError={(ev) => { ev.currentTarget.style.display = 'none' }} />
                ) : (
                  <div className="rlog-img-placeholder">
                    <span>{(t(e.title) || '?').slice(0, 1).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="rlog-article-body">
                <div className="rlog-article-meta">
                  <span className="rlog-article-date">{e.date}</span>
                  <span className={`rlog-article-status status-${e.status}`}>{statusLabel(e.status)}</span>
                  <span className="rlog-article-stars">{'★'.repeat(e.stars)}<span style={{opacity:0.3}}>{'·'.repeat(5 - e.stars)}</span></span>
                </div>
                <h3 className="rlog-article-title">{t(e.title)}</h3>
                <p className="rlog-article-author">{e.author}</p>
                <p className="rlog-article-excerpt">{t(e.excerpt)}</p>
                <div className="rlog-article-actions">
                  <button className="rlog-link" onClick={() => editEntry(i)}>
                    {lang === 'zh' ? '编辑' : 'Edit'}
                  </button>
                  <button className="rlog-link rlog-link-danger" onClick={() => removeEntry(i)}>
                    {lang === 'zh' ? '删除' : 'Delete'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Curated entries — compact list (year-grouped) */}
      {READING_LOG.length > 0 && (
        <div className="rlog-curated">
          <h4 className="rlog-curated-head">{lang === 'zh' ? '历史阅读列表' : 'Reading history'}</h4>
          <CuratedList lang={lang} t={t} statusLabel={statusLabel} />
        </div>
      )}

      {showForm && (
        <ReadingLogForm
          initial={editing !== null ? userEntries[editing] : null}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          onSubmit={addEntry}
        />
      )}
    </div>
  )
}

function CuratedList({ lang, t, statusLabel }) {
  const byYear = {}
  READING_LOG.forEach(entry => {
    const year = entry.date.slice(0, 4)
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(entry)
  })
  const years = Object.keys(byYear).sort().reverse()
  return (
    <div className="reading-log">
      {years.map((year) => (
        <div className="log-year" key={year}>
          <div className="log-year-head">
            <h3>{year}</h3>
            <span>{byYear[year].length} {lang === 'zh' ? '本' : 'books'}</span>
          </div>
          <div className="log-entries">
            {byYear[year].map((b, i) => (
              <div className="log-entry" key={i}>
                <span className="log-date">{b.date.slice(5)}</span>
                <div className="log-body">
                  <h5>{t(b.title)}</h5>
                  <p>{b.author}</p>
                </div>
                <div className="log-meta">
                  <Stars n={b.stars} />
                  <span className={`log-status status-${b.status}`}>{statusLabel(b.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ReadingLogForm({ initial, onSubmit, onCancel }) {
  const { lang } = useLang()
  const isEdit = !!initial
  const [titleEn, setTitleEn] = useState(initial?.title?.en || '')
  const [titleZh, setTitleZh] = useState(initial?.title?.zh || '')
  const [author, setAuthor]   = useState(initial?.author || '')
  const [date, setDate]       = useState(initial?.date || new Date().toISOString().slice(0, 7).replace('-', '.'))
  const [stars, setStars]     = useState(initial?.stars ?? 4)
  const [status, setStatus]   = useState(initial?.status || 'finished')
  const [cover, setCover]     = useState(initial?.cover || '')
  const [excerptEn, setExcerptEn] = useState(initial?.excerpt?.en || '')
  const [excerptZh, setExcerptZh] = useState(initial?.excerpt?.zh || '')
  const [showCode, setShowCode] = useState(false)

  const coverFileRef = useRef(null)

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onCancel])

  const handleCoverFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setCover(String(reader.result))
    reader.readAsDataURL(f)
  }

  const buildEntry = () => ({
    date,
    title:   { en: titleEn || titleZh, zh: titleZh || titleEn },
    author,
    stars: Number(stars),
    status,
    cover: cover || undefined,
    excerpt: { en: excerptEn || excerptZh, zh: excerptZh || excerptEn },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!titleEn && !titleZh) return alert(lang === 'zh' ? '请填写书名' : 'Title required')
    onSubmit(buildEntry())
  }

  const codeString = JSON.stringify(buildEntry(), null, 2)

  return (
    <div className="rlog-modal" onClick={onCancel}>
      <div className="rlog-modal-doc" onClick={(e) => e.stopPropagation()}>
        <button className="rlog-modal-close" onClick={onCancel}>✕</button>
        <h2 className="rlog-modal-title">
          {isEdit
            ? (lang === 'zh' ? '编辑读书笔记' : 'Edit reading entry')
            : (lang === 'zh' ? '写一条读书笔记' : 'New reading entry')}
        </h2>

        <form className="rlog-form" onSubmit={handleSubmit}>
          <div className="rlog-form-row">
            <label>
              <span>{lang === 'zh' ? '英文书名' : 'Title (EN)'}</span>
              <input type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Sculpting in Time" />
            </label>
            <label>
              <span>{lang === 'zh' ? '中文书名' : 'Title (中文)'}</span>
              <input type="text" value={titleZh} onChange={(e) => setTitleZh(e.target.value)} placeholder="雕刻时光" />
            </label>
          </div>

          <div className="rlog-form-row">
            <label>
              <span>{lang === 'zh' ? '作者' : 'Author'}</span>
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Andrei Tarkovsky" />
            </label>
            <label>
              <span>{lang === 'zh' ? '日期' : 'Date'}</span>
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="2026.05" />
            </label>
          </div>

          <div className="rlog-form-row">
            <label>
              <span>{lang === 'zh' ? '评分' : 'Stars'}</span>
              <select value={stars} onChange={(e) => setStars(Number(e.target.value))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
              </select>
            </label>
            <label>
              <span>{lang === 'zh' ? '状态' : 'Status'}</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="finished">{lang === 'zh' ? '读完' : 'finished'}</option>
                <option value="reread">{lang === 'zh' ? '重读' : 'reread'}</option>
                <option value="skimmed">{lang === 'zh' ? '翻阅' : 'skimmed'}</option>
                <option value="abandoned">{lang === 'zh' ? '弃读' : 'abandoned'}</option>
              </select>
            </label>
          </div>

          <div className="rlog-form-row">
            <label className="rlog-form-row-full">
              <span>{lang === 'zh' ? '封面图（URL 或上传）' : 'Cover image (URL or upload)'}</span>
              <div className="rlog-cover-input">
                <input type="text" value={cover} onChange={(e) => setCover(e.target.value)}
                  placeholder={lang === 'zh' ? 'https://... 或 点右边上传' : 'https://... or click upload'} />
                <button type="button" onClick={() => coverFileRef.current?.click()}>
                  {lang === 'zh' ? '上传' : 'Upload'}
                </button>
                <input ref={coverFileRef} type="file" accept="image/*"
                  onChange={handleCoverFile} style={{ display: 'none' }} />
              </div>
              {cover && <img src={cover} alt="" className="rlog-cover-preview" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
            </label>
          </div>

          <div className="rlog-form-row">
            <label className="rlog-form-row-full">
              <span>{lang === 'zh' ? '英文笔记 / 感想' : 'Notes / thoughts (EN)'}</span>
              <textarea rows="4" value={excerptEn} onChange={(e) => setExcerptEn(e.target.value)}
                placeholder={lang === 'zh' ? '一两段...' : 'A paragraph or two...'} />
            </label>
          </div>
          <div className="rlog-form-row">
            <label className="rlog-form-row-full">
              <span>{lang === 'zh' ? '中文笔记 / 感想' : 'Notes / thoughts (中文)'}</span>
              <textarea rows="4" value={excerptZh} onChange={(e) => setExcerptZh(e.target.value)}
                placeholder="一两段..." />
            </label>
          </div>

          <div className="rlog-form-foot">
            <button type="button" className="rlog-link" onClick={() => setShowCode(!showCode)}>
              {showCode
                ? (lang === 'zh' ? '隐藏代码' : 'Hide code')
                : (lang === 'zh' ? '复制为 data.js 代码' : 'Copy as data.js code')}
            </button>
            <div style={{ flex: 1 }} />
            <button type="button" className="btn ghost" onClick={onCancel}>
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button type="submit" className="btn">
              {isEdit
                ? (lang === 'zh' ? '保存修改' : 'Save changes')
                : (lang === 'zh' ? '保存' : 'Save')}
            </button>
          </div>

          {showCode && (
            <pre className="rlog-form-code" onClick={(e) => {
              const range = document.createRange()
              range.selectNodeContents(e.currentTarget)
              const sel = window.getSelection()
              sel.removeAllRanges()
              sel.addRange(range)
            }}>{codeString}</pre>
          )}
        </form>
      </div>
    </div>
  )
}
