// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/updates
// import axios from 'axios';
import needle from 'needle';
const chai = require('chai');
import { routes } from '../../common';

chai.should();

// function buildAxiosOptions(method: string, path: string, data: any = {}, headers: any = {}) {
//   return {
//     method,
//     // headers: { ...PLUGIN_PLATFORM_REQUEST_HEADERS, 'content-type': 'application/json', ...headers },
//     url: `https://localhost:5601${path}`,
//     data,
//   };
// }

describe(`Wazuh Check Updates API - ${routes.checkUpdates}`, () => {
  test('[200] Check default api returns mayor, minor and patch arrays', async () => {
    // const options = buildAxiosOptions('get', routes.checkUpdates, {
    //   id: 'default',
    // });
    const res = await needle('get', `https://localhost:5601${routes.checkUpdates}`, {}, {});

    res.body.should.be.a('object');
    res.body.manager.should.be.a('string');
    res.body.cluster.should.be.a('string');
    res.body.status.should.be.a('string');
  });

  // test('[500] Check unknown api', () => {
  //   const options = buildAxiosOptions('post', '/api/check-api', {
  //     id: 'unknown',
  //   });
  //   return axios(options).catch((error) => {
  //     expect(typeof error.response.data).toBe('object');
  //     expect(error.response.data.statusCode).toBe(500);
  //     expect(error.response.data.error).toBe('Internal Server Error');
  //     expect(
  //       error.response.data.message.includes('Selected API is no longer available in wazuh.yml')
  //     ).toBe(true);
  //   });
  // });
});

// describe('Wazuh API - /api/check-stored-api', () => {
//   test('[200] Check default api returns manager, node, cluster, status and allow_run_as params', () => {
//     const options = buildAxiosOptions('post', '/api/check-stored-api', {
//       id: 'default',
//     });
//     return axios(options)
//       .then((response) => {
//         expect(response.status).toBe(200);
//         expect(typeof response.data).toBe('object');
//         expect(typeof response.data.data).toBe('object');
//         expect(typeof response.data.data.url).toBe('string');
//         expect(typeof response.data.data.port).toBe('number');
//         expect(typeof response.data.data.username).toBe('string');
//         expect(typeof response.data.data.password).toBe('string');
//         expect(typeof response.data.data.run_as).toBe('boolean');
//         expect(typeof response.data.data.id).toBe('string');
//         expect(typeof response.data.data.cluster_info).toBe('object');
//         expect(typeof response.data.data.cluster_info.status).toBe('string');
//         expect(typeof response.data.data.cluster_info.node).toBe('string');
//         expect(typeof response.data.data.cluster_info.manager).toBe('string');
//         expect(typeof response.data.data.cluster_info.cluster).toBe('string');
//       })
//       .catch((error) => {
//         throw error;
//       });
//   });

//   test('[500] Check unknown api', () => {
//     const options = buildAxiosOptions('post', '/api/check-stored-api', {
//       id: 'unknown',
//     });
//     return axios(options).catch((error) => {
//       expect(typeof error.response.data).toBe('object');
//       expect(error.response.data.statusCode).toBe(500);
//       expect(error.response.data.error).toBe('Internal Server Error');
//       expect(
//         error.response.data.message.includes('Selected API is no longer available in wazuh.yml')
//       ).toBe(true);
//     });
//   });
// });

// describe('Wazuh API - /api/request', () => {
//   let userToken = null;
//   beforeAll(() => {
//     const optionsAuthenticate = buildAxiosOptions('post', '/api/login', {
//       idHost: 'default',
//     });
//     return axios(optionsAuthenticate).then((response) => {
//       userToken = response.data.token;
//       return response.data.token;
//     });
//   });

//   test('[200] Get agents', () => {
//     const options = buildAxiosOptions(
//       'post',
//       '/api/request',
//       {
//         id: 'default',
//         method: 'GET',
//         path: '/agents',
//         body: {},
//       },
//       {
//         cookie: `wz-token=${userToken}; wz-api=default;`,
//       }
//     );
//     return axios(options)
//       .then((response) => {
//         expect(response.status).toBe(200);
//         expect(typeof response.data.data).toBe('object');
//         expect(Array.isArray(response.data.data.affected_items)).toBe(true);
//       })
//       .catch((error) => {
//         throw error;
//       });
//   });

//   test('[200] Get agents with a not working user token', () => {
//     const options = buildAxiosOptions(
//       'post',
//       '/api/request',
//       {
//         id: 'default',
//         method: 'GET',
//         path: '/agents',
//         body: {},
//       },
//       {
//         cookie: `wz-token=null; wz-api=default;`,
//       }
//     );
//     return axios(options).catch((error) => {
//       expect(error.response.status).toBe(401);
//       expect(error.response.data.statusCode).toBe(401);
//       expect(error.response.data.error).toBe('Unauthorized');
//       expect(error.response.data.message.includes('Request failed with status code 401')).toBe(
//         true
//       );
//     });
//   });
// });

