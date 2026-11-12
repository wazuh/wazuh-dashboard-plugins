jest.mock('./lib/codemirror', () => ({
  on: (el: HTMLElement, type: string, fn: EventListener) =>
    el.addEventListener(type, fn),
  signal: jest.fn(),
}));

const CodeMirror = require('./lib/codemirror');
require('./show-hint');

const createEditor = () => {
  const handlers: Record<string, Function> = {};
  return {
    state: {} as any,
    somethingSelected: () => false,
    getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => '',
    getScrollInfo: () => ({ top: 0, left: 0 }),
    getWrapperElement: () => document.createElement('div'),
    cursorCoords: () => ({ left: 0, top: 0, bottom: 0 }),
    addKeyMap: jest.fn(),
    removeKeyMap: jest.fn(),
    replaceRange: jest.fn(),
    focus: jest.fn(),
    on: (name: string, fn: Function) => {
      handlers[name] = fn;
    },
    off: jest.fn(),
  };
};

const renderNested = (el: HTMLElement, _data: unknown, cur: any) => {
  el.innerHTML = `<div class="wz-hint"><span class="wz-hint__text">${cur.text}</span><span class="wz-hint__label">label</span></div>`;
};

describe('showHint click selection', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const open = () => {
    const cm = createEditor();
    const from = { line: 0, ch: 0 };
    const to = { line: 0, ch: 4 };
    CodeMirror.showHint(
      cm,
      () => ({
        list: [
          { text: 'GET', render: renderNested },
          { text: 'POST', render: renderNested },
        ],
        from,
        to,
      }),
      { completeSingle: false },
    );
    return { cm, from, to };
  };

  it('inserts the entry when clicking a nested child', () => {
    const { cm, from, to } = open();
    const child = document.querySelectorAll('.wz-hint__text')[1];
    child.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(cm.replaceRange).toHaveBeenCalledWith('POST', from, to);
    expect(document.querySelector('.CodeMirror-hints')).toBeNull();
  });

  it('inserts the entry when clicking the list item itself', () => {
    const { cm, from, to } = open();
    const li = document.querySelectorAll('.CodeMirror-hint')[0];
    li.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(cm.replaceRange).toHaveBeenCalledWith('GET', from, to);
  });

  it('ignores clicks outside the entries', () => {
    const { cm } = open();
    document
      .querySelector('.CodeMirror-hints')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(cm.replaceRange).not.toHaveBeenCalled();
  });
});
