import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { WzRequest } from '../../../react-services/wz-request';

export const getAgentsByGroup = async () => {
  try {
    const {
      data: {
        data: { affected_items },
      },
    }: any = await WzRequest.apiReq(
      'GET',
      '/agents/stats/distinct?fields=group',
      {},
    );
    const groupedData: any[] = [];
    affected_items?.forEach((item: any) => {
      const itemGroupName = item?.group ?? 'Unknown';
      const foundItem = groupedData.find(
        (groupedItem: any) => groupedItem.label === itemGroupName,
      );
      if (foundItem) {
        foundItem.value = foundItem.value + 1;
      } else {
        groupedData.push({
          label: itemGroupName,
          value: 1,
          color: generateColorFromString(itemGroupName),
        });
      }
    });
    return groupedData;
  } catch (error) {
    const options = {
      context: `EndpointsSummary.getSummary`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: error,
        message: error.message || error,
        title: `Could not get agents summary`,
      },
    };
    getErrorOrchestrator().handleError(options);
    return [];
  }
};

function generateColorFromString(inputString: string): string {
  const hashCode = inputString
    .split('')
    .reduce(
      (hash, char) => char.charCodeAt(0) + (hash << 6) + (hash << 16) - hash,
      0,
    );
  const color =
    '#' + Math.abs(hashCode).toString(16).slice(0, 6).padStart(6, '0');
  return color;
}
