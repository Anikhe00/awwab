const pad = (n: number) => String(n).padStart(2, '0')
export const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayStr = () => fmt(new Date())
// Parse as local noon so DST shifts never change the calendar day.
export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}
export const addDays = (s: string, n: number) => {
  const d = parse(s)
  d.setDate(d.getDate() + n)
  return fmt(d)
}
export const daysBetween = (a: string, b: string) =>
  Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000)
/** Monday-based start of week */
export const weekStart = (s: string) => {
  const d = parse(s)
  const dow = (d.getDay() + 6) % 7
  return addDays(s, -dow)
}
