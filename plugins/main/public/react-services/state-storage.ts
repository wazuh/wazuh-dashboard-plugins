import { DataPublicPluginStart } from '../../../../src/plugins/data/public';
import {
  createStateContainer,
  IOsdUrlStateStorage,
  syncState as _syncState,
} from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { AppState } from './app-state';
import { migrateLegacyQuery } from '../utils/migrate_legacy_query';
import { APP_STATE_URL_KEY } from '../../common/constants';

const OsdUrlStateStorage = (
  data: DataPublicPluginStart,
  osdUrlStateStorage: IOsdUrlStateStorage,
) => {
  const getAppStateFromUrl = () => {
    return osdUrlStateStorage.get(APP_STATE_URL_KEY) as AppState;
  };

  const getAppStateContainer = () => {
    const defaultQuery = migrateLegacyQuery(
      data.query.queryString.getDefaultQuery(),
    );
    let initialAppState = {
      query: defaultQuery,
      ...getAppStateFromUrl(),
    };
    return createStateContainer<AppState>(initialAppState);
  };

  const replaceUrlAppState = async (newPartial: AppState = {}) => {
    const state = { ...getAppStateContainer().getState(), ...newPartial };
    await osdUrlStateStorage.set(APP_STATE_URL_KEY, state, { replace: true });
  };

  return {
    getAppStateFromUrl,
    getAppStateContainer,
    replaceUrlAppState,
  };
};

export default OsdUrlStateStorage;
