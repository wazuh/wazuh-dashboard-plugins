import { ApiRoutesService } from './routes-service';

jest.mock('../../../../../react-services', () => ({
  GenericRequest: {
    request: jest.fn(),
  },
}));

const { GenericRequest } = require('../../../../../react-services');

describe('ApiRoutesService', () => {
  const service = new ApiRoutesService();

  beforeEach(() => {
    (GenericRequest.request as jest.Mock).mockReset();
  });

  it('returns data when no error (happy path)', async () => {
    (GenericRequest.request as jest.Mock).mockResolvedValue({
      data: [{ path: '/a' }],
    });

    const res = await service.getAvailableRoutes();
    expect(GenericRequest.request).toHaveBeenCalledWith(
      'GET',
      '/api/routes',
      {},
    );
    expect(res).toEqual([{ path: '/a' }]);
  });

  it('returns [] when response.error is present (error path)', async () => {
    (GenericRequest.request as jest.Mock).mockResolvedValue({
      error: 'boom',
      data: [{ path: '/a' }],
    });

    const res = await service.getAvailableRoutes();
    expect(res).toEqual([]);
  });
});
