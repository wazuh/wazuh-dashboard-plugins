import { RequestBuilder } from './request-builder';
import { WzHttpClient } from './wz-http-client';
import { ResponseHandler } from './response-handler';

jest.mock('../../../../../react-services', () => ({
  WzRequest: {
    apiReq: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WzRequest } = require('../../../../../react-services');

describe('DevTools services (integración)', () => {
  const builder = new RequestBuilder();
  const client = new WzHttpClient();
  const handler = new ResponseHandler();

  beforeEach(() => {
    (WzRequest.apiReq as jest.Mock).mockReset();
  });

  it('flujo: build -> http -> normalize', async () => {
    const group = {
      requestText:
        'POST /index/_search?pretty=true { "query": {"match_all":{}} }',
      requestTextJson: '',
      start: 0,
      end: 0,
    };

    const built = builder.build(group as any);

    // Respuesta simulada del cliente HTTP
    (WzRequest.apiReq as jest.Mock).mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: { took: 1, hits: { total: 0 } },
    });

    const raw = await client.request(built.method, built.path, built.body, {
      returnOriginalResponse: true,
    });
    const normalized = handler.normalize(raw);

    expect(WzRequest.apiReq).toHaveBeenCalledWith(
      'POST',
      '/index/_search',
      expect.objectContaining({ devTools: true }),
      { returnOriginalResponse: true },
    );
    expect(normalized).toEqual({
      body: { took: 1, hits: { total: 0 } },
      status: 200,
      statusText: 'OK',
      ok: true,
    });
  });
});
