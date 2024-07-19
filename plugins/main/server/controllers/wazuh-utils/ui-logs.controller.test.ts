import { UiLogsCtrl } from './ui-logs.controller';

const buildMockContext = () => {
  return {
    wazuh: {
      logger: {
        get() {
          return {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          };
        },
      },
    },
  };
};

const buildMockResponse = () => {
  const res = {};
  res.ok = jest.fn().mockReturnValue(res);
  return res;
};

const buildMockRequest = () => {
  const req = {};
  req.body = jest.fn().mockReturnValue(req);
  req.params = jest.fn().mockReturnValue(req);
  return req;
};

describe('Spec UiLogsCtrl', function () {
  describe('Check method getUiLogs ', () => {
    it('Should 200 and return message Log has been added', async () => {
      const result = {
        body: { error: 0, message: 'Log has been added', statusCode: 200 },
      };

      const mockContext = buildMockContext();
      const mockResponse = buildMockResponse();
      const mockRequest = buildMockRequest();
      mockRequest.body = {
        level: 'error',
        message: 'Message example',
        location: 'Location example',
      };

      const controller = new UiLogsCtrl();
      await controller.createUiLogs(mockContext, mockRequest, mockResponse);

      expect(mockResponse.ok).toHaveBeenCalledTimes(1);
      expect(mockResponse.ok.mock.calls.length).toBe(1);
      expect(mockResponse.ok).toHaveBeenCalledWith(result);
    });
  });
});
