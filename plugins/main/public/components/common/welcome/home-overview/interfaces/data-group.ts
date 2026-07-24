import { ErrorDataSourceNotFound } from '../../../../../utils/errors';
import { ClassifiedQueryError } from '../lib/classify-query-error';

/**
 * Status of a single data group
 */
export type DataGroupStatus = 'loading' | 'available' | 'unavailable' | 'error';

/**
 * A fetch throwing an error of this `type` marks its group unavailable rather
 * than errored. Sourced from the app's `ErrorDataSourceNotFound` so the check
 * matches what the data-source layer already throws for a missing index pattern.
 */
export const DATA_SOURCE_NOT_FOUND = ErrorDataSourceNotFound.type;

export interface DataGroupResult<T> {
  status: DataGroupStatus;
  data?: T;
  /** Present on `unavailable` / `error`; the classified, render-ready failure. */
  error?: ClassifiedQueryError;
}
