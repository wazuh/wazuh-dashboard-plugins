import { classifyQueryError, describeError } from './classify-query-error';
import { ErrorDataSourceNotFound } from '../../../../../utils/errors';

describe('classifyQueryError', () => {
  it('classifies a missing index pattern using its own remediation message', () => {
    const error = new ErrorDataSourceNotFound(
      'Index pattern [id: wazuh-alerts-*] not found. Check if it exists or create one in Dashboard Management.',
      { indexPatternId: 'wazuh-alerts-*' },
    );
    expect(classifyQueryError(error)).toEqual({
      kind: 'index-pattern-missing',
      message: error.message,
    });
  });

  it.each([
    { status: 403 },
    { statusCode: 403 },
    { response: { status: 403 } },
    { body: { statusCode: 403 } },
  ])('classifies a 403 as permission-denied ($status shape)', shape => {
    expect(classifyQueryError(shape)).toEqual({
      kind: 'permission-denied',
      message:
        "You don't have permission to view this data.",
    });
  });

  it('does not classify a non-403 status as permission-denied', () => {
    const error = new Error('Internal Server Error');
    (error as Error & { status?: number }).status = 500;
    expect(classifyQueryError(error).kind).toBe('unknown');
  });

  it('falls back to unknown with the underlying message for anything else', () => {
    expect(classifyQueryError(new Error('Network Error'))).toEqual({
      kind: 'unknown',
      message: 'Network Error',
    });
  });
});

describe('describeError', () => {
  it('extracts an Error message', () => {
    expect(describeError(new Error('boom'))).toBe('boom');
  });

  it('passes through a string', () => {
    expect(describeError('boom')).toBe('boom');
  });

  it('extracts a message from a non-Error object payload', () => {
    expect(describeError({ message: 'Forbidden' })).toBe('Forbidden');
  });

  it('extracts a nested data.message', () => {
    expect(describeError({ data: { message: 'Forbidden' } })).toBe(
      'Forbidden',
    );
  });

  it('falls back to a generic message', () => {
    expect(describeError(undefined)).toBe('Unknown error');
  });
});
