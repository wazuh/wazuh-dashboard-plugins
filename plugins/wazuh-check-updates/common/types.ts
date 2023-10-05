export enum API_UPDATES_STATUS {
  UP_TO_DATE = 'upToDate',
  AVAILABLE_UPDATES = 'availableUpdates',
  ERROR = 'error',
}

export interface ResponseApiAvailableUpdates {
  apiId: string;
  version: string;
  lastMayor?: Update;
  lastMinor?: Update;
  lastPatch?: Update;
  last_check?: Date | string | undefined;
}

export interface ApiAvailableUpdates extends ResponseApiAvailableUpdates {
  status: API_UPDATES_STATUS;
}

export interface Update {
  description: string;
  published_date: string;
  semver: {
    mayor: number;
    minor: number;
    patch: number;
  };
  tag: string;
  title: string;
}

export interface UserPreferencesDimissedUpdate {
  apiId: string;
  mayor?: string;
  minor?: string;
  patch?: string;
}

export interface UserPreferences {
  last_dismissed_updates?: UserPreferencesDimissedUpdate[];
  hide_update_notifications?: boolean;
}

export interface CheckUpdatesSettings {
  schedule?: string;
}

export interface AvailableUpdates {
  apiAvailableUpdates: ApiAvailableUpdates[];
  last_check: Date;
}

export type savedObjectType = AvailableUpdates | UserPreferences | CheckUpdatesSettings;
