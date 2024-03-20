import { AppState } from '../../../../react-services/app-state';
import { search } from '../../../../components/common/search-bar';
import { getDataPlugin, getWazuhCorePlugin } from '../../../../kibana-services';
import { getLastAlertsQuery } from './last-alerts-query';

interface Last24HoursAlerts {
  count: number;
  cluster: {
    field: string;
    name: string;
  };
  indexPatternName: string;
}

/**
 * This fetch the last 24 hours alerts from the selected cluster
 * TODO: The search function should be moved to a common place
 */
export const getLast24HoursAlerts = async (): Promise<Last24HoursAlerts> => {
  try {
    const currentIndexPattern = await getDataPlugin().indexPatterns.get(
      AppState.getCurrentPattern() ||
        getWazuhCorePlugin().configuration.getSettingValue('pattern'),
    );
    const isCluster = AppState.getClusterInfo().status == 'enabled';
    const clusterValue = isCluster
      ? AppState.getClusterInfo().cluster
      : AppState.getClusterInfo().manager;

    const lastAlertsQuery = getLastAlertsQuery(
      currentIndexPattern,
      isCluster,
      clusterValue,
    );

    const result = await search(lastAlertsQuery);
    const count = result?.hits?.total;
    return {
      count,
      cluster: {
        field: isCluster ? 'cluster.name' : 'manager.name',
        name: clusterValue,
      },
      indexPatternName: currentIndexPattern.title,
    };
  } catch (error) {
    return Promise.reject(error);
  }
};
