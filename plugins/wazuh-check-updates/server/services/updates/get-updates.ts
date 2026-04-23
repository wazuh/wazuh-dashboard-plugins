import { IScopedClusterClient } from 'opensearch-dashboards/server';
import {
  API_UPDATES_STATUS,
  AvailableUpdates,
  ResponseIndexerAvailableUpdates,
  Update,
} from '../../../common/types';
import { SAVED_OBJECT_UPDATES } from '../../../common/constants';
import { getSavedObject, setSavedObject } from '../saved-object';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';

const CONTENT_MANAGER_VERSION_CHECK_PATH =
  '/_plugins/_content_manager/version/check';

const getStatus = ({
  last_available_major,
  last_available_minor,
  last_available_patch,
}: ResponseIndexerAvailableUpdates): API_UPDATES_STATUS =>
  last_available_major?.tag || last_available_minor?.tag || last_available_patch?.tag
    ? API_UPDATES_STATUS.AVAILABLE_UPDATES
    : API_UPDATES_STATUS.UP_TO_DATE;

const presentUpdate = (update?: Update): Update | undefined =>
  update?.tag ? update : undefined;

const saveAndReturn = async (result: AvailableUpdates): Promise<AvailableUpdates> => {
  await setSavedObject(SAVED_OBJECT_UPDATES, result);
  return result;
};

export const getUpdates = async (
  queryApi = false,
  opensearchClient?: IScopedClusterClient,
): Promise<AvailableUpdates> => {
  const { logger } = getWazuhCheckUpdatesServices();

  if (!queryApi) {
    return (await getSavedObject(SAVED_OBJECT_UPDATES)) as AvailableUpdates;
  }

  if (!opensearchClient) {
    return Promise.reject(
      new Error('OpenSearch client is required to query updates'),
    );
  }

  try {
    const response = await opensearchClient.asCurrentUser.transport.request({
      method: 'GET',
      path: CONTENT_MANAGER_VERSION_CHECK_PATH,
    });

    const { message, status } = response.body as {
      message: ResponseIndexerAvailableUpdates | string;
      status: number;
    };

    if (status !== 200 || typeof message === 'string') {
      return saveAndReturn({
        last_check_date_dashboard: new Date(),
        status: API_UPDATES_STATUS.ERROR,
        error: {
          detail: typeof message === 'string' ? message : 'Unknown error',
        },
      });
    }

    return saveAndReturn({
      uuid: message.uuid,
      current_version: message.current_version,
      last_available_major: presentUpdate(message.last_available_major),
      last_available_minor: presentUpdate(message.last_available_minor),
      last_available_patch: presentUpdate(message.last_available_patch),
      last_check_date: message.last_check_date,
      last_check_date_dashboard: new Date(),
      status: getStatus(message),
    });
  } catch (error: any) {
    logger.error(
      `[ERROR]: Cannot get available updates from indexer. Message: ${error.message}. Status: ${error.meta?.statusCode}. Body: ${JSON.stringify(error.meta?.body)}`,
    );
    return saveAndReturn({
      last_check_date_dashboard: new Date(),
      status: API_UPDATES_STATUS.ERROR,
      error: { title: error.message, detail: error.message },
    });
  }
};
