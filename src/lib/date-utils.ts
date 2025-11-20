import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Display a UTC date string in the client's timezone
 * @param dateString - ISO date string from API (stored in UTC)
 * @param timezone - IANA timezone string (e.g., "America/New_York")
 * @param format - dayjs format string (default: 'MMMM D, YYYY')
 * @returns Formatted date string in client's timezone
 */
export function displayClientTime(
  dateString: string | Date | null | undefined,
  timezone: string,
  format: string = 'MMMM D, YYYY'
): string {
  if (!dateString) return 'Not scheduled';
  
  try {
    // Parse UTC date and convert to client timezone
    return dayjs.utc(dateString).tz(timezone).format(format);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Display date and time separately
 */
export function displayClientDateTime(
  dateString: string | Date | null | undefined,
  timezone: string
): { date: string; time: string } {
  return {
    date: displayClientTime(dateString, timezone, 'MMMM D, YYYY'),
    time: displayClientTime(dateString, timezone, 'h:mm A'),
  };
}

