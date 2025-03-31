export const KeyState = {
  COLUMN: 'column',
  PAGE_SIZE: 'page-size',
} as const;

export type KeyState = (typeof KeyState)[keyof typeof KeyState];
