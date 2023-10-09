export interface AvailableUpdates {
  api_id: string
  last_available_major: Update;
  last_available_minor: Update[];
  last_available_patch: Update[];
  last_check_date?: Date | string | undefined;
  current_version?: string | undefined;
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

export interface UserPreferences {
  last_dismissed_update?: string;
  hide_update_notifications?: boolean;
}

export interface CheckUpdatesSettings {
  schedule?: string;
}

export type savedObjectType = AvailableUpdates | UserPreferences | CheckUpdatesSettings;
