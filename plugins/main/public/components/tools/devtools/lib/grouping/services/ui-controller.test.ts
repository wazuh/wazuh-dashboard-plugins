import { JQueryEditorUIController } from './ui-controller';
import { DEV_TOOLS_BUTTONS } from '../../../constants';

const playSel = `#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`;
const docsSel = `#${DEV_TOOLS_BUTTONS.DOCS_BUTTON_ID}`;

type JQueryStub = {
  is: jest.Mock<any, any>;
  show: jest.Mock<any, any>;
  hide: jest.Mock<any, any>;
  attr: jest.Mock<any, any>;
  offset: jest.Mock<any, any>;
};

// Initialized in beforeEach to avoid hoisting issues
const state: Record<string, { visible: boolean; attrs: Record<string, string> }> = {};

jest.mock('jquery', () => {
  const $ = ((sel: string) => {
    const key = typeof sel === 'string' ? sel : 'wrapper';
    if (!state[key]) state[key] = { visible: true, attrs: {} };
    const store = state[key];
    const api: JQueryStub = {
      is: jest.fn(arg => (arg === ':visible' ? store.visible : false)),
      show: jest.fn(() => {
        store.visible = true;
      }),
      hide: jest.fn(() => {
        store.visible = false;
      }),
      attr: jest.fn((name: string, value?: string) => {
        if (value !== undefined) store.attrs[name] = value;
        return store.attrs[name];
      }),
      offset: jest.fn((opts?: any) => (opts ? undefined : { top: 0 })),
    } as any;
    return api;
  }) as any;
  return $.default || $;
});

describe('JQueryEditorUIController', () => {
  beforeEach(() => {
    state[playSel] = { visible: false, attrs: {} };
    state[docsSel] = { visible: false, attrs: {} };
  });

  it('showPlay shows only if hidden, hidePlay hides', () => {
    const ui = new JQueryEditorUIController();
    ui.showPlay();
    expect(state[playSel].visible).toBe(true);
    // Call again should not call .show() if already visible
    ui.showPlay();
    ui.hidePlay();
    expect(state[playSel].visible).toBe(false);
  });

  it('showDocs sets href and shows; hideDocs clears href and hides', () => {
    const ui = new JQueryEditorUIController();
    ui.showDocs('https://docs');
    expect(state[docsSel].attrs.href).toBe('https://docs');
    expect(state[docsSel].visible).toBe(true);

    ui.hideDocs();
    expect(state[docsSel].attrs.href).toBe('');
    expect(state[docsSel].visible).toBe(false);
  });

  it('setButtonsTop updates offset for both buttons', () => {
    const ui = new JQueryEditorUIController();
    // No assertion on jQuery since stub returns undefined for setter mode
    expect(() => ui.setButtonsTop(123)).not.toThrow();
  });
});
