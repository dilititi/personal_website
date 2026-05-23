import React, { useState } from 'react'
import { useLang } from '../lang'
import { BOOKS, FILMS, MUSIC, READING_LOG } from '../data'
import { Stars } from '../hooks'

export default function Library() {
  const { lang, t } = useLang()
  const [tab, setTab] = useState('books')

  const tabs = [
    { id: 'books',  label: lang === 'zh' ? '书'     : 'Books',       en: lang === 'zh' ? 'shū'  : '书',  count: BOOKS.length },
    { id: 'films',  label: lang === 'zh' ? '影'     : 'Cinema',      en: lang === 'zh' ? 'yǐng' : '影',  count: FILMS.length },
    { id: 'music',  label: lang === 'zh' ? '音'     : 'Sounds',      en: lang === 'zh' ? 'yīn'  : '音',  count: MUSIC.length },
    { id: 'log',    label: lang === 'zh' ? '读书日志': 'Reading log', en: lang === 'zh' ? 'log'  : 'log', count: READING_LOG.length },
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
        <div className="section-meta">
          {lang === 'zh' ? '随手记 · 每周更新' : 'Curated · updated weekly'}
        </div>
      </div>

      <div className="collection-tabs">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            className={`collection-tab ${tab === tb.id ? 'active' : ''}`}
            onClick={() => setTab(tb.id)}
          >
            <span>{tb.label}</span>
            <em>· {tb.en} · {String(tb.count).padStart(2, '0')}</em>
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

function Playlist() {
  const { lang, t } = useLang()
  return (
    <div className="playlist">
      <div className="playlist-row header">
        <span>#</span>
        <span>{lang === 'zh' ? '曲目' : 'Track'}</span>
        <span>{lang === 'zh' ? '为什么' : 'Why'}</span>
        <span>{lang === 'zh' ? '心境' : 'Mood'}</span>
        <span style={{ textAlign: 'right' }}>{lang === 'zh' ? '时长' : 'Time'}</span>
      </div>
      {MUSIC.map((m, i) => (
        <div className={`playlist-row ${i === 0 ? 'playing' : ''}`} key={i}>
          <span className="num">{String(i + 1).padStart(2, '0')}</span>
          <span className="track">
            {m.track}
            <em>{m.artist} · {m.album}</em>
          </span>
          <span className="note">{t(m.note)}</span>
          <span className="mood">{t(m.mood)}</span>
          <span className="duration">{m.duration}</span>
        </div>
      ))}
    </div>
  )
}

function ReadingLog() {
  const { lang, t } = useLang()

  const byYear = {}
  READING_LOG.forEach(entry => {
    const year = entry.date.slice(0, 4)
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(entry)
  })
  const years = Object.keys(byYear).sort().reverse()

  const statusLabel = (s) => {
    const map = {
      finished:  lang === 'zh' ? '读完'   : 'finished',
      reread:    lang === 'zh' ? '重读'   : 'reread',
      skimmed:   lang === 'zh' ? '翻阅'   : 'skimmed',
      abandoned: lang === 'zh' ? '弃读'   : 'abandoned',
    }
    return map[s] || s
  }

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
