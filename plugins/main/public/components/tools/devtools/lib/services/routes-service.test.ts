import { ApiRoutesService } from './routes-service';

jest.mock('../../../../../react-services', () => ({
  GenericRequest: {
    request: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { GenericRequest } = require('../../../../../react-services');

describe('ApiRoutesService', () => {
  const service = new ApiRoutesService();

  beforeEach(() => {
    (GenericRequest.request as jest.Mock).mockReset();
  });

  it('retorna data cuando no hay error (happy path)', async () => {
    (GenericRequest.request as jest.Mock).mockResolvedValue({
      data: [{ path: '/a' }],
    });

    const res = await service.getAvailableRoutes();
    expect(GenericRequest.request).toHaveBeenCalledWith('GET', '/api/routes', {});
    expect(res).toEqual([{ path: '/a' }]);
  });

  it('retorna [] cuando response.error está presente (error path)', async () => {
    (GenericRequest.request as jest.Mock).mockResolvedValue({
      error: 'boom',
      data: [{ path: '/a' }],
    });

    const res = await service.getAvailableRoutes();
    expect(res).toEqual([]);
  });
});