// describe('Wazuh API - /api/routes', () => {
//   test('[200] Returns the routes', () => {
//     const options = buildAxiosOptions('get', '/api/routes', {});
//     return axios(options)
//       .then((response) => {
//         expect(response.status).toBe(200);
//         expect(Array.isArray(response.data)).toBe(true);
//         expect(typeof response.data[0]).toBe('object');
//         expect(typeof response.data[0].method).toBe('string');
//         expect(Array.isArray(response.data[0].endpoints)).toBe(true);
//         expect(typeof response.data[0].endpoints[0]).toBe('object');
//         expect(
//           Object.keys(response.data[0].endpoints[0]).every((key) => [
//             'name',
//             'documentation',
//             'description',
//             'summary',
//           ])
//         ).toBe(true);
//       })
//       .catch((error) => {
//         throw error;
//       });
//   });
// });

// describe('Wazuh API - /api/extensions', () => {
//   test('[200] Returns the extensions of a host by id', () => {
//     const options = buildAxiosOptions('get', '/api/extensions/default');
//     return axios(options)
//       .then((response) => {
//         expect(response.status).toBe(200);
//         expect(typeof response.data).toBe('object');
//         expect(typeof response.data.extensions).toBe('object');
//       })
//       .catch((error) => {
//         throw error;
//       });
//   });

//   test('[200] Set the extensions in the wazh-registry.json for a host', () => {
//     const options = buildAxiosOptions('post', '/api/extensions', {
//       id: 'default',
//       extensions: {
//         fim: true,
//       },
//     });
//     return axios(options)
//       .then((response) => {
//         expect(response.status).toBe(200);
//       })
//       .catch((error) => {
//         throw error;
//       });
//   });
// });

// describe('Wazuh API - /api/setup', () => {
//   test('[200] Returns the app setup', () => {
//     const options = buildAxiosOptions('get', '/api/setup');
//     return axios(options)
//       .then((response) => {
//         expect(response.status).toBe(200);
//         expect(typeof response.data.data).toBe('object');
//         expect(
//           Object.keys(response.data.data).every((key) => [
//             'name',
//             'app-version',
//             'revision',
//             'installationDate',
//             'lastRestart',
//             'hosts',
//           ])
//         ).toBe(true);
//         expect(
//           ['name', 'app-version', 'revision', 'installationDate', 'lastRestart'].every(
//             (key) => typeof response.data.data[key] === 'string'
//           )
//         ).toBe(true);
//         expect(typeof response.data.data.hosts).toBe('object');
//       })
//       .catch((error) => {
//         throw error;
//       });
//   });
// });

// describe('Wazuh API - /api/syscollector', () => {
//   test('[200] Returns the syscollector info for an agent. Sure the hardware and os keys are returned', () => {
//     const options = buildAxiosOptions(
//       'get',
//       '/api/syscollector/001',
//       {},
//       {
//         cookie: 'wz-api=default;',
//       }
//     );
//     return axios(options)
//       .then((response) => {
//         expect(response.status).toBe(200);
//         expect(typeof response.data).toBe('object');
//         expect(typeof response.data.hardware).toBe('object');
//         expect(typeof response.data.hardware.cpu).toBe('object');
//         expect(typeof response.data.hardware.cpu.cores).toBe('number');
//         expect(typeof response.data.hardware.cpu.mhz).toBe('number');
//         expect(typeof response.data.hardware.cpu.name).toBe('string');
//         expect(typeof response.data.hardware.ram).toBe('object');
//         expect(typeof response.data.hardware.ram.free).toBe('number');
//         expect(typeof response.data.hardware.ram.total).toBe('number');
//         expect(typeof response.data.hardware.ram.usage).toBe('number');
//         expect(typeof response.data.hardware.scan).toBe('object');
//         expect(typeof response.data.hardware.scan.id).toBe('number');
//         expect(typeof response.data.hardware.scan.time).toBe('string');
//         expect(typeof response.data.os).toBe('object');
//         expect(typeof response.data.os.os).toBe('object');
//         expect(typeof response.data.os.os.codename).toBe('string');
//         expect(typeof response.data.os.os.major).toBe('string');
//         expect(typeof response.data.os.os.minor).toBe('string');
//         expect(typeof response.data.os.os.name).toBe('string');
//         expect(typeof response.data.os.os.platform).toBe('string');
//         expect(typeof response.data.os.os.version).toBe('string');
//         expect(typeof response.data.os.scan.id).toBe('number');
//         expect(typeof response.data.os.scan.time).toBe('string');
//         expect(typeof response.data.os.architecture).toBe('string');
//         expect(typeof response.data.os.hostname).toBe('string');
//         expect(typeof response.data.os.release).toBe('string');
//         expect(typeof response.data.os.version).toBe('string');
//         expect(typeof response.data.os.sysname).toBe('string');
//       })
//       .catch((error) => {
//         throw error;
//       });
//   });
// });
