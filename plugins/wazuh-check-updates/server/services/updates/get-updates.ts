import {
  API_UPDATES_STATUS,
  AvailableUpdates,
  ResponseApiAvailableUpdates,
} from '../../../common/types';
import { SAVED_OBJECT_UPDATES } from '../../../common/constants';
import { getSavedObject, setSavedObject } from '../saved-object';
import {
  getWazuhCheckUpdatesServices,
  getWazuhCore,
} from '../../plugin-services';
import { IAPIHost } from '../../../../wazuh-core/server/services';

export const getUpdates = async (
  queryApi = false,
  forceQuery = false,
): Promise<AvailableUpdates> => {
  const { logger } = getWazuhCheckUpdatesServices();

  try {
    if (!queryApi) {
      const availableUpdates = (await getSavedObject(
        SAVED_OBJECT_UPDATES,
      )) as AvailableUpdates;

      return availableUpdates;
    }

    const getStatus = ({
      update_check,
      last_available_major,
      last_available_minor,
      last_available_patch,
    }: ResponseApiAvailableUpdates) => {
      if (update_check === false) {
        return API_UPDATES_STATUS.DISABLED;
      }

      if (
        last_available_major?.tag ||
        last_available_minor?.tag ||
        last_available_patch?.tag
      ) {
        return API_UPDATES_STATUS.AVAILABLE_UPDATES;
      }

      return API_UPDATES_STATUS.UP_TO_DATE;
    };

    const { manageHosts, api: wazuhApiClient } = getWazuhCore();

    const hosts = (await manageHosts.get()) as IAPIHost[];

    const apisAvailableUpdates = await Promise.all(
      hosts?.map(async api => {
        const data = {};
        const method = 'GET';
        const path = `/manager/version/check?force_query=${forceQuery}`;
        const options = {
          apiHostID: api.id,
          forceRefresh: true,
        };
        let currentVersion: string | undefined = undefined;
        let availableUpdates: ResponseApiAvailableUpdates = {};

        try {
          const {
            data: {
              data: { api_version },
            },
          } = await wazuhApiClient.client.asInternalUser.request(
            'GET',
            '/',
            {},
            options,
          );
          if (api_version !== undefined) {
            currentVersion = `v${api_version}`;
          }
        } catch {
          logger.debug('[ERROR]: Cannot get the API version');
        }

        try {
          const response = await wazuhApiClient.client.asInternalUser.request(
            method,
            path,
            data,
            options,
          );

          availableUpdates = response.data.data as ResponseApiAvailableUpdates;

          const {
            update_check,
            last_available_major,
            last_available_minor,
            last_available_patch,
            last_check_date,
          } = availableUpdates;

          // If for some reason, the previous request fails
          if (currentVersion === undefined) {
            currentVersion = availableUpdates.current_version;
          }

          return {
            current_version: currentVersion,
            update_check,
            last_available_major,
            last_available_minor,
            last_available_patch,
            last_check_date: last_check_date || undefined,
            api_id: api.id,
            status: getStatus(availableUpdates),
          };
        } catch (error: any) {
          logger.debug('[ERROR]: Cannot get the API status');
          const errorResponse = {
            title: error.response?.data?.title ?? error.message,
            detail: error.response?.data?.detail ?? error.message,
          };

          return {
            api_id: api.id,
            status: API_UPDATES_STATUS.ERROR,
            current_version: currentVersion,
            error: errorResponse,
          };
        }
      }),
    );

    const savedObject = {
      apis_available_updates: apisAvailableUpdates,
      last_check_date: new Date(),
    };

    await setSavedObject(SAVED_OBJECT_UPDATES, savedObject);

    return savedObject;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error trying to get available updates';

    logger.error(message);
    return Promise.reject(error);
  }
};
