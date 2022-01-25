// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-utils
import axios from 'axios';
import { PLUGIN_PLATFORM_REQUEST_HEADERS } from '../../../common/constants';

function buildAxiosOptions(method: string, path: string, data: any = {}, headers: any = {}) {
  return {
    method: method,
    headers: { ...PLUGIN_PLATFORM_REQUEST_HEADERS, 'content-type': 'application/json', ...headers },
    url: `http://localhost:5601${path}`,
    data: data,
  };
}

describe.skip('Wazuh API - utils', () => {
  describe('Wazuh API - /utils/configuration', () => {
    test('[200] Returns the app configuration', () => {
      const options = buildAxiosOptions('get', '/utils/configuration');
      return axios(options)
        .then((response) => {
          expect(response.status).toBe(200);
          expect(typeof response.data.data).toBe('object');
          expect(typeof response.data.data.hosts).toBe('object');
        })
        .catch((error) => {
          throw error;
        });
    });
  });

  describe('Wazuh API - /utils/configuration', () => {
    let userToken = null;
    beforeAll(() => {
      const optionsAuthenticate = buildAxiosOptions('post', '/api/login', {
        idHost: 'default',
      });
      return axios(optionsAuthenticate).then((response) => {
        userToken = response.data.token;
        return response.data.token;
      });
    });
    test('[200] Updates the app configuration', () => {
      const options = buildAxiosOptions(
        'put',
        '/utils/configuration',
        {
          key: 'logs.level',
          value: 'debug',
        },
        {
          cookie: `wz-token=${userToken};wz-api=default;`,
        }
      );
      return axios(options)
        .then((response) => {
          expect(response.status).toBe(200);
        })
        .catch((error) => {
          throw error;
        });
    });
  });

  describe('Wazuh API - /utils/logs', () => {
    test('[200] Get the app logs', () => {
      const options = buildAxiosOptions('get', '/utils/logs');
      return axios(options)
        .then((response) => {
          expect(response.status).toBe(200);
        })
        .catch((error) => {
          throw error;
        });
    });
  });
});
