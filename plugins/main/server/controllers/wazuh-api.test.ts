import { WazuhApiCtrl } from './wazuh-api';

const createContext = (request: jest.Mock) => ({
  wazuh: {
    logger: {
      debug: jest.fn(),
      error: jest.fn(),
    },
    api: { client: { asCurrentUser: { request } } },
  },
  wazuh_core: {
    manageHosts: { get: jest.fn(() => Promise.resolve({ id: 'default' })) },
  },
});

const createResponse = () => ({
  ok: jest.fn(options => options),
  custom: jest.fn(options => options),
  customError: jest.fn(options => options),
});

describe('WazuhApiCtrl.makeRequest from Dev Tools', () => {
  it('returns the body of a Server API refusal as is, with its status code', async () => {
    const apiBody = {
      title: 'Permission Denied',
      detail: 'Permission denied: Resource type: *:*',
      remediation: 'Please, make sure you have permissions',
      dapi_errors: {
        node01: { error: 'Permission denied: Resource type: *:*' },
      },
      error: 4000,
    };
    const request = jest.fn(() =>
      Promise.reject(
        Object.assign(new Error('Request failed with status code 403'), {
          response: { status: 403, data: apiBody },
        }),
      ),
    );
    const response = createResponse();

    await new WazuhApiCtrl().makeRequest(
      createContext(request),
      'POST',
      '/groups',
      { body: { group_id: 'test' }, devTools: true },
      'default',
      response,
    );

    expect(response.custom).toHaveBeenCalledTimes(1);
    const { statusCode, body, headers } = response.custom.mock.calls[0][0];
    expect(statusCode).toBe(403);
    // A buffer, so the platform does not reduce it to {statusCode, error, message}
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(JSON.parse(body.toString())).toEqual(apiBody);
    expect(headers).toEqual({ 'content-type': 'application/json' });
  });

  it('returns a message when the Server API refusal has no body', async () => {
    const request = jest.fn(() =>
      Promise.reject(
        Object.assign(new Error('Request failed with status code 502'), {
          response: { status: 502 },
        }),
      ),
    );
    const response = createResponse();

    await new WazuhApiCtrl().makeRequest(
      createContext(request),
      'GET',
      '/agents',
      { devTools: true },
      'default',
      response,
    );

    const { statusCode, body } = response.custom.mock.calls[0][0];
    expect(statusCode).toBe(502);
    expect(JSON.parse(body.toString())).toEqual({
      message: 'Request failed with status code 502',
    });
  });
});
