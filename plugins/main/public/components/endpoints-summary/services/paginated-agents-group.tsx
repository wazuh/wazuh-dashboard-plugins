import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';

export type ErrorAgent = {
  error: {
    code?: number;
    message: string;
    remediation?: string;
  };
  id: string[];
};

export const paginatedAgentsGroupService = async ({
  addOrRemove,
  agentIds,
  groupId,
  pageSize = 2,
}: {
  addOrRemove: 'add' | 'remove';
  agentIds: string[];
  groupId: string;
  pageSize?: number;
}): Promise<IApiResponse<string>> => {
  let offset = 0;
  let requestAgentIds: string[] = [];
  let allAffectedItems: string[] = [];
  let allFailedItems: ErrorAgent[] = [];
  let totalAffectedItems = 0;
  let totalFailedItems = 0;
  let error = 0;
  let message = '';

  do {
    requestAgentIds = agentIds.slice(offset, offset + pageSize);
    offset += pageSize;

    const {
      data: {
        data: {
          affected_items: responseAffectedItems,
          total_affected_items: responseTotalAffectedItems,
          failed_items: responseFailedItems,
          total_failed_items: responseTotalFailedItems,
        },
        error: responseError,
        message: responseMessage,
      },
    } = (await WzRequest.apiReq(
      addOrRemove === 'add' ? 'PUT' : 'DELETE',
      `/agents/group`,
      {
        params: {
          group_id: groupId,
          agents_list: requestAgentIds.join(','),
          wait_for_complete: true,
        },
      },
      { returnOriginalResponse: true },
    )) as IApiResponse<string>;

    error += responseError;
    message = message.includes(responseMessage)
      ? message
      : message + ', ' + responseMessage;
    totalAffectedItems += responseTotalAffectedItems;
    totalFailedItems += responseTotalFailedItems;
    allAffectedItems = [...allAffectedItems, ...responseAffectedItems];

    const notExistFailedItems = responseFailedItems.filter(
      responseFailedItem =>
        !allFailedItems.find(
          failedItem => failedItem.error.code === responseFailedItem.error.code,
        ),
    );

    const mergeFailedItems = allFailedItems.map(failedItem => {
      const responseFailedItemWithSameError = responseFailedItems.find(
        responseFailedItem =>
          responseFailedItem.error.code === failedItem.error.code,
      );

      return {
        ...failedItem,
        id: responseFailedItemWithSameError
          ? [...failedItem.id, ...responseFailedItemWithSameError.id]
          : failedItem.id,
      };
    });

    allFailedItems = [...mergeFailedItems, ...notExistFailedItems];
  } while (offset < agentIds.length);

  return {
    data: {
      data: {
        affected_items: allAffectedItems,
        total_affected_items: totalAffectedItems,
        failed_items: allFailedItems,
        total_failed_items: totalFailedItems,
      },
      error,
      message,
    },
  };
};
