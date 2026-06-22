import { useEffect, useState } from 'react'
import {
  brDateToIso,
  formatBrDateInput,
  isoToBrDate,
  isValidBrDate,
} from '../lib/time'

interface DateInputProps {
  value: string
  onChange: (isoDate: string) => void
  id?: string
  required?: boolean
}

export function DateInput({ value, onChange, id, required }: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToBrDate(value))

  useEffect(() => {
    setDisplay(isoToBrDate(value))
  }, [value])

  function handleChange(raw: string) {
    const formatted = formatBrDateInput(raw)
    setDisplay(formatted)

    if (formatted.length === 10) {
      const iso = brDateToIso(formatted)
      onChange(iso ?? '')
    }
  }

  const isComplete = display.length === 10
  const isInvalid = isComplete && !isValidBrDate(display)

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className={`locale-input ${isInvalid ? 'invalid' : ''}`}
      value={display}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="dd/mm/aaaa"
      autoComplete="off"
      required={required}
      aria-invalid={isInvalid}
      maxLength={10}
    />
  )
}
