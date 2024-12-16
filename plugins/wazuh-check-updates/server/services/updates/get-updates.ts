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
import { IAPIHost } from "../../../../wazuh-core/server/services";

export const getUpdates = async (
  queryApi = false,
  forceQuery = false,
): Promise<AvailableUpdates> => {
  try {
    if (!queryApi) {
      const availableUpdates = (await getSavedObject(
        SAVED_OBJECT_UPDATES,
      )) as AvailableUpdates;

      return availableUpdates;
    }

    const { manageHosts, api: wazuhApiClient } = getWazuhCore();

    const hosts = await manageHosts.get() as IAPIHost[];

    const apisAvailableUpdates = await Promise.all(
      hosts?.map(async api => {
        const data = {};
        const method = 'GET';
        const path = `/manager/version/check?force_query=${forceQuery}`;
        const options = {
          apiHostID: api.id,
          forceRefresh: true,
        };
        try {
          const response = await wazuhApiClient.client.asInternalUser.request(
            method,
            path,
            data,
            options,
          );

          const update = response.data.data as ResponseApiAvailableUpdates;

          const {
            current_version,
            update_check,
            last_available_major,
            last_available_minor,
            last_available_patch,
            last_check_date,
          } = update;

          const getStatus = () => {
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

          return {
            current_version,
            update_check,
            last_available_major,
            last_available_minor,
            last_available_patch,
            last_check_date: last_check_date || undefined,
            api_id: api.id,
            status: getStatus(),
          };
        } catch (error: any) {
          const errorResponse = {
            title: error.response?.data?.title,
            detail: error.response?.data?.detail ?? error.message,
          };

          return {
            api_id: api.id,
            status: API_UPDATES_STATUS.ERROR,
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

    const { logger } = getWazuhCheckUpdatesServices();

    logger.error(message);
    return Promise.reject(error);
  }
};
