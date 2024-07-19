import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';
import { Group } from '../types';

export const getGroupsService = async ({
  filters,
  limit,
  offset,
  pageSize = 1000,
}: {
  filters: any;
  limit?: number;
  offset?: number;
  pageSize?: number;
}) => {
  let queryOffset = offset ?? 0;
  let queryLimit = limit && limit <= pageSize ? limit : pageSize;
  let allAffectedItems: Group[] = [];
  let totalAffectedItems;

  do {
    const {
      data: {
        data: { affected_items, total_affected_items },
      },
    } = (await WzRequest.apiReq('GET', '/groups', {
      params: {
        limit: queryLimit,
        offset: queryOffset,
        q: filters,
        wait_for_complete: true,
      },
    })) as IApiResponse<Group>;

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
