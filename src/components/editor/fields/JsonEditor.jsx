import React, { useEffect, useState } from 'react'

export function JsonEditor({ value, onChange }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2))
  const [err, setErr] = useState('')

  useEffect(() => {
    setText(JSON.stringify(value, null, 2))
  }, [value])

  const tryParse = s => {
    try {
      const parsed = JSON.parse(s)
      setErr('')
      onChange(parsed)
    } catch (e) {
      setErr(e.message)
    }
  }

  return (
    <div className="ce-json">
      <textarea
        className="ce-input ce-json-textarea"
        value={text}
        onChange={e => {
          setText(e.target.value)
          tryParse(e.target.value)
        }}
        spellCheck={false}
      />
      {err && <div className="ce-json-err">JSON 错误：{err}</div>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
