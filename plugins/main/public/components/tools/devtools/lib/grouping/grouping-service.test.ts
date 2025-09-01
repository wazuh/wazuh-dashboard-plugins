/**
 * Tests for GroupingService covering parsing, selection, highlighting, and JSON validation.
 */
import type { EditorGroup, EditorLike } from '../types/editor';
import { GroupingService } from './grouping-service';

// Mock docs resolver so we control URL behavior
jest.mock('./services/docs-link-resolver', () => ({
  resolveDocsUrl: jest.fn((_: any, requestText: string) =>
    requestText?.includes('/docs') ? 'https://docs.example/api' : null,
  ),
}));

// Minimal jQuery mock for wrapper metrics used by selectActiveGroup
jest.mock('jquery', () => {
  const $ = jest.fn((el: any) => ({
    offset: () => ({ top: 0 }),
    outerHeight: () => 1000,
    is: () => true,
    show: jest.fn(),
    hide: jest.fn(),
    attr: jest.fn(),
  }));
  return $.default || $;
});

function buildEditor(content: string): EditorLike & { __lines: string[] } {
  const lines = content.split('\n');
  const selection = { line: 0, ch: 0 };

  const editor: any = {
    __lines: lines,
    getValue: () => content,
    getCursor: () => ({ ...selection }),
    setCursor: (pos: any) => {
      selection.line = pos.line;
      selection.ch = pos.ch || 0;
    },
    getLine: (n: number) => lines[n] ?? '',
    cursorCoords: ({ line }: any) => ({ top: line * 20 }),
    getWrapperElement: () => document.createElement('div'),
    getSearchCursor: (query: string) => {
      // Find by matching the first line of the query
      const first = (query || '').split('\n')[0];
      const idx = lines.findIndex(l => l === first);
      let used = false;
      return {
        findNext: () => {
          if (used) return false;
          used = true;
          return idx >= 0;
        },
        from: () => ({ line: idx >= 0 ? idx : 0, ch: 0 }),
      };
    },
    addLineClass: jest.fn(),
    removeLineClass: jest.fn(),
    addLineWidget: jest.fn((_line: number, node: any) => ({ node })),
    removeLineWidget: jest.fn(),
  };
  return editor as any;
}

describe('GroupingService.parseGroups', () => {
  it('splits text into groups with correct ranges and JSON bodies', () => {
    const content = [
      'GET /agents',
      '',
      'POST /agents',
      '{',
      '  "foo": "bar"',
      '}',
      '# ignore this comment',
      'DELETE /agents/123?pretty=true',
      '',
      'PUT /agents/001/docs',
    ].join('\n');

    const editor = buildEditor(content);

    const mockState = { setCurrentDevTools: jest.fn() };
    const mockJson = { parse: jest.fn() };
    const svc = new GroupingService(
      // ui
      {
        showPlay: jest.fn(),
        hidePlay: jest.fn(),
        showDocs: jest.fn(),
        hideDocs: jest.fn(),
        setButtonsTop: jest.fn(),
      } as any,
      // errors
      { log: jest.fn() } as any,
      // state
      mockState as any,
      // json linter
      mockJson as any,
    );

    const groups = svc.parseGroups(editor);

    // State persistence invoked
    expect(mockState.setCurrentDevTools).toHaveBeenCalledWith(content);

    expect(groups).toHaveLength(4);

    const [g0, g1, g2, g3] = groups;

    expect(g0).toMatchObject<Partial<EditorGroup>>({
      requestText: 'GET /agents',
      requestTextJson: '',
      start: 0,
      end: 0,
    });

    expect(g1).toMatchObject<Partial<EditorGroup>>({
      requestText: 'POST /agents',
      requestTextJson: '{  "foo": "bar"}',
      start: 2,
      end: 5,
    });

    expect(g2).toMatchObject<Partial<EditorGroup>>({
      requestText: 'DELETE /agents/123?pretty=true',
      requestTextJson: '',
      start: 7,
      end: 7,
    });

    expect(g3).toMatchObject<Partial<EditorGroup>>({
      requestText: 'PUT /agents/001/docs',
      requestTextJson: '',
      start: 9,
      end: 9,
    });

    // Snapshot full structure
    expect(groups).toMatchSnapshot();
  });

  it('returns empty array if search cursor cannot find a block', () => {
    const editor = buildEditor('GET /agents');
    editor.getSearchCursor = () => ({
      findNext: () => false,
      from: () => ({ line: 0, ch: 0 }),
    });

    const svc = new GroupingService();
    const groups = svc.parseGroups(editor);
    expect(groups).toEqual([]);
  });
});

