// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-hosts
import axios from 'axios';
import { PLUGIN_PLATFORM_REQUEST_HEADERS } from '../../common/constants';

function buildAxiosOptions(method: string, path: string, data: any = {}, headers: any = {}){
  return {
    method: method,
    headers: { ...PLUGIN_PLATFORM_REQUEST_HEADERS, 'content-type': 'application/json', ...headers },
    url: `http://localhost:5601${path}`,
    data: data
  };
};

describe.skip('Wazuh Host', () => {
  describe('Wazuh API - /hosts/apis', () => {
    test('[200] Returns the available API hosts', () => {
      const options = buildAxiosOptions('get', '/hosts/apis');
      return axios(options).then(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        response.data.forEach(host => {
          expect(typeof host.url).toBe('string');
          expect(typeof host.port).toBe('number');
          expect(typeof host.username).toBe('string');
          expect(typeof host.run_as).toBe('boolean');
          expect(typeof host.id).toBe('string');
          expect(typeof host.cluster_info).toBe('object');
          expect(typeof host.cluster_info.status).toBe('string');
          expect(typeof host.cluster_info.manager).toBe('string');
          expect(typeof host.cluster_info.node).toBe('string');
          expect(typeof host.cluster_info.cluster).toBe('string');
          expect(typeof host.extensions).toBe('object');
          expect(typeof host.allow_run_as).toBe('number');
        })
      }).catch(error => {throw error})
    });
  });

  describe('Wazuh API - /hosts/update-hostname', () => {
    test('[200] Update the cluster info for a API host', () => {
      const options = buildAxiosOptions('put', '/hosts/update-hostname/default', {
        cluster_info: {
          status: 'enabled',
          manager: 'wazuh-test',
          node: 'node-test',
          cluster: 'cluster-test'
        }
      });
      return axios(options).then(response => {
        expect(response.status).toBe(200);
      }).catch(error => {throw error})
    });
  });
});

  //TODO: Do the test to remove-orphan-entries endpoint
  // describe('Wazuh API - /hosts/remove-orphan-entries', () => {
  //   test('[200] Remove orphan entries', () => {
  //     const options = buildAxiosOptions('post', '/hosts/remove-orphan-entries');
  //     return axios(options).then(response => {
  //       expect(response.status).toBe(200);
  //     }).catch(error => {throw error})
  //   });
  // });
