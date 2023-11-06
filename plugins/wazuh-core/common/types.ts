export interface AvailableUpdates {
  apiId: string;
  last_check?: Date | string | undefined;
  mayor: Update[];
  minor: Update[];
  patch: Update[];
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
