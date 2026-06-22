export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isoToBrDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

export function brDateToIso(brDate: string): string | null {
  const match = brDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function isValidBrDate(brDate: string): boolean {
  return brDateToIso(brDate) !== null
}

export function formatBrDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function getNowTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function calcWorkedMinutes(
  startTime: string,
  endTime: string,
  lunchMinutes: number,
): number {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  if (end <= start) return 0
  return Math.max(0, end - start - lunchMinutes)
}

export function formatMinutes(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? '-' : totalMinutes > 0 ? '+' : ''
  const abs = Math.abs(totalMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60

  if (hours === 0) return `${sign}${minutes}min`
  if (minutes === 0) return `${sign}${hours}h`
  return `${sign}${hours}h ${minutes}min`
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}min`
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
}

export function isValidEntry(
  startTime: string,
  endTime: string,
  lunchMinutes: number,
): string | null {
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return 'Horário inválido. Use o formato HH:mm.'
  }
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return 'O horário de saída deve ser depois da entrada.'
  }
  const worked = calcWorkedMinutes(startTime, endTime, lunchMinutes)
  if (worked <= 0) {
    return 'O tempo de almoço não pode ser maior ou igual ao período trabalhado.'
  }
  if (lunchMinutes < 0) {
    return 'O tempo de almoço não pode ser negativo.'
  }
  return null
}
