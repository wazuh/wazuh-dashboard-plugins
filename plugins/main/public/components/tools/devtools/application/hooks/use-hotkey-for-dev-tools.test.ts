import { act, renderHook } from '@testing-library/react-hooks';
import '@testing-library/jest-dom/extend-expect';
import useHotkeyForDevTools from './use-hotkey-for-dev-tools';

describe('useHotkeyForDevTools', () => {
  const handlers: Record<string, Function | undefined> = {};
  const on = jest.fn((evt: string, cb: Function) => {
    handlers[evt] = cb;
  });
  const off = jest.fn((evt: string) => {
    handlers[evt] = undefined;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).$ = () => ({ on, off });
  });

  it('invokes callback on Ctrl+Enter', () => {
    const cb = jest.fn();
    renderHook(() => useHotkeyForDevTools({ onSendRequestButton: cb }));

    expect(on).toHaveBeenCalledWith('keydown', expect.any(Function));

    const evt: any = { key: 'Enter', ctrlKey: true, preventDefault: jest.fn() };
    handlers['keydown']?.(evt);
    expect(evt.preventDefault).toHaveBeenCalled();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not invoke on only Enter or only Ctrl', () => {
    const cb = jest.fn();
    renderHook(() => useHotkeyForDevTools({ onSendRequestButton: cb }));

    handlers['keydown']?.({ key: 'Enter', ctrlKey: false, metaKey: false });
    handlers['keydown']?.({ key: 'A', ctrlKey: true });
    expect(cb).not.toHaveBeenCalled();
  });

  it('cleans up listener on unmount', () => {
    const cb = jest.fn();
    const { unmount } = renderHook(() => useHotkeyForDevTools({ onSendRequestButton: cb }));
    expect(on).toHaveBeenCalledTimes(1);
    act(() => unmount());
    expect(off).toHaveBeenCalledWith('keydown', expect.any(Function));
    // Emitting again should not call cb if cleanup removed handler
    handlers['keydown']?.({ key: 'Enter', ctrlKey: true });
    expect(cb).not.toHaveBeenCalled();
  });
});

