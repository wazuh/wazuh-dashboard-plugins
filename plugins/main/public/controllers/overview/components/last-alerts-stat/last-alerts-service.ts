import { AppState } from '../../../../react-services/app-state';
import { search } from '../../../../components/overview/vulnerabilities/dashboards/inventory/inventory_service';
import { getSettingDefaultValue } from '../../../../../common/services/settings';
import { getDataPlugin } from '../../../../kibana-services';
import { getLastAlertsQuery } from './last-alerts-query';

/**
 * This fetch the last 24 hours alerts from the selected cluster
 */
export const getLast24HoursAlerts = async (): Promise<number> => {
  try {
    const currentIndexPattern = await getDataPlugin().indexPatterns.get(
      AppState.getCurrentPattern() || getSettingDefaultValue('pattern'),
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
    return result?.hits?.total;
  } catch (error) {
    return Promise.reject(error);
  }
};
