import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { WzRequest } from '../../../react-services/wz-request';
import { getColorPaletteByIndex } from './get-color-palette-by-index';

export const getAgentsByOs = async () => {
  const DEFAULT_COUNT = 1;
  try {
    const {
      data: {
        data: { affected_items },
      },
    }: any = await WzRequest.apiReq(
      'GET',
      '/agents/stats/distinct?fields=os.platform',
      {
        params: { q: 'id!=000' },
      },
    );
    const groupedData: any[] = [];
    affected_items?.forEach((item: any, index: number) => {
      const itemOsName = item?.os?.platform ?? 'N/A';
      groupedData.push({
        label: itemOsName,
        value: item.count ?? DEFAULT_COUNT,
        color: getColorPaletteByIndex(index),
      });
    });
    return groupedData.sort((a, b) => b.value - a.value).slice(0, 5);
  } catch (error) {
    const options = {
      context: `EndpointsSummary.getSummary`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: error,
        message: error.message || error,
        title: `Could not get agents by OS`,
      },
    };
    getErrorOrchestrator().handleError(options);
    return [];
  }
};
