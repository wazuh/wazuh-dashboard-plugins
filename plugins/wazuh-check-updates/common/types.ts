export interface AvailableUpdates {
  mayor: Update[];
  minor: Update[];
  patch: Update[];
  last_check?: Date | string | undefined;
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

export interface UserPreferences {
  last_dismissed_update?: string;
  hide_update_notifications?: boolean;
}

export interface CheckUpdatesSettings {
  schedule?: string;
}

export type savedObjectType = AvailableUpdates | UserPreferences | CheckUpdatesSettings;
