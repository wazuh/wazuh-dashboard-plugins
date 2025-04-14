export enum API_UPDATES_STATUS {
  UP_TO_DATE = 'upToDate',
  AVAILABLE_UPDATES = 'availableUpdates',
  DISABLED = 'disabled',
  ERROR = 'error',
}

export interface ResponseApiAvailableUpdates {
  uuid?: string;
  current_version?: string;
  update_check?: boolean;
  last_available_major?: Update;
  last_available_minor?: Update;
  last_available_patch?: Update;
  last_check_date?: string;
}

export interface ApiAvailableUpdates extends ResponseApiAvailableUpdates {
  api_id: string;
  status: API_UPDATES_STATUS;
  error?: {
    title?: string;
    detail?: string;
  };
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
  api_id: string;
  last_major?: string;
  last_minor?: string;
  last_patch?: string;
}

export interface UserPreferences {
  last_dismissed_updates?: UserPreferencesDimissedUpdate[];
  hide_update_notifications?: boolean;
}

export interface AvailableUpdates {
  apis_available_updates: ApiAvailableUpdates[];
  last_check_date: Date;
}

export type savedObjectType = AvailableUpdates | UserPreferences;
