export const ModelStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ERROR: 'error',
} as const;

export type ModelStatus = (typeof ModelStatus)[keyof typeof ModelStatus];
