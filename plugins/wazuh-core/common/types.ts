export enum API_UPDATES_STATUS {
  UP_TO_DATE = 'upToDate',
  AVAILABLE_UPDATES = 'availableUpdates',
  DISABLED = 'disabled',
  ERROR = 'error',
}
export interface Update {
  description: string;
  published_date: string;
  semver: {
    major: number;
    minor: number;
    patch: number;
  };
  tag: string;
  title: string;
}

export interface ResponseCTIAvailableUpdates {
  current_version?: string;
  update_check?: boolean;
  last_available_major?: Update;
  last_available_minor?: Update;
  last_available_patch?: Update;
  last_check_date?: string;
}

export interface CTIAvailableUpdates extends ResponseCTIAvailableUpdates {
  api_id: string;
  status: API_UPDATES_STATUS;
  error?: {
    title?: string;
    detail?: string;
  };
}

export interface AvailableUpdates {
  apis_available_updates: CTIAvailableUpdates[];
  last_check_date: string;
}

export type OmitStrict<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface IndexedDocument<T> {
  _index: string;
  _id: string;
  _score: number | null;
  _source: T;
}

export type Direction = 'asc' | 'desc';
