// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-utils
import axios from 'axios';

function buildAxiosOptions(method: string, path: string, data: any = {}, headers: any = {}){
  return {
    method: method,
    headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'kibana', ...headers },
    url: `http://localhost:5601${path}`,
    data: data
  };
};