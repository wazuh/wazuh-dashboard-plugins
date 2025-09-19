import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
// Import of module under test will be done after mocks

// Mocks
jest.mock('../../common/hocs', () => ({
  // Identity HOC so we render the wrapped component without referencing React
  withGlobalBreadcrumb:
    () =>
    (Component: any): React.FC<any> =>
    props =>
      Component(props),
  __esModule: true,
}));

jest.mock('../../../kibana-services', () => ({
  getUiSettings: jest.fn(() => ({
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'home:useNewHomePage') return false;
      return false;
    }),
  })),
  __esModule: true,
}));

jest.mock('../../../utils/applications', () => ({
  devTools: {
    id: 'dev-tools',
    breadcrumbLabel: 'Dev Tools',
  },
  __esModule: true,
}));

jest.mock('./application/hooks/use-setup', () => ({
  __esModule: true,
  default: () => ({
    editorInputRef: {
      current: {
        /* minimal stub */
      },
    },
    editorOutputRef: { current: { getValue: jest.fn(() => '{}') } },
  }),
}));

jest.mock('./lib', () => ({
  __esModule: true,
  send: jest.fn(),
  saveEditorContentAsJson: jest.fn(),
}));

// jQuery ($) stub for the hotkey hook used by the component
const handlers: Record<string, any> = {};
const on = jest.fn((evt: string, cb: Function) => {
  handlers[evt] = cb;
});
const off = jest.fn((evt: string) => {
  delete handlers[evt];
});
(global as any).$ = () => ({ on, off });

// Require after mocks and globals are in place
const lib = require('./lib');
const { ToolDevTools } = require('./devtools-old');
const { DEV_TOOLS_BUTTONS } = require('./constants');

// Integration tests for the DevTools console container
describe('ToolDevTools (integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clicking Play sends the request and updates status meta (happy path)', async () => {
    // Arrange mocked send to invoke hooks
    lib.send.mockImplementation(
      (
        _in: any,
        _out: any,
        _first: boolean,
        hooks?: { onStart?: Function; onEnd?: Function },
      ) => {
        hooks?.onStart?.();
        hooks?.onEnd?.({
          ok: true,
          status: 200,
          statusText: 'OK',
          durationMs: 123.4,
        });
      },
    );

    const { container } = render(<ToolDevTools />);

    // Act: click Play
    const play = container.querySelector(
      `#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`,
    );
    expect(play).toBeTruthy();
    await act(async () => {
      fireEvent.click(play!);
    });

    // Assert send called and UI reflects status
    expect(lib.send).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/200\s-\sOK/i)).toBeInTheDocument();
    expect(screen.getByText(/123\s?ms/i)).toBeInTheDocument();
  });

  it('clicking Export triggers saveEditorContentAsJson (edge case: no meta yet)', () => {
    const { container } = render(<ToolDevTools />);

    // Export button provided by top nav config
    const exportBtn = container.querySelector(
      '[data-test-subj="consoleExportButton"]',
    );
    expect(exportBtn).toBeTruthy();
    fireEvent.click(exportBtn!);

    expect(lib.saveEditorContentAsJson).toHaveBeenCalledTimes(1);
  });

  it('handles error meta from send (status not ok)', async () => {
    lib.send.mockImplementation(
      (
        _in: any,
        _out: any,
        _first: boolean,
        hooks?: { onStart?: Function; onEnd?: Function },
      ) => {
        hooks?.onStart?.();
        hooks?.onEnd?.({
          ok: false,
          status: 500,
          statusText: 'Internal Error',
          durationMs: 45.2,
        });
      },
    );

    render(<ToolDevTools />);

    // Click Play
    const play = document.querySelector(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`);
    await act(async () => {
      fireEvent.click(play!);
    });

    // Error badge shown
    expect(screen.getByText(/500\s-\sInternal Error/i)).toBeInTheDocument();
  });
});
