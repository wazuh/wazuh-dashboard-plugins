// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-api
import axios from 'axios';
import { PLUGIN_PLATFORM_REQUEST_HEADERS } from '../../common/constants';

function buildAxiosOptions(
  method: string,
  path: string,
  data: any = {},
  headers: any = {},
) {
  return {
    method: method,
    headers: {
      ...PLUGIN_PLATFORM_REQUEST_HEADERS,
      'content-type': 'application/json',
      ...headers,
    },
    url: `http://localhost:5601${path}`,
    data: data,
  };
}

describe.skip('Wazuh API', () => {
  describe('Wazuh API - /api/login', () => {
    test('[200] Returns a token in the response and set cookies', () => {
      const options = buildAxiosOptions('post', '/api/login', {
        idHost: 'default',
      });
      const cookies = ['wz-user', 'wz-token', 'wz-api'];
      return axios(options).then(response => {
        expect(typeof response.data).toBe('object');
        expect(typeof response.data.token).toBe('string');
        expect(
          cookies.filter(cookie =>
            response.headers['set-cookie'].find(c => c.includes(cookie)),
          ).length,
        ).toBe(cookies.length);
      });
    });
  });

  describe('Wazuh API - /api/check-api', () => {
    test('[200] Check default api returns manager, node, cluster, status and allow_run_as params', () => {
      const options = buildAxiosOptions('post', '/api/check-api', {
        id: 'default',
      });
      return axios(options)
        .then(response => {
          expect(response.status).toBe(200);
          expect(typeof response.data).toBe('object');
          expect(typeof response.data.manager).toBe('string');
          expect(typeof response.data.node).toBe('string');
          expect(typeof response.data.cluster).toBe('string');
          expect(typeof response.data.status).toBe('string');
          expect(typeof response.data.allow_run_as).toBe('number');
        })
        .catch(error => {
          throw error;
        });
    });

    test('[500] Check unknown api', () => {
      const options = buildAxiosOptions('post', '/api/check-api', {
        id: 'unknown',
      });
      return axios(options).catch(error => {
        expect(typeof error.response.data).toBe('object');
        expect(error.response.data.statusCode).toBe(500);
        expect(error.response.data.error).toBe('Internal Server Error');
        expect(
          error.response.data.message.includes(
            'Selected API is no longer available in wazuh.yml',
          ),
        ).toBe(true);
      });
    });
  });

  describe('Wazuh API - /api/check-stored-api', () => {
    test('[200] Check default api returns manager, node, cluster, status and allow_run_as params', () => {
      const options = buildAxiosOptions('post', '/api/check-stored-api', {
        id: 'default',
      });
      return axios(options)
        .then(response => {
          expect(response.status).toBe(200);
          expect(typeof response.data).toBe('object');
          expect(typeof response.data.data).toBe('object');
          expect(typeof response.data.data.url).toBe('string');
          expect(typeof response.data.data.port).toBe('number');
          expect(typeof response.data.data.username).toBe('string');
          expect(typeof response.data.data.password).toBe('string');
          expect(typeof response.data.data.run_as).toBe('boolean');
          expect(typeof response.data.data.id).toBe('string');
          expect(typeof response.data.data.cluster_info).toBe('object');
          expect(typeof response.data.data.cluster_info.status).toBe('string');
          expect(typeof response.data.data.cluster_info.node).toBe('string');
          expect(typeof response.data.data.cluster_info.manager).toBe('string');
          expect(typeof response.data.data.cluster_info.cluster).toBe('string');
        })
        .catch(error => {
          throw error;
        });
    });

    test('[500] Check unknown api', () => {
      const options = buildAxiosOptions('post', '/api/check-stored-api', {
        id: 'unknown',
      });
      return axios(options).catch(error => {
        expect(typeof error.response.data).toBe('object');
        expect(error.response.data.statusCode).toBe(500);
        expect(error.response.data.error).toBe('Internal Server Error');
        expect(
          error.response.data.message.includes(
            'Selected API is no longer available in wazuh.yml',
          ),
        ).toBe(true);
      });
    });
  });

  describe('Wazuh API - /api/request', () => {
    let userToken = null;
    beforeAll(() => {
      const optionsAuthenticate = buildAxiosOptions('post', '/api/login', {
        idHost: 'default',
      });
      return axios(optionsAuthenticate).then(response => {
        userToken = response.data.token;
        return response.data.token;
      });
    });

    test('[200] Get agents', () => {
      const options = buildAxiosOptions(
        'post',
        '/api/request',
        {
          id: 'default',
          method: 'GET',
          path: '/agents',
          body: {},
        },
        {
          cookie: `wz-token=${userToken}; wz-api=default;`,
        },
      );
      return axios(options)
        .then(response => {
          expect(response.status).toBe(200);
          expect(typeof response.data.data).toBe('object');
          expect(Array.isArray(response.data.data.affected_items)).toBe(true);
        })
        .catch(error => {
          throw error;
        });
    });

    test('[200] Get agents with a not working user token', () => {
      const options = buildAxiosOptions(
        'post',
        '/api/request',
        {
          id: 'default',
          method: 'GET',
          path: '/agents',
          body: {},
        },
        {
          cookie: `wz-token=null; wz-api=default;`,
        },
      );
      return axios(options).catch(error => {
        expect(error.response.status).toBe(401);
        expect(error.response.data.statusCode).toBe(401);
        expect(error.response.data.error).toBe('Unauthorized');
        expect(
          error.response.data.message.includes(
            'Request failed with status code 401',
          ),
        ).toBe(true);
      });
    });
  });

  describe('Wazuh API - /api/routes', () => {
    test('[200] Returns the routes', () => {
      const options = buildAxiosOptions('get', '/api/routes', {});
      return axios(options)
        .then(response => {
          expect(response.status).toBe(200);
          expect(Array.isArray(response.data)).toBe(true);
          expect(typeof response.data[0]).toBe('object');
          expect(typeof response.data[0].method).toBe('string');
          expect(Array.isArray(response.data[0].endpoints)).toBe(true);
          expect(typeof response.data[0].endpoints[0]).toBe('object');
          expect(
            Object.keys(response.data[0].endpoints[0]).every(key => [
              'documentation',
              'description',
              'summary',
            ]),
          ).toBe(true);
        })
        .catch(error => {
          throw error;
        });
    });
  });

  describe('Wazuh API - /api/setup', () => {
    test('[200] Returns the app setup', () => {
      const options = buildAxiosOptions('get', '/api/setup');
      return axios(options)
        .then(response => {
          expect(response.status).toBe(200);
          expect(typeof response.data.data).toBe('object');
          expect(
            Object.keys(response.data.data).every(key => [
              'app-version',
              'revision',
              'hosts',
            ]),
          ).toBe(true);
          expect(
            ['app-version', 'revision'].every(
              key => typeof response.data.data[key] === 'string',
            ),
          ).toBe(true);
          expect(typeof response.data.data.hosts).toBe('object');
        })
        .catch(error => {
          throw error;
        });
    });
  });
});
