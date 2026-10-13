import { UiLogsCtrl, sanitizeLogText } from './ui-logs.controller';

const buildMockLogger = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const buildMockContext = (logger = buildMockLogger()) => {
  return {
    wazuh: {
      logger: {
        get() {
          return logger;
        },
      },
    },
  };
};

const buildMockResponse = () => {
  const res = {};
  res.ok = jest.fn().mockReturnValue(res);
  res.customError = jest.fn().mockReturnValue(res);
  return res;
};

const buildMockRequest = () => {
  const req = {};
  req.body = jest.fn().mockReturnValue(req);
  req.params = jest.fn().mockReturnValue(req);
  return req;
};

const okResult = {
  body: { error: 0, message: 'Log has been added', statusCode: 200 },
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

    it('Should replace control characters in message and location before logging (CWE-117)', async () => {
      const logger = buildMockLogger();
      const mockContext = buildMockContext(logger);
      const mockResponse = buildMockResponse();
      const mockRequest = buildMockRequest();
      mockRequest.body = {
        level: 'info',
        message: 'line1\nforged\rline\tTab\x1b[31mred',
        location: 'Loc\nation\x00',
      };

      const controller = new UiLogsCtrl();
      await controller.createUiLogs(mockContext, mockRequest, mockResponse);

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        'Loc ation : line1 forged line Tab [31mred',
      );
      expect(mockResponse.ok).toHaveBeenCalledWith(okResult);
    });

    it('Should fall back to error level when level is not allow-listed', () => {
      const logger = buildMockLogger();
      const mockContext = buildMockContext(logger);
      const mockResponse = buildMockResponse();
      const mockRequest = buildMockRequest();
      mockRequest.body = {
        level: 'log',
        message: 'Message example',
        location: 'Location example',
      };

      const controller = new UiLogsCtrl();
      expect(() =>
        controller.createUiLogs(mockContext, mockRequest, mockResponse),
      ).not.toThrow();

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Location example: Message example',
      );
      expect(mockResponse.ok).toHaveBeenCalledWith(okResult);
    });

    it('Should not index the logger with arbitrary keys', async () => {
      const logger = buildMockLogger();
      logger.constructor = jest.fn();
      const mockContext = buildMockContext(logger);
      const mockResponse = buildMockResponse();
      const mockRequest = buildMockRequest();
      mockRequest.body = {
        level: 'constructor',
        message: 'Message example',
        location: 'Location example',
      };

      const controller = new UiLogsCtrl();
      await controller.createUiLogs(mockContext, mockRequest, mockResponse);

      expect(logger.constructor).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(mockResponse.ok).toHaveBeenCalledWith(okResult);
    });

    it('Should honour the debug level', async () => {
      const logger = buildMockLogger();
      const mockContext = buildMockContext(logger);
      const mockResponse = buildMockResponse();
      const mockRequest = buildMockRequest();
      mockRequest.body = {
        level: 'debug',
        message: 'Message example',
        location: 'Location example',
      };

      const controller = new UiLogsCtrl();
      await controller.createUiLogs(mockContext, mockRequest, mockResponse);

      expect(logger.debug).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith(
        'Location example: Message example',
      );
      expect(logger.error).not.toHaveBeenCalled();
      expect(mockResponse.ok).toHaveBeenCalledWith(okResult);
    });
  });

  describe('sanitizeLogText', () => {
    it('Should replace every C0 control character and DEL with a single space', () => {
      expect(sanitizeLogText('a\x00b\x1Fc\x7Fd')).toBe('a b c d');
      expect(sanitizeLogText('\n\r\t')).toBe('   ');
    });

    it('Should keep printable text untouched', () => {
      expect(sanitizeLogText('plain text: ok!')).toBe('plain text: ok!');
    });
  });
});
