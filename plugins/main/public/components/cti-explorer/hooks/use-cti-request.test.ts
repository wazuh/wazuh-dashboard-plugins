import { act, renderHook } from '@testing-library/react';
import { useCtiRequest } from './use-cti-request';

jest.mock('../services/cti-explorer-api', () => ({
  toCtiRequestError: (error: {
    body?: { attributes?: { code?: string } };
  }) => ({
    statusCode: 403,
    code: error.body?.attributes?.code ?? 'unknown',
    index: 'wazuh-threatintel-enrichments*',
    reason: null,
  }),
}));

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
};

describe('useCtiRequest', () => {
  it('drops a response that arrives after a newer request started', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const requests: Record<number, Promise<string>> = {
      1: first.promise,
      2: second.promise,
    };
    const { result, rerender } = renderHook(
      ({ page }) => useCtiRequest(() => requests[page], [page]),
      { initialProps: { page: 1 } },
    );

    rerender({ page: 2 });
    await act(async () => {
      second.resolve('page 2');
      await second.promise;
    });
    await act(async () => {
      first.resolve('page 1');
      await first.promise;
    });

    expect(result.current.data).toBe('page 2');
    expect(result.current.loading).toBe(false);
  });

  it('keeps the last data while a new request runs', async () => {
    const next = deferred<string>();
    const { result, rerender } = renderHook(
      ({ page }) =>
        useCtiRequest(
          () => (page === 1 ? Promise.resolve('page 1') : next.promise),
          [page],
        ),
      { initialProps: { page: 1 } },
    );
    await act(async () => {
      await Promise.resolve();
    });

    rerender({ page: 2 });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe('page 1');
  });

  it('describes a failed request', async () => {
    const { result } = renderHook(() =>
      useCtiRequest(
        () => Promise.reject({ body: { attributes: { code: 'forbidden' } } }),
        [],
      ),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toMatchObject({ code: 'forbidden' });
    expect(result.current.data).toBeNull();
  });
});
