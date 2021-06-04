// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-utils/ui-logs
import axios from 'axios';

function buildAxiosOptions(method: string, path: string, data: any = {}, headers: any = {}){
  return {
    method: method,
    headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'kibana', ...headers },
    url: `http://localhost:5601${path}`,
    data: data
  };
};


describe('Wazuh API - /utils/logs/ui', () => {
  test('[200] Get UI Logs', () => {
    const options = buildAxiosOptions('get', '/utils/logs/ui');
    return axios(options).then(response => {
      expect(response.status).toBe(200);
      //expect(typeof response.data.data).toBe('object');
      //expect(typeof response.data.data.hosts).toBe('object');
    }).catch(error => {throw error})
  },5000);
});

describe('Wazuh API - /utils/logs/ui', () => {
  let userToken = null;
 
  test('[200] Create UI Logs', () => {
    const options = buildAxiosOptions('post', '/utils/logs/ui', {
      message: 'Message test',
      level: 'error',
      location: 'Location'
    });
    return axios(options).then(response => {
      expect(response.status).toBe(200);
    }).catch(error => {throw error})
  },5000);
});
