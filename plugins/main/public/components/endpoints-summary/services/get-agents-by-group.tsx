import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { WzRequest } from '../../../react-services/wz-request';
import { getColorPaletteByIndex } from './get-color-palette-by-index';

export const getAgentsByGroup = async () => {
  try {
    const {
      data: {
        data: { affected_items },
      },
    }: any = await WzRequest.apiReq(
      'GET',
      '/agents/stats/distinct?fields=group',
      {
        params: { q: 'id!=000' },
      },
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
          color: getColorPaletteByIndex(groupedData.length),
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
