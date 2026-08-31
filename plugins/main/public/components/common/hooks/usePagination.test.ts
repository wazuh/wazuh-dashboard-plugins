import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';

const buildResult = (total = 30) => ({
  data: [{ id: '1' }, { id: '2' }],
  total,
});

interface TableChange {
  page?: { index: number; size: number };
  sort?: { field: string; direction: 'asc' | 'desc' };
}

const flush = () => Promise.resolve();

describe('usePagination', () => {
  it('uses no sort by default, so existing callers keep the API default order', async () => {
    const fetchFunction = jest.fn().mockResolvedValue(buildResult());
    const { result } = renderHook(() => usePagination(fetchFunction));

    await act(async () => {
      await result.current.getData();
    });

    expect(fetchFunction).toHaveBeenCalledWith(0, 10, undefined);
    expect(result.current.sorting.sort).toEqual({});
  });

  it('honours the initial sort provided by the caller', async () => {
    const fetchFunction = jest.fn().mockResolvedValue(buildResult());
    const { result } = renderHook(() =>
      usePagination(fetchFunction, undefined, {
        field: 'username',
        direction: 'asc',
      }),
    );

    await act(async () => {
      await result.current.getData();
    });

    expect(fetchFunction).toHaveBeenCalledWith(0, 10, '+username');
    expect(result.current.sorting.sort).toEqual({
      field: 'username',
      direction: 'asc',
    });
  });

  it('forwards the sort selected in the table and resets to the first page', async () => {
    const fetchFunction = jest.fn().mockResolvedValue(buildResult());
    const { result } = renderHook(() =>
      usePagination(fetchFunction, undefined, {
        field: 'id',
        direction: 'asc',
      }),
    );

    await act(async () => {
      await result.current.getData(2, 10);
    });
    expect(result.current.pageIndex).toBe(2);

    const change: TableChange = {
      page: { index: 2, size: 10 },
      sort: { field: 'name', direction: 'desc' },
    };
    await act(async () => {
      result.current.onTableChange(change);
      await flush();
    });

    expect(fetchFunction).toHaveBeenLastCalledWith(0, 10, '-name');
    expect(result.current.pageIndex).toBe(0);
    expect(result.current.sorting.sort).toEqual({
      field: 'name',
      direction: 'desc',
    });
  });

  it('keeps the requested page when only the page index changes', async () => {
    const fetchFunction = jest.fn().mockResolvedValue(buildResult());
    const { result } = renderHook(() =>
      usePagination(fetchFunction, undefined, {
        field: 'id',
        direction: 'asc',
      }),
    );

    await act(async () => {
      result.current.onTableChange({
        page: { index: 1, size: 10 },
        sort: { field: 'id', direction: 'asc' },
      });
      await flush();
    });

    expect(fetchFunction).toHaveBeenLastCalledWith(10, 10, '+id');
  });

  it('preserves the active sort when the page size changes', async () => {
    const fetchFunction = jest.fn().mockResolvedValue(buildResult());
    const { result } = renderHook(() =>
      usePagination(fetchFunction, undefined, {
        field: 'id',
        direction: 'asc',
      }),
    );

    await act(async () => {
      result.current.onTableChange({
        page: { index: 0, size: 10 },
        sort: { field: 'name', direction: 'desc' },
      });
      await flush();
    });

    await act(async () => {
      result.current.onTableChange({
        page: { index: 2, size: 25 },
        sort: { field: 'name', direction: 'desc' },
      });
      await flush();
    });

    expect(fetchFunction).toHaveBeenLastCalledWith(0, 25, '-name');
  });

  it('preserves the active sort on refreshCurrentPage', async () => {
    const fetchFunction = jest.fn().mockResolvedValue(buildResult());
    const { result } = renderHook(() =>
      usePagination(fetchFunction, undefined, {
        field: 'id',
        direction: 'asc',
      }),
    );

    await act(async () => {
      result.current.onTableChange({
        page: { index: 0, size: 10 },
        sort: { field: 'name', direction: 'asc' },
      });
      await flush();
    });

    await act(async () => {
      await result.current.refreshCurrentPage();
    });

    expect(fetchFunction).toHaveBeenLastCalledWith(0, 10, '+name');
  });

  it('stays backward compatible with a two-argument fetch function', async () => {
    const fetchFunction = jest.fn((offset: number, limit: number) =>
      Promise.resolve({
        users: [{ id: `${offset}-${limit}` }],
        total: 1,
      }),
    );
    const { result } = renderHook(() => usePagination(fetchFunction));

    await act(async () => {
      await result.current.getData();
    });

    expect(result.current.items).toEqual([{ id: '0-10' }]);
    expect(result.current.totalItems).toBe(1);
  });

  it('clears items and calls onError when the fetch fails', async () => {
    const error = new Error('boom');
    const fetchFunction = jest.fn().mockRejectedValue(error);
    const onError = jest.fn();
    const { result } = renderHook(() => usePagination(fetchFunction, onError));

    await act(async () => {
      await result.current.getData();
    });

    expect(result.current.items).toEqual([]);
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.loading).toBe(false);
  });
});
