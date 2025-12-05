import { AppState } from '../../../../react-services/app-state';
import { search } from '../../../../components/common/search-bar';
import { getDataPlugin } from '../../../../kibana-services';
import { getLastAlertsQuery } from './last-alerts-query';

interface Last24HoursAlerts {
  count: number;
  cluster: {
    field: string;
    name: string;
  };
  indexPatternId: string;
}

/**
 * This fetch the last 24 hours alerts from the selected cluster
 * TODO: The search function should be moved to a common place
 */
export const getLast24HoursAlerts = async (
  ruleLevelRange,
): Promise<Last24HoursAlerts> => {
  try {
    const pattern = await AppState.getCurrentPattern();
    const currentIndexPattern = await getDataPlugin().indexPatterns.get(
      pattern,
    );
    const clusterValue = AppState.getClusterInfo().cluster;

    const lastAlertsQuery = getLastAlertsQuery(
      currentIndexPattern,
      clusterValue,
      ruleLevelRange,
    );

    const result = await search(lastAlertsQuery);
    const count = result?.hits?.total;
    return {
      count,
      cluster: {
        field: 'cluster.name',
        name: clusterValue,
      },
      indexPatternId: currentIndexPattern.id,
    };
  } catch (error) {
    return Promise.reject(error);
  }
};
