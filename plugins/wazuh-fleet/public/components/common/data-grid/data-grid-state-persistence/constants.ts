export const KEY_STATE = {
  COLUMN: 'column',
  COLUMN_WIDTH: 'column-width',
  PAGE_SIZE: 'page-size',
} as const;

export type KeyState = (typeof KEY_STATE)[keyof typeof KEY_STATE];
