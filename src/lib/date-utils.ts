import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

/**
 * Get timezone abbreviation (e.g., CST, EST, PST) using dayjs native support
 * Uses dayjs's 'z' token which requires advancedFormat plugin
 */
export function getTimezoneAbbreviation(tz: string, date?: Date | string): string {
  try {
    const dateObj = date ? dayjs(date) : dayjs();
    // Convert to the timezone first, then format with 'z' token
    return dateObj.tz(tz).format('z');
  } catch (error) {
    // Fallback: extract city name from timezone
    return tz.split('/').pop()?.replace('_', ' ') || tz;
  }
}

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
 * Display date and time separately with timezone
 * Uses dayjs native timezone abbreviation support
 */
export function displayClientDateTime(
  dateString: string | Date | null | undefined,
  timezone: string
): { date: string; time: string; timezoneAbbr: string } {
  if (!dateString) {
    return { date: 'Not scheduled', time: '', timezoneAbbr: '' };
  }
  
  try {
    // Parse UTC date and convert to client timezone
    const dateInTz = dayjs.utc(dateString).tz(timezone);
    
    return {
      date: dateInTz.format('MMMM D, YYYY'),
      time: dateInTz.format('h:mm A'),
      timezoneAbbr: dateInTz.format('z'), // Native dayjs abbreviation
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    return { date: 'Invalid date', time: '', timezoneAbbr: '' };
  }
}

