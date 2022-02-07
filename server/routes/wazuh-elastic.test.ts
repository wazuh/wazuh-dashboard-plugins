// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-elastic
import axios from 'axios';
import { PLUGIN_PLATFORM_REQUEST_HEADERS } from '../../common/constants';

function buildAxiosOptions(method: string, path: string, data: any = {}, headers: any = {}) {
  return {
    method: method,
    headers: { ...PLUGIN_PLATFORM_REQUEST_HEADERS, 'content-type': 'application/json', ...headers },
    url: `http://localhost:5601${path}`,
    data: data,
  };
}

describe.skip('Wazuh Elastic', () => {
  describe('Wazuh API - /elastic/security/current-platform', () => {
    test('[200] Returns the current security platform as string or boolean', () => {
      const options = buildAxiosOptions('get', '/elastic/security/current-platform');
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data).toBe('object');
        expect(['string', 'boolean'].includes(typeof response.data.platform)).toBe(true);
      });
    });
  });

  // TODO: This test need to be defined
  // describe('Wazuh API - /elastic/visualizations/{tab}/{pattern}', () => {
  //   test('[200] Returns an array with the index patterns', () => {
  //     const options = buildAxiosOptions('get', '/elastic/visualizations/{tab}/{pattern}');
  //     return axios(options).then(response => {
  //       expect(response.status).toBe(200);
  //       expect(typeof response.data).toBe('object');
  //       expect(Array.isArray(response.data.data)).toBe(true);
  //       response.data.data.forEach(indexPattern => {
  //         expect(Array.isArray(indexPattern.id)).toBe('string');
  //         expect(Array.isArray(indexPattern.title)).toBe('string');
  //       })
  //     });
  //   });
  // });

  // TODO: This test need to be defined
  // describe('Wazuh API - /elastic/visualizations/{tab}/{pattern}', () => {
  //   test('[200] Returns an array with the index patterns', () => {
  //     const options = buildAxiosOptions('post', '/elastic/visualizations/{tab}/{pattern}');
  //     return axios(options).then(response => {
  //       expect(response.status).toBe(200);
  //       expect(typeof response.data).toBe('object');
  //       expect(Array.isArray(response.data.data)).toBe(true);
  //       response.data.data.forEach(indexPattern => {
  //         expect(Array.isArray(indexPattern.id)).toBe('string');
  //         expect(Array.isArray(indexPattern.title)).toBe('string');
  //       })
  //     });
  //   });
  // });

  describe('Wazuh API - /elastic/template/{pattern}', () => {
    test('[200] Check if there is some template with the pattern', () => {
      const options = buildAxiosOptions('get', '/elastic/template/wazuh-alerts-*');
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.status).toBe('boolean');
        expect(typeof response.data.data).toBe('string');
      });
    });
  });

  describe('Wazuh API - /elastic/index-patterns/{pattern}', () => {
    test('[200] Check if there an index pattern with the pattern', () => {
      const options = buildAxiosOptions('get', '/elastic/index-patterns/wazuh-alerts-*');
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.status).toBe('boolean');
        expect(typeof response.data.data).toBe('string');
      });
    });
  });

  // TODO: This test need to be defined
  // describe('Wazuh API - /elastic/top/{mode}/{cluster}/{field}/{pattern}', () => {
  //   test('[200] Check if there an index pattern with the pattern', () => {
  //     const options = buildAxiosOptions('get', '/elastic/top/{mode}/{cluster}/{field}/{pattern}');
  //     return axios(options).then(response => {
  //       expect(response.status).toBe(200);
  //     });
  //   });
  // });

  describe('Wazuh API - /elastic/samplealerts', () => {
    test('[200] Check if there an sample data indices', () => {
      const options = buildAxiosOptions('get', '/elastic/samplealerts');
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.sampleAlertsInstalled).toBe('boolean');
      });
    });
  });

  describe('Wazuh API - /elastic/samplealerts/{category}', () => {
    test('[200] Check if there an sample data index of Security category', () => {
      const options = buildAxiosOptions('get', '/elastic/samplealerts/security');
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.index).toBe('string');
        expect(typeof response.data.exists).toBe('boolean');
      });
    });

    test('[200] Check if there an sample data index of Audit and Policy monitoring category', () => {
      const options = buildAxiosOptions('get', '/elastic/samplealerts/auditing-policy-monitoring');
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.index).toBe('string');
        expect(typeof response.data.exists).toBe('boolean');
      });
    });

    test('[200] Check if there an sample data index of Theard detection category', () => {
      const options = buildAxiosOptions('get', '/elastic/samplealerts/threat-detection');
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.index).toBe('string');
        expect(typeof response.data.exists).toBe('boolean');
      });
    });
  });

  describe('Wazuh API - /elastic/samplealerts/{category}', () => {
    let userToken = null;
    beforeAll(() => {
      const optionsAuthenticate = buildAxiosOptions('post', '/api/login', {
        idHost: 'default',
      });
      return axios(optionsAuthenticate)
        .then((response) => {
          userToken = response.data.token;
          return response.data.token;
        })
        .catch((error) => {});
    });

    test('[200] Create sample alers of Security category', () => {
      const options = buildAxiosOptions(
        'post',
        '/elastic/samplealerts/security',
        {},
        {
          cookie: `wz-token=${userToken};wz-api=default;`,
        }
      );
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.index).toBe('string');
        expect(typeof response.data.alertCount).toBe('number');
      });
    });

    test('[200] Create sample alers of Audit and Policy monitoring category', () => {
      const options = buildAxiosOptions(
        'post',
        '/elastic/samplealerts/auditing-policy-monitoring',
        {},
        {
          cookie: `wz-token=${userToken};wz-api=default;`,
        }
      );
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.index).toBe('string');
        expect(typeof response.data.alertCount).toBe('number');
      });
    });

    test('[200] Create sample alers of Theard detection category', () => {
      const options = buildAxiosOptions(
        'post',
        '/elastic/samplealerts/threat-detection',
        {},
        {
          cookie: `wz-token=${userToken};wz-api=default;`,
        }
      );
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.index).toBe('string');
        expect(typeof response.data.alertCount).toBe('number');
      });
    });

    test('[401] Create sample alers of Theard detection category without token cookie', () => {
      const options = buildAxiosOptions(
        'post',
        '/elastic/samplealerts/threat-detection',
        {},
        {
          cookie: `wz-api=default;`,
        }
      );
      return axios(options).catch((error) => {
        expect(error.response.status).toBe(401);
      });
    });

    test('[401] Create sample alers of Theard detection category without api cookie', () => {
      const options = buildAxiosOptions(
        'post',
        '/elastic/samplealerts/threat-detection',
        {},
        {
          cookie: `wz-token=${userToken};`,
        }
      );
      return axios(options).catch((error) => {
        expect(error.response.status).toBe(401);
      });
    });

    test('[200] Delete sample alers of Security category', () => {
      const options = buildAxiosOptions(
        'delete',
        '/elastic/samplealerts/security',
        {},
        {
          cookie: `wz-token=${userToken};wz-api=default;`,
        }
      );
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.index).toBe('string');
        expect(typeof response.data.result).toBe('string');
      });
    });

    test('[200] Delete sample alers of Audit and Policy monitoring category', () => {
      const options = buildAxiosOptions(
        'delete',
        '/elastic/samplealerts/auditing-policy-monitoring',
        {},
        {
          cookie: `wz-token=${userToken};wz-api=default;`,
        }
      );
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.index).toBe('string');
        expect(typeof response.data.result).toBe('string');
      });
    });

    test('[200] Delete sample alers of Theard detection category', () => {
      const options = buildAxiosOptions(
        'delete',
        '/elastic/samplealerts/threat-detection',
        {},
        {
          cookie: `wz-token=${userToken};wz-api=default;`,
        }
      );
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data.index).toBe('string');
        expect(typeof response.data.result).toBe('string');
      });
    });

    test('[200] Delete sample alers of Theard detection category without token cookie', () => {
      const options = buildAxiosOptions(
        'delete',
        '/elastic/samplealerts/threat-detection',
        {},
        {
          cookie: `wz-api=default;`,
        }
      );
      return axios(options).catch((error) => {
        expect(error.response.status).toBe(401);
      });
    });

    test('[200] Delete sample alers of Theard detection category without api cookie', () => {
      const options = buildAxiosOptions(
        'delete',
        '/elastic/samplealerts/threat-detection',
        {},
        {
          cookie: `wz-token=${userToken}`,
        }
      );
      return axios(options).catch((error) => {
        expect(error.response.status).toBe(401);
      });
    });
  });

  // TODO: This test need to be defined
  // describe('Wazuh API - /elastic/alerts', () => {
  //   test('[200] Check if there an sample data index of Security category', () => {
  //     const options = buildAxiosOptions('get', '/elastic/alerts');
  //     return axios(options).then(response => {
  //       expect(response.status).toBe(200);
  //       expect(typeof response.data.index).toBe('string');
  //       expect(typeof response.data.exists).toBe('boolean');
  //     });
  //   });
  // });

  describe('Wazuh API - /elastic/statistics', () => {
    test('[200] Check if there an sample data index of Security category', () => {
      const options = buildAxiosOptions('get', '/elastic/statistics');
      return axios(options).then((response) => {
        expect(response.status).toBe(200);
        expect(typeof response.data).toBe('boolean');
      });
    });
  });
});
