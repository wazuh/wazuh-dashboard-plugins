export enum FILTER_OPERATOR {
  IS = 'is',
  IS_NOT = 'is not',
  EXISTS = 'exists',
  DOES_NOT_EXISTS = 'does not exists',
  IS_ONE_OF = 'is one of',
  IS_NOT_ONE_OF = 'is not one of',
  IS_BETWEEN = 'is between',
  IS_NOT_BETWEEN = 'is not between',
}

export enum FilterStateStore {
  APP_STATE = 'appState',
  GLOBAL_STATE = 'globalState',
}

export const isNullish = <T>(
  value: T | null | undefined,
): value is null | undefined => value === null || value === undefined;
