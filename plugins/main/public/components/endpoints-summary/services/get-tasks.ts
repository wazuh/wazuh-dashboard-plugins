import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';
import { Agent } from '../types';

export const getTasks = async ({
  status,
  command,
  offset,
  limit,
  q,
  pageSize = 1000,
}: {
  status: string;
  command: string;
  offset?: number;
  limit?: number;
  q?: string;
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
    } = (await WzRequest.apiReq('GET', '/tasks/status', {
      params: {
        limit: queryLimit,
        offset: queryOffset,
        status,
        command,
        q,
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
