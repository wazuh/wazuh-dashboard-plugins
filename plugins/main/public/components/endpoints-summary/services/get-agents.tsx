import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';
import { Agent } from '../types';

export const getAgentsService = async ({
  filters,
  agents,
  limit,
  offset,
  pageSize = 1000,
}: {
  filters?: any;
  agents?: string[];
  limit?: number;
  offset?: number;
  pageSize?: number;
}) => {
  let queryOffset = offset ?? 0;
  let queryLimit = limit && limit <= pageSize ? limit : pageSize;
  let allAffectedItems: Agent[] = [];
  let totalAffectedItems;

  do {
    const {
      data: {
        data: { affected_items, total_affected_items },
      },
    } = (await WzRequest.apiReq('GET', '/agents', {
      params: {
        limit: queryLimit,
        offset: queryOffset,
        ...(agents?.length ? { agents_list: agents?.join(',') } : {}),
        ...(filters ? { q: filters } : {}),
        wait_for_complete: true,
      },
    })) as IApiResponse<Agent>;

    if (totalAffectedItems === undefined) {
      totalAffectedItems = total_affected_items;
    }

    allAffectedItems = allAffectedItems.concat(affected_items);

    queryOffset += queryLimit;

    const restItems = limit ? limit - allAffectedItems.length : pageSize;
    queryLimit = restItems > pageSize ? pageSize : restItems;
  } while (
    queryOffset < totalAffectedItems &&
    (!limit || allAffectedItems.length < limit)
  );

  return {
    affected_items: allAffectedItems,
    total_affected_items: totalAffectedItems,
  };
};
