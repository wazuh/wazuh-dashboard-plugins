import { formatUIDate } from '../react-services/time-service';

// This method was created because Wazuh API returns 1970-01-01T00:00:00Z dates or undefined ones
// when vulnerability module is not configured
// its meant to render nothing when such date is received
export function beautifyDate(date?: string | number | any) {
  // Validate that date is a string and not empty
  if (!date || typeof date !== 'string' || date === '') {
    return '-';
  }

  // Check for special cases: '-' or dates starting with '1970' (epoch)
  if (date === '-' || date.startsWith('1970')) {
    return '-';
  }

  return formatUIDate(date);
}
