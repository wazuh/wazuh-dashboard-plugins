/**
 * Unit tests for parseErrorForOutput in error-adapter.ts
 *
 * Covers:
 * - Happy path when ErrorHandler returns a string
 * - Timeout case (status -1)
 * - JSON stringification for object-like errors
 * - JSON stringify failure handling
 * - Edge cases returning 'Empty'
 */
import { parseErrorForOutput } from './error-adapter';

// Mock the react-services ErrorHandler used by the adapter
jest.mock('../../../../../react-services', () => ({
  ErrorHandler: {
    handle: jest.fn(),
  },
}));

// Access the mocked handle for assertions
import { ErrorHandler } from '../../../../../react-services';

describe('parseErrorForOutput (unit)', () => {
  const handleMock = ErrorHandler.handle as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns timeout message when error.status is -1', () => {
    const error = { status: -1 };
    const res = parseErrorForOutput(error);
    expect(res).toBe('API is not reachable. Reason: timeout.');
    expect(handleMock).not.toHaveBeenCalled();
  });

  it('returns handled string and calls ErrorHandler.handle with silent=true', () => {
    const error = { message: 'original' };
    handleMock.mockReturnValue('handled-message');

    const res = parseErrorForOutput(error);
    expect(res).toBe('handled-message');
    expect(handleMock).toHaveBeenCalledTimes(1);
    expect(handleMock).toHaveBeenCalledWith(error, '', { silent: true });
  });

  it('returns Empty when handle is non-string and error has no object data', () => {
    handleMock.mockReturnValue({});
    const res = parseErrorForOutput({});
    expect(res).toBe('Empty');
  });

  it('stringifies error when error.data is an object and handle is non-string', () => {
    handleMock.mockReturnValue(undefined);
    const error: any = { data: { foo: 'bar' }, code: 1 };
    const res = parseErrorForOutput(error);
    // Inline snapshot to verify stable stringified output
    expect(res).toMatchInlineSnapshot(
      '"{\\"data\\":{\\"foo\\":\\"bar\\"},\\"code\\":1}"',
    );
  });

  it('returns "Unknown error" when JSON.stringify throws (circular structure)', () => {
    handleMock.mockReturnValue(undefined);
    const error: any = {};
    error.data = { ok: true };
    error.self = error; // circular reference to trigger stringify error

    const res = parseErrorForOutput(error);
    expect(res).toBe('Unknown error');
  });

  it('returns "Empty" when error is undefined and handle returns non-string', () => {
    handleMock.mockReturnValue(undefined);
    const res = parseErrorForOutput(undefined as any);
    expect(res).toBe('Empty');
    expect(handleMock).toHaveBeenCalledTimes(1);
  });
});
