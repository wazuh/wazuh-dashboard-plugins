import { WzRequest } from './server-client';

const noop = () => {};
const logger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

const USER_TOKEN =
  'eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ3YXp1aCIsImF1ZCI6IldhenVoIEFQSSBSRVNUIiwibmJmIjoxNzI2NzM3MDY3LCJleHAiOjE3MjY3Mzc5NjcsInN1YiI6IndhenVoLXd1aSIsInJ1bl9hcyI6ZmFsc2UsInJiYWNfcm9sZXMiOlsxXSwicmJhY19tb2RlIjoid2hpdGUifQ.AOL4dDe3c4WCYXMjqbkBqfKFAChtjvD_uZ0FXfLOMnfU0n6zPo61OZ43Kt0bYhW25BQIXR9Belb49gG3_qAIZpcaAQhQv4HPcL41ESRSvZc2wsa9_HYgV8Z7gieSuT15gdnSNogLKFS7yK5gQQivLo1e4QfVsDThrG_TVdJPbCG3GPq9';

function createClient() {
  const mockRequest = jest.fn(options => {
    console.log({ options });
    if (options.url === '/api/login') {
      return {
        data: {
          token: USER_TOKEN,
        },
      };
    } else if (options.url === '/api/request') {
      if (options.data.path === '/security/users/me/policies') {
        return {
          data: {
            rbac_mode: 'white',
          },
        };
      } else if (
        options.data.method === 'DELETE' &&
        options.data.path === '/security/user/authenticate'
      ) {
        return {
          data: {
            message: 'User wazuh-wui was successfully logged out',
            error: 0,
          },
        };
      }
    }
    // if(path === '/security/users/me/policies'){

    // }
  });
  const client = new WzRequest(logger, {
    getServerAPI: () => 'test',
    getTimeout: () => Promise.resolve(1000),
    getURL: path => path,
    request: mockRequest,
  });
  return { client, mockRequest };
}

describe('Create client', () => {
  it('Ensure the initial userData value', done => {
    const { client } = createClient();

    client.userData$.subscribe(userData => {
      expect(userData).toEqual({
        logged: false,
        token: null,
        account: null,
        policies: null,
      });
      done();
    });
  });

  it('Authentication', done => {
    const { client, mockRequest } = createClient();

    client.auth().then(data => {
      expect(data).toEqual({
        token: USER_TOKEN,
        policies: {},
        account: null,
        logged: true,
      });

      client.userData$.subscribe(userData => {
        expect(userData).toEqual({
          token: USER_TOKEN,
          policies: {},
          account: null,
          logged: true,
        });
        done();
      });
    });
  });

  it.only('Unauthentication', done => {
    const { client } = createClient();

    client.unauth().then(data => {
      expect(data).toEqual({});
      done();
    });
  });

  it('Request', async () => {
    const { client, mockRequest } = createClient();

    const data = await client.request('GET', '/security/users/me/policies', {});

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(data).toEqual({ data: { rbac_mode: 'white' } });
  });
});
