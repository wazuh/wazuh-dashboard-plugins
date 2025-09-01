/**
 * Integration-like tests for parseErrorForOutput using the real ErrorHandler
 * (no explicit jest.mock for react-services). These tests validate the
 * interaction between the adapter and the ErrorHandler contract.
 */
import { parseErrorForOutput } from './error-adapter';

describe('parseErrorForOutput (integration)', () => {
  it('returns Error.message when passing a native Error', () => {
    const res = parseErrorForOutput(new Error('boom'));
    expect(res).toBe('boom');
  });

  it('extracts nested message via ErrorHandler and returns it', () => {
    const res = parseErrorForOutput({ response: { data: { message: 'Server says hi' } } });
    expect(res).toBe('Server says hi');
  });
});

