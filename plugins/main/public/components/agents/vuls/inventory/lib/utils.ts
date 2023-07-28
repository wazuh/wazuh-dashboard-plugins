import { formatUIDate } from '../../../../../react-services/time-service';

// This method was created because Wazuh API returns 1970-01-01T00:00:00Z dates or undefined ones
// when vulnerability module is not configured
// its meant to render nothing when such date is received
export function beautifyDate(date?: string) {
  return date &&
    (!['-'].includes(date) && !date.startsWith('1970')) ?
    formatUIDate(date) : '-';
}
