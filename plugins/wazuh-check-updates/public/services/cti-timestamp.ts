import moment from 'moment';
import { getWazuhCore } from '../plugin-services';

/** Shown in place of a value the indexer does not report. */
export const MISSING_CTI_VALUE = '-';

/**
 * A CTI timestamp (`updated_at`, `last_checked_at`) as a moment, or `null` when
 * the indexer did not report it or reported something that is not ISO 8601.
 */
export function parseCtiTimestamp(
  timestamp: string | undefined,
): moment.Moment | null {
  if (!timestamp) {
    return null;
  }
  const parsed = moment(timestamp, moment.ISO_8601, true);
  return parsed.isValid() ? parsed : null;
}

/**
 * The exact time with the `dateFormat` and `dateFormat:tz` advanced settings,
 * or `-` when there is no valid time to show.
 */
export function formatCtiTimestamp(timestamp: string | undefined): string {
  if (!timestamp || !parseCtiTimestamp(timestamp)) {
    return MISSING_CTI_VALUE;
  }
  // `formatUIDate` is typed as taking a Date but only formats date strings.
  return getWazuhCore().utils.formatUIDate(timestamp as unknown as Date);
}

/**
 * How long ago the time was ("5 minutes ago"). A time slightly ahead of the
 * browser clock reads as now, not as "in a few seconds".
 */
export function getCtiTimestampFromNow(
  timestamp: moment.Moment,
  now: moment.Moment = moment(),
): string {
  return moment.min(timestamp, now).from(now);
}

/**
 * The calendar date only ("Nov 11, 2026"), for dates where the time adds nothing
 * (registration, renewal). `null` when there is no valid date to show.
 */
export function formatCtiDate(timestamp: string | undefined): string | null {
  const parsed = parseCtiTimestamp(timestamp);
  return parsed ? parsed.format('ll') : null;
}
