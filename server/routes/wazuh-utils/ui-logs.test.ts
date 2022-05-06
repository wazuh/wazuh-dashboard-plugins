// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-utils/ui-logs
import axios from 'axios';
import { PLUGIN_PLATFORM_REQUEST_HEADERS } from '../../../common/constants';

const buildAxiosOptions = (method: string, path: string, data: any = {}, headers: any = {}) => {
  return {
    method: method,
    headers: { ...PLUGIN_PLATFORM_REQUEST_HEADERS, 'content-type': 'application/json', ...headers },
    url: `http://localhost:5601${path}`,
    data: data,
  };
};

describe.skip('Wazuh UI Logs', () => {
  describe('Wazuh API - /utils/logs/ui', () => {
    it('[200] Get UI Logs', () => {
      const options = buildAxiosOptions('get', '/utils/logs/ui');
      return axios(options)
        .then((response) => {
          expect(response.status).toBe(200);
        })
        .catch((error) => {
          throw error;
        });
    }, 6000);
  });

  describe('Wazuh API - /utils/logs/ui', () => {
    it('[200] Create UI Logs', () => {
      const options = buildAxiosOptions('post', '/utils/logs/ui', {
        message: 'Message test',
        level: 'error',
        location: 'Location',
      });
      return axios(options)
        .then((response) => {
          expect(response.status).toBe(200);
        })
        .catch((error) => {
          throw error;
        });
    }, 6000);
  });
});
