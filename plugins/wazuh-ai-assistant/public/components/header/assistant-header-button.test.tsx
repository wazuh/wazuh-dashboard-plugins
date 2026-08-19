import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { CoreStart } from '../../../../../src/core/public';
import {
  AssistantHeaderButton,
  registerAssistantHeaderButton,
} from './assistant-header-button';

const mockReact = React;

jest.mock('./assistant-chat-panel', () => ({
  AssistantChatPanel: (props: {
    onClose: () => void;
    runGuarded: (action: () => void) => void;
    isGeneratingRef: { current: boolean };
  }) =>
    mockReact.createElement(
      'div',
      { 'data-test-subj': 'panel-stub' },
      mockReact.createElement(
        'button',
        { type: 'button', onClick: () => props.runGuarded(props.onClose) },
        'close panel',
      ),
      mockReact.createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            props.isGeneratingRef.current = true;
          },
        },
        'start generating',
      ),
    ),
}));

const mockOpenConfirm = jest.fn();

/** In-memory stand-in for core.overlays.sidecar: open() runs the mount into a detached
 * element (so the panel actually renders), and emitConfig() replays a drag-resize. */
function sidecarMock() {
  const configListeners: Array<(config?: { paddingSize?: number }) => void> =
    [];
  const open = jest.fn(
    (mount: (element: HTMLElement) => () => void, _options: unknown) => {
      const element = document.createElement('div');
      document.body.append(element);
      const unmount = mount(element);
      let resolveClose: () => void = () => undefined;
      const onClose = new Promise<void>(resolve => {
        resolveClose = resolve;
      });
      return {
        onClose,
        close: jest.fn(() => {
          unmount();
          element.remove();
          resolveClose();
          return onClose;
        }),
      };
    },
  );
  return {
    open,
    getSidecarConfig$: () => ({
      subscribe: (listener: (config?: { paddingSize?: number }) => void) => {
        configListeners.push(listener);
        return { unsubscribe: jest.fn() };
      },
    }),
    emitConfig: (config?: { paddingSize?: number }) =>
      configListeners.forEach(listener => listener(config)),
  };
}

function coreMock({ newHomePage = false } = {}) {
  const sidecar = sidecarMock();
  const core = {
    http: {},
    uiSettings: { get: () => newHomePage },
    chrome: {
      navControls: {
        registerRight: jest.fn(),
        registerLeftBottom: jest.fn(),
      },
    },
    overlays: { openConfirm: mockOpenConfirm, sidecar },
  } as unknown as CoreStart;
  return { core, sidecar };
}

const panelStub = () => document.querySelector('[data-test-subj="panel-stub"]');

function headerButton(): HTMLElement {
  const element = document.querySelector(
    '[data-test-subj="wzAiAssistantHeaderButton"]',
  );
  if (!(element instanceof HTMLElement)) {
    throw new Error('header button not rendered');
  }
  return element;
}

/** The sidecar ref returned by the most recent open() call. */
function lastSidecarRef(sidecar: ReturnType<typeof sidecarMock>) {
  const { results } = sidecar.open.mock;
  return results[results.length - 1].value as { close: jest.Mock };
}

