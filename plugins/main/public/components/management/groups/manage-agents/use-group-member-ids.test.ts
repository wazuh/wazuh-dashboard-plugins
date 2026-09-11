import { renderHook, waitFor } from '@testing-library/react';
import { useGroupMemberIds } from './use-group-member-ids';
import { WzRequest } from '../../../../react-services/wz-request';

jest.mock('../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const page = (ids: string[], total: number) => ({
  data: {
    data: {
      affected_items: ids.map(id => ({ id })),
      total_affected_items: total,
    },
  },
});

describe('useGroupMemberIds', () => {
  beforeEach(() => {
    (WzRequest.apiReq as jest.Mock).mockReset();
  });

  it('pages until total_affected_items is reached', async () => {
    (WzRequest.apiReq as jest.Mock)
      .mockResolvedValueOnce(page(['1', '2'], 1002))
      .mockResolvedValueOnce(page(['3'], 1002))
      .mockResolvedValue(page([], 1002));

    const { result } = renderHook(() => useGroupMemberIds('group1', 0));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(Array.from(result.current.memberIds)).toEqual(
      expect.arrayContaining(['1', '2', '3']),
    );
    expect(result.current.memberTotal).toBe(1002);
  });

  it('changing reloadToken triggers a refetch', async () => {
    (WzRequest.apiReq as jest.Mock)
      .mockResolvedValueOnce(page(['1'], 1))
      .mockResolvedValueOnce(page(['1', '2'], 2));

    const { result, rerender } = renderHook(
      ({ token }) => useGroupMemberIds('group1', token),
      { initialProps: { token: 0 } },
    );

    await waitFor(() => expect(result.current.memberTotal).toBe(1));

    rerender({ token: 1 });

    await waitFor(() => expect(result.current.memberTotal).toBe(2));
  });

  it('a request error surfaces via returned error field without throwing', async () => {
    (WzRequest.apiReq as jest.Mock).mockRejectedValueOnce(
      new Error('network down'),
    );

    const { result } = renderHook(() => useGroupMemberIds('group1', 0));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('network down');
  });
});
