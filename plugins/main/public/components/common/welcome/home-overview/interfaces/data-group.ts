/**
 * Status of a single data group: distinguishes "dependency absent" (hide)
 * from "query failed" (error box).
 */
export type DataGroupStatus = 'loading' | 'available' | 'unavailable' | 'error';

/**
 * Thrown to mark a group unavailable (not error): the shape a missing index
 * pattern throws, reused for a missing Security Analytics plugin.
 */
export const DATA_SOURCE_NOT_FOUND = 'data_source_not_found';

export interface DataGroupResult<T> {
  status: DataGroupStatus;
  data?: T;
}
