export enum API_UPDATES_STATUS {
  UP_TO_DATE = 'upToDate',
  AVAILABLE_UPDATES = 'availableUpdates',
  ERROR = 'error',
}

export interface ResponseIndexerAvailableUpdates {
  uuid?: string;
  current_version?: string;
  last_available_major?: Update;
  last_available_minor?: Update;
  last_available_patch?: Update;
  last_check_date?: string;
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

export interface UserPreferencesDimissedUpdate {
  last_major?: string;
  last_minor?: string;
  last_patch?: string;
}

export interface UserPreferences {
  last_dismissed_updates?: UserPreferencesDimissedUpdate;
  hide_update_notifications?: boolean;
  hide_cti_upsell?: boolean;
  /** `detected_at` of the CTI registration loss this user dismissed. */
  dismissed_cti_registration_lost_at?: string;
}

export interface AvailableUpdates extends ResponseIndexerAvailableUpdates {
  last_check_date_dashboard: Date;
  status: API_UPDATES_STATUS;
  error?: {
    title?: string;
    detail?: string;
  };
}

/** Last CTI registration this dashboard saw, per environment. */
export interface CtiRegistrationHistory {
  last_plan?: string;
  last_registered_at?: string;
  lost_at?: string | null;
  lost_plan?: string | null;
}

export type savedObjectType =
  | AvailableUpdates
  | UserPreferences
  | CtiRegistrationHistory;
