import { differenceInSeconds, formatDistanceToNow } from 'date-fns';

/**
 * Converts a MongoDB createdAt date to a short relative time string using date-fns.
 * This provides the most accurate and readable result.
 * @param {Date | string} createdAt - The date object or ISO string from the MongoDB document.
 * @returns {string} The relative time string (e.g., '1m ago', 'about 2 hours ago').
 */
export function formatRelativeTimeLibrary(createdAt: Date | string): string {
  const date = new Date(createdAt);
  
  if (differenceInSeconds(new Date(), date) < 60) {
    // Handle less than a minute by showing the minimum '1m ago' 
    // or 'Just now' as required by your UI logic.
    return '1m ago'; 
  }

  // formatDistanceToNow returns strings like "about 5 minutes"
  const formatted = formatDistanceToNow(date, { addSuffix: true });

  // Custom logic to shorten "about 5 minutes ago" to "5m ago"
  // This step makes it match the image's compact style.
  const shortFormat = formatted
    .replace('about ', '')
    .replace('less than a minute', '1m')
    // .replace('minute', 'm')
    // .replace('hour', 'h')
    // .replace('day', 'd')
    // .replace('week', 'w')
    // .replace(/s\b/g, ''); // Remove plurals like 'minutes' -> 'm'

  return shortFormat;
}