import { timeZonesNames, getTimeZones } from '@vvo/tzdb';

/**
 * Get all available timezones from @vvo/tzdb
 * Returns a sorted list of timezone options for dropdowns
 * Uses timeZonesNames for exact IANA timezone names
 */
export function getTimezoneOptions() {
  return timeZonesNames
    .map((tzName) => {
      return {
        value: tzName, // e.g., "America/Chicago" - exact IANA timezone name
        label: tzName, // e.g., "America/Chicago" - same as value for display
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Guess/detect the user's current timezone
 * Returns the IANA timezone name (e.g., "America/New_York")
 * Returns null if timezone detection is not available
 */
export function guessUserTimezone(): string | null {
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // 1. Check for exact match in the canonical list
      if (timeZonesNames.includes(browserTimeZone)) {
        return browserTimeZone;
      }

      // 2. If no exact match, check if it's a known alias (e.g. Asia/Calcutta -> Asia/Kolkata)
      // getTimeZones() returns objects with a 'group' array containing aliases
      const allZones = getTimeZones();
      const foundZone = allZones.find((zone) => 
        zone.group.includes(browserTimeZone)
      );

      if (foundZone) {
        return foundZone.name;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}