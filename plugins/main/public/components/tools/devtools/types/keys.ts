export const Keys = {
  TAB: 9,
  ENTER: 13,
  SHIFT: 16,
  CTRL: 17,
  ALT: 18,
  PAUSE: 19,
  CAPSLOCK: 20,
  ESCAPE: 27,
  PAGEUP: 33,
  PAGEDOWN: 34,
  END: 35,
  HOME: 36,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  INSERT: 45,
  LEFT_WINDOW_KEY: 91,
  RIGHT_WINDOW_KEY: 92,
  SELECT: 93,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  NUMLOCK: 144,
  SCROLLLOCK: 145,
} as const;

export type Keys = (typeof Keys)[keyof typeof Keys];

export const isEnter = (
  keyDownEvent: JQuery.KeyDownEvent<Document, undefined, Document, Document>,
) => {
  return (
    keyDownEvent.key === 'Enter' ||
    keyDownEvent.keyCode === Keys.ENTER ||
    keyDownEvent.which === Keys.ENTER
  );
};

export const hasCtrlOrCmd = (
  keyDownEvent: JQuery.KeyDownEvent<Document, undefined, Document, Document>,
) => !!(keyDownEvent.ctrlKey || keyDownEvent.metaKey);
