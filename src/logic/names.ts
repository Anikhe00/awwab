import { daysBetween } from './dates'
/** One Name per day, in order, starting from when the journey began; cycles after 99. */
export const todayNameId = (startDate: string, today: string, total = 99) =>
  ((Math.max(0, daysBetween(startDate, today)) % total) + 1)
