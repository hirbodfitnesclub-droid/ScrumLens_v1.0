import dayjs from "dayjs";
import jalaliday from "jalaliday";

// Initialize jalaliday plugin
dayjs.extend(jalaliday);

// Set default calendar to jalali
export const getJalaliDate = (date?: string | Date | dayjs.Dayjs) => {
  return dayjs(date).calendar("jalali");
};

/**
 * Formats a given date to Jalali string: YYYY/MM/DD
 */
export function formatToJalali(dateInput?: string | Date | null, format = "YYYY/MM/DD"): string {
  if (!dateInput) return "ثبت نشده";
  try {
    return dayjs(dateInput).calendar("jalali").format(format);
  } catch (err) {
    return "تاریخ نامعتبر";
  }
}

/**
 * Parses a Gregorian string/date to Jalali Month Name and Year (e.g. خرداد ۱۴۰۵)
 */
export function formatToJalaliMonthYear(dateInput?: string | Date | null): string {
  if (!dateInput) return "ثبت نشده";
  try {
    // Return month name + year
    const d = dayjs(dateInput).calendar("jalali");
    return `${d.format("MMMM")} ${d.format("YYYY")}`;
  } catch (err) {
    return "تاریخ نامعتبر";
  }
}

/**
 * Calculates Gregorian diff in days (e.g. cycle time, age, delayed daycount)
 */
export function daysDifference(date1: string | Date, date2: string | Date): number {
  const d1 = dayjs(date1);
  const d2 = dayjs(date2);
  return Math.abs(d1.diff(d2, "day"));
}

export default dayjs;
