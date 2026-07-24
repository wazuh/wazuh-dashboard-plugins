import { reportQueryError } from './report-query-error';
import { ErrorHandler } from '../../../../../react-services/error-management';

jest.mock('../../../../../react-services/error-management', () => ({
  ErrorFactory: { create: (_type: unknown, opts: unknown) => opts },
  ErrorHandler: { handleError: jest.fn() },
  HttpError: class HttpError {},
}));

const handleError = ErrorHandler.handleError as jest.Mock;

function lastCall() {
  const [errorArg, customLogOptions] = handleError.mock.calls[
    handleError.mock.calls.length - 1
  ] as [
    { error: unknown; message: string },
    { title: string; message: string },
  ];
  return { errorArg, customLogOptions };
}

describe('reportQueryError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('coalesces failures in one tick into a single toast listing the widgets', () => {
    reportQueryError('Findings', new Error('Request failed with status 403'));
    reportQueryError('Agents status', new Error('Network Error'));
    expect(handleError).not.toHaveBeenCalled(); // deferred

    jest.runAllTimers();

    expect(handleError).toHaveBeenCalledTimes(1);
    const { customLogOptions } = lastCall();
    expect(customLogOptions.title).toContain('Findings');
    expect(customLogOptions.title).toContain('Agents status');
  });

  it('includes the underlying error message per widget, not just the label', () => {
    reportQueryError('Findings', new Error('Request failed with status 403'));
    reportQueryError('Agents status', new Error('Network Error'));
    jest.runAllTimers();

    const { customLogOptions } = lastCall();
    expect(customLogOptions.message).toContain(
      'Findings: Request failed with status 403',
    );
    expect(customLogOptions.message).toContain('Agents status: Network Error');
  });

  it('extracts a message from a non-Error failure shape (e.g. an API error payload)', () => {
    reportQueryError('Rules', { data: { message: 'Forbidden' } });
    jest.runAllTimers();

    const { customLogOptions } = lastCall();
    expect(customLogOptions.message).toContain('Rules: Forbidden');
  });

  it('falls back to a generic message when no error / no message is given', () => {
    reportQueryError('Detectors');
    jest.runAllTimers();

    const { customLogOptions } = lastCall();
    expect(customLogOptions.message).toContain('Detectors: Unknown error');
  });

  it('a repeated label within the same tick keeps only the freshest error', () => {
    reportQueryError('Findings', new Error('first failure'));
    reportQueryError('Findings', new Error('second failure'));
    jest.runAllTimers();

    const { customLogOptions } = lastCall();
    expect(customLogOptions.message).toContain('second failure');
    expect(customLogOptions.message).not.toContain('first failure');
    // one entry for "Findings", not two
    expect(customLogOptions.message.match(/Findings:/g)?.length).toBe(1);
  });

  it('starts a fresh batch after the previous one flushes', () => {
    reportQueryError('Rules', new Error('boom'));
    jest.runAllTimers();
    expect(handleError).toHaveBeenCalledTimes(1);

    reportQueryError('Decoders', new Error('kaboom'));
    jest.runAllTimers();
    expect(handleError).toHaveBeenCalledTimes(2);
    const { customLogOptions } = lastCall();
    expect(customLogOptions.message).toContain('Decoders: kaboom');
    expect(customLogOptions.message).not.toContain('Rules');
  });
});
