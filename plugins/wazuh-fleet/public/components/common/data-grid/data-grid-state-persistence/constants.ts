export const KEY_STATE = {
  COLUMN: 'column',
  PAGE_SIZE: 'page-size',
} as const;

export type KeyState = (typeof KEY_STATE)[keyof typeof KEY_STATE];