describe('GroupingService.highlightGroup', () => {
  it('clears previous highlights and highlights a single-line group', () => {
    const editor = buildEditor('GET /agents');
    (editor as any).__highlightedLines = [10, 11];

    const svc = new GroupingService();
    svc.highlightGroup(editor, {
      requestText: 'GET /agents',
      requestTextJson: '',
      start: 0,
      end: 0,
    });

    // Previous highlights removed
    expect(editor.removeLineClass).toHaveBeenCalledWith(
      10,
      'background',
      expect.any(String),
    );
    expect(editor.removeLineClass).toHaveBeenCalledWith(
      11,
      'background',
      expect.any(String),
    );

    // New highlight applied only to start line
    expect(editor.addLineClass).toHaveBeenCalledWith(
      0,
      'background',
      expect.any(String),
    );
  });

  it('highlights all lines in a multi-line JSON group', () => {
    const editor = buildEditor('POST /agents\n{\n  "a": 1\n}');
    const svc = new GroupingService();
    svc.highlightGroup(editor, {
      requestText: 'POST /agents',
      requestTextJson: '{"a":1}',
      start: 5,
      end: 8,
    });

    expect(editor.addLineClass).toHaveBeenCalledTimes(4); // 5,6,7,8
    expect(editor.addLineClass).toHaveBeenCalledWith(
      5,
      'background',
      expect.any(String),
    );
    expect(editor.addLineClass).toHaveBeenCalledWith(
      8,
      'background',
      expect.any(String),
    );
  });
});

