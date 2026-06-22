import { useEffect, useState } from 'react'
import { formatTimeInput, isValidTime } from '../lib/time'

interface TimeInputProps {
  value: string
  onChange: (time: string) => void
  id?: string
  required?: boolean
}

export function TimeInput({ value, onChange, id, required }: TimeInputProps) {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    setDisplay(value)
  }, [value])

  function handleChange(raw: string) {
    const formatted = formatTimeInput(raw)
    setDisplay(formatted)

    if (formatted.length === 5 && isValidTime(formatted)) {
      onChange(formatted)
    }
  }

  const isComplete = display.length === 5
  const isInvalid = isComplete && !isValidTime(display)

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className={`locale-input ${isInvalid ? 'invalid' : ''}`}
      value={display}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="hh:mm"
      autoComplete="off"
      required={required}
      aria-invalid={isInvalid}
      maxLength={5}
    />
  )
}
