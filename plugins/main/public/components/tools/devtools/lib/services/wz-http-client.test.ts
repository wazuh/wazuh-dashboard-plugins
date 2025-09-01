import { WzHttpClient } from './wz-http-client';

jest.mock('../../../../../react-services', () => ({
  WzRequest: {
    apiReq: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WzRequest } = require('../../../../../react-services');

describe('WzHttpClient', () => {
  const client = new WzHttpClient();

  beforeEach(() => {
    (WzRequest.apiReq as jest.Mock).mockReset();
  });

  it('delegates en WzRequest.apiReq (happy path)', async () => {
    (WzRequest.apiReq as jest.Mock).mockResolvedValue({ status: 200, data: { ok: true } });
    const res = await client.request('POST', '/path', { a: 1 }, { returnOriginalResponse: true });
    expect(WzRequest.apiReq).toHaveBeenCalledWith('POST', '/path', { a: 1 }, { returnOriginalResponse: true });
    expect(res).toEqual({ status: 200, data: { ok: true } });
  });
});

