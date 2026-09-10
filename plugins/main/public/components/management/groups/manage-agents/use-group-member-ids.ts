import { useEffect, useState } from 'react';
import { WzRequest } from '../../../../react-services/wz-request';

const PAGE_SIZE = 500;

export type UseGroupMemberIdsResult = {
  memberIds: Set<string>;
  memberTotal: number;
  isLoading: boolean;
  error?: string;
};

/**
 * Pages `GET /groups/{name}/agents?select=id` until every member id has been
 * collected. Reload is triggered by changing `reloadToken`, not by an
 * internal timer or endpoint switch.
 */
export const useGroupMemberIds = (
  groupName: string,
  reloadToken: number | string = 0,
): UseGroupMemberIdsResult => {
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [memberTotal, setMemberTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(undefined);
      try {
        let offset = 0;
        let total = 0;
        const ids = new Set<string>();

        do {
          const response = await WzRequest.apiReq(
            'GET',
            `/groups/${groupName}/agents`,
            {
              params: {
                select: 'id',
                limit: PAGE_SIZE,
                offset,
              },
            },
          );
          const { affected_items, total_affected_items } =
            response?.data?.data ?? {};
          total = total_affected_items ?? 0;
          (affected_items || []).forEach((agent: { id: string }) =>
            ids.add(agent.id),
          );
          offset += PAGE_SIZE;
        } while (offset < total);

        if (!cancelled) {
          setMemberIds(ids);
          setMemberTotal(total);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || String(err));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [groupName, reloadToken]);

  return { memberIds, memberTotal, isLoading, error };
};
