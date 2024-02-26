import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { WzRequest } from '../../../react-services/wz-request';
import { getColorPaletteByIndex } from './get-color-palette-by-index';

interface AffectedItem {
  count: number;
  group?: string[];
}

interface AgentCountGroup {
  label: string;
  value: number;
  color: string;
}

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
    const groupedData = getCountByGroup(affected_items);
    return groupedData.slice(0, 5);
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

function getCountByGroup(data: AffectedItem[]): AgentCountGroup[] {
  const countMap: Map<string, number> = new Map();

  data.forEach(item => {
    if (item.group) {
      item.group.forEach(group => {
        if (countMap.has(group)) {
          countMap.set(group, countMap.get(group)! + item.count);
        } else {
          countMap.set(group, item.count);
        }
      });
    }
  });

  const countArray = Array.from(countMap.entries()).map(
    ([label, value], index: number) => {
      return {
        label,
        value,
        color: getColorPaletteByIndex(index),
      };
    },
  );
  return countArray.sort((a, b) => b.value - a.value);
}