describe('GroupingService.selectActiveGroup', () => {
  function makeUI() {
    return {
      showPlay: jest.fn(),
      hidePlay: jest.fn(),
      showDocs: jest.fn(),
      hideDocs: jest.fn(),
      setButtonsTop: jest.fn(),
    };
  }

  it('selects group by cursor position and shows buttons when visible', () => {
    const content = ['GET /agents', '', 'GET /agents/docs'].join('\n');

    const editor = buildEditor(content);
    const ui = makeUI();
    const svc = new GroupingService(ui as any, { log: jest.fn() } as any);

    const groups: EditorGroup[] = [
      { requestText: 'GET /agents', requestTextJson: '', start: 0, end: 0 },
      {
        requestText: 'GET /agents/docs',
        requestTextJson: '',
        start: 2,
        end: 2,
      },
    ];

    // Put cursor on line 2 (docs request), and ensure visible
    (editor as any).setCursor({ line: 2, ch: 0 });

    const selected = svc.selectActiveGroup(editor, false, groups);
    expect(selected).toEqual(groups[1]);

    // Docs URL resolver mocked only returns for paths including '/docs'
    expect(ui.showDocs).toHaveBeenCalledWith('https://docs.example/api');
    expect(ui.showPlay).toHaveBeenCalled();
    expect(ui.setButtonsTop).toHaveBeenCalledWith(2 * 20 + 1);
  });

  it('falls back to first visible group when cursor not inside any range', () => {
    const content = ['GET /a/docs', 'GET /b'].join('\n');
    const editor = buildEditor(content);
    const ui = makeUI();
    const svc = new GroupingService(ui as any, { log: jest.fn() } as any);

    const groups: EditorGroup[] = [
      { requestText: 'GET /a/docs', requestTextJson: '', start: 0, end: 0 },
      { requestText: 'GET /b', requestTextJson: '', start: 1, end: 1 },
    ];

    // Cursor below all ranges
    (editor as any).setCursor({ line: 5, ch: 0 });

    const selected = svc.selectActiveGroup(editor, false, groups);
    expect(selected).toEqual(groups[0]);
    expect(ui.showDocs).toHaveBeenCalledWith('https://docs.example/api');
    expect(ui.showPlay).toHaveBeenCalled();
  });

  it('hides buttons if no docs URL is available', () => {
    const content = ['GET /a', 'GET /b'].join('\n');
    const editor = buildEditor(content);
    const ui = makeUI();
    const svc = new GroupingService(ui as any, { log: jest.fn() } as any);

    const groups: EditorGroup[] = [
      { requestText: 'GET /a', requestTextJson: '', start: 0, end: 0 },
      { requestText: 'GET /b', requestTextJson: '', start: 1, end: 1 },
    ];

    (editor as any).setCursor({ line: 1, ch: 0 });
    const selected = svc.selectActiveGroup(editor, false, groups);
    expect(selected).toEqual(groups[1]);
    // No docs URL triggers hide
    expect(ui.hideDocs).toHaveBeenCalled();
    expect(ui.hidePlay).toHaveBeenCalled();
  });

  it('calls highlight on firstTime=true', () => {
    const content = 'GET /a/docs';
    const editor = buildEditor(content);
    const ui = makeUI();
    const svc = new GroupingService(ui as any, { log: jest.fn() } as any);
    const spy = jest.spyOn(svc, 'highlightGroup').mockImplementation(() => {});

    const groups: EditorGroup[] = [
      { requestText: 'GET /a/docs', requestTextJson: '', start: 0, end: 0 },
    ];
    (editor as any).setCursor({ line: 0, ch: 0 });
    svc.selectActiveGroup(editor, true, groups);
    expect(spy).toHaveBeenCalledWith(editor, groups[0]);
  });

  it('handles exceptions by hiding buttons and returning null', () => {
    const editor = buildEditor('GET /a');
    // Force error
    (editor as any).getCursor = () => {
      throw new Error('boom');
    };
    const ui = makeUI();
    const errors = { log: jest.fn() };
    const svc = new GroupingService(ui as any, errors as any);

    const res = svc.selectActiveGroup(editor, false, [
      { requestText: 'GET /a', requestTextJson: '', start: 0, end: 0 },
    ]);
    expect(res).toBeNull();
    expect(ui.hidePlay).toHaveBeenCalled();
    expect(ui.hideDocs).toHaveBeenCalled();
    expect(errors.log).toHaveBeenCalled();
  });
});

describe('GroupingService.validateJson', () => {
  it('lints JSON, adds error widgets and returns affected requestTexts', () => {
    const editor = buildEditor('POST /a');
    // Pre-existing widgets should be removed
    (editor as any).__widgets = [{ start: 1, widget: { id: 'old' } }];

    const json = {
      parse: jest.fn((raw: string) => {
        if (raw.includes('bad')) throw new Error('Unexpected token');
      }),
    };

    const svc = new GroupingService(
      {
        showPlay: jest.fn(),
        hidePlay: jest.fn(),
        showDocs: jest.fn(),
        hideDocs: jest.fn(),
        setButtonsTop: jest.fn(),
      } as any,
      { log: jest.fn() } as any,
      { setCurrentDevTools: jest.fn() } as any,
      json as any,
    );

    const groups: EditorGroup[] = [
      {
        requestText: 'POST /ok',
        requestTextJson: '{"good": true}',
        start: 0,
        end: 3,
      },
      {
        requestText: 'POST /fail',
        requestTextJson: '{bad json}',
        start: 4,
        end: 8,
      },
      { requestText: 'GET /noop', requestTextJson: '', start: 9, end: 9 },
    ];

    const failed = svc.validateJson(editor, groups);
    expect(failed).toEqual(['POST /fail']);
    expect(editor.removeLineWidget).toHaveBeenCalledWith({ id: 'old' });
    expect(Array.isArray((editor as any).__widgets)).toBe(true);
    expect((editor as any).__widgets[0].start).toBe(4);
    expect(editor.addLineWidget).toHaveBeenCalled();
  });
});