describe('AssistantHeaderButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('opens the chat panel in the sidecar on click and closes it from the panel', async () => {
    const { core, sidecar } = coreMock();
    render(<AssistantHeaderButton core={core} />);
    expect(panelStub()).not.toBeInTheDocument();
    expect(headerButton()).toHaveAttribute('aria-expanded', 'false');
    expect(headerButton()).toHaveAttribute(
      'aria-label',
      'Open the AI Assistant',
    );

    fireEvent.click(headerButton());
    expect(sidecar.open).toHaveBeenCalledTimes(1);
    expect(sidecar.open.mock.calls[0][1]).toMatchObject({
      classNameButton: 'osd-resetFocusState',
    });
    // findBy: the panel module is React.lazy-loaded, so it appears asynchronously.
    await screen.findByText('close panel');
    expect(headerButton()).toHaveAttribute('aria-expanded', 'true');
    expect(headerButton()).toHaveAttribute(
      'aria-label',
      'Close the AI Assistant',
    );

    fireEvent.click(screen.getByText('close panel'));
    expect(panelStub()).not.toBeInTheDocument();
    // The open state resets asynchronously, when the sidecar's onClose resolves.
    await waitFor(() =>
      expect(headerButton()).toHaveAttribute('aria-expanded', 'false'),
    );
  });

  it('toggles the sidecar closed when the button is clicked again', async () => {
    const { core, sidecar } = coreMock();
    render(<AssistantHeaderButton core={core} />);

    fireEvent.click(headerButton());
    await screen.findByText('close panel');

    fireEvent.click(headerButton());
    expect(lastSidecarRef(sidecar).close).toHaveBeenCalled();
    expect(panelStub()).not.toBeInTheDocument();
  });

  it('asks before closing while an answer is generating, and stays open on cancel', async () => {
    mockOpenConfirm.mockResolvedValue(false);
    const { core, sidecar } = coreMock();
    render(<AssistantHeaderButton core={core} />);

    fireEvent.click(headerButton());
    await screen.findByText('start generating');
    fireEvent.click(screen.getByText('start generating'));

    fireEvent.click(headerButton());
    await waitFor(() => expect(mockOpenConfirm).toHaveBeenCalled());
    expect(lastSidecarRef(sidecar).close).not.toHaveBeenCalled();
    expect(panelStub()).toBeInTheDocument();
  });

  it('closes after the user confirms interrupting the running answer', async () => {
    mockOpenConfirm.mockResolvedValue(true);
    const { core, sidecar } = coreMock();
    render(<AssistantHeaderButton core={core} />);

    fireEvent.click(headerButton());
    await screen.findByText('start generating');
    fireEvent.click(screen.getByText('start generating'));

    fireEvent.click(headerButton());
    await waitFor(() =>
      expect(lastSidecarRef(sidecar).close).toHaveBeenCalled(),
    );
  });

  it('does not stack interrupt confirms on repeated clicks', async () => {
    // A confirm that never resolves keeps the first dialog "open" for the whole test.
    mockOpenConfirm.mockReturnValue(new Promise(() => {}));
    const { core } = coreMock();
    render(<AssistantHeaderButton core={core} />);

    fireEvent.click(headerButton());
    await screen.findByText('start generating');
    fireEvent.click(screen.getByText('start generating'));

    fireEvent.click(headerButton());
    fireEvent.click(headerButton());
    expect(mockOpenConfirm).toHaveBeenCalledTimes(1);
  });

  it('reopens with a clean generating flag after a confirmed close', async () => {
    mockOpenConfirm.mockResolvedValue(true);
    const { core } = coreMock();
    render(<AssistantHeaderButton core={core} />);

    fireEvent.click(headerButton());
    await screen.findByText('start generating');
    fireEvent.click(screen.getByText('start generating'));
    fireEvent.click(headerButton());
    await waitFor(() => expect(panelStub()).not.toBeInTheDocument());

    fireEvent.click(headerButton());
    await screen.findByText('close panel');
    fireEvent.click(headerButton());
    await waitFor(() => expect(panelStub()).not.toBeInTheDocument());
    // Only the first close asked for confirmation: reopening reset the stale flag.
    expect(mockOpenConfirm).toHaveBeenCalledTimes(1);
  });

  it('opens with the stored width and persists drag-resizes as they happen', async () => {
    window.localStorage.setItem('wazuhAiAssistant.sidecarWidth', '600');
    const { core, sidecar } = coreMock();
    render(<AssistantHeaderButton core={core} />);

    fireEvent.click(headerButton());
    expect(sidecar.open.mock.calls[0][1]).toMatchObject({
      config: { dockedMode: 'right', paddingSize: 600 },
    });
    await screen.findByText('close panel');

    // Write-through: the resize is persisted immediately, not only on close.
    act(() => sidecar.emitConfig({ paddingSize: 640 }));
    expect(window.localStorage.getItem('wazuhAiAssistant.sidecarWidth')).toBe(
      '640',
    );

    fireEvent.click(screen.getByText('close panel'));
    await waitFor(() =>
      expect(window.localStorage.getItem('wazuhAiAssistant.sidecarWidth')).toBe(
        '640',
      ),
    );
  });

  it('clamps a stored width that no longer fits the window', () => {
    window.localStorage.setItem('wazuhAiAssistant.sidecarWidth', '99999');
    const { core, sidecar } = coreMock();
    render(<AssistantHeaderButton core={core} />);

    fireEvent.click(headerButton());
    const { config } = sidecar.open.mock.calls[0][1] as {
      config: { paddingSize: number };
    };
    expect(config.paddingSize).toBe(Math.floor(window.innerWidth * 0.8));
  });
});

describe('registerAssistantHeaderButton', () => {
  it('registers on the header right section by default', () => {
    const { core } = coreMock();
    registerAssistantHeaderButton(core);

    expect(core.chrome.navControls.registerRight).toHaveBeenCalledTimes(1);
    expect(core.chrome.navControls.registerLeftBottom).not.toHaveBeenCalled();
  });

  it('registers on the left-bottom slot when the new home page is enabled', () => {
    const { core } = coreMock({ newHomePage: true });
    registerAssistantHeaderButton(core);

    expect(core.chrome.navControls.registerLeftBottom).toHaveBeenCalledTimes(1);
    expect(core.chrome.navControls.registerRight).not.toHaveBeenCalled();
  });

  it('mounts the button into the chrome-provided element and unmounts cleanly', () => {
    const { core } = coreMock();
    registerAssistantHeaderButton(core);

    const { mount } = (core.chrome.navControls.registerRight as jest.Mock).mock
      .calls[0][0];
    const element = document.createElement('div');
    document.body.append(element);

    let unmount: () => void = () => undefined;
    act(() => {
      unmount = mount(element);
    });
    expect(
      element.querySelector('[data-test-subj="wzAiAssistantHeaderButton"]'),
    ).toBeInTheDocument();

    act(() => unmount());
    expect(element.innerHTML).toBe('');
    element.remove();
  });
});
