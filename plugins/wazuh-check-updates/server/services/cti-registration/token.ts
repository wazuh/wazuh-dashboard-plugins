import axios from 'axios';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import { ctiUrls } from '../../../common/constants';

export const getCtiToken = async (uuid: string): Promise<any> => {
  const { logger } = getWazuhCheckUpdatesServices();

  try {
    const response = await axios.post(ctiUrls.token, null, {
      params: {
        client_id: uuid,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error requesting CTI token';

    logger.error(message);
    return Promise.reject(error);
  }
};
