import { UiLogsCtrl } from './ui.logs.controller';
const readLastLines = require('read-last-lines');

const buildMockResponse = () => {
  const res = {};
  res.ok = jest.fn().mockReturnValue(res);
  return res;
};

describe('Spec UiLogsCtrl', function () {
  describe('Check method getUiLogs ', () => {
    it('Should 200 and return correct value', async () => {
      const result = { body: { error: 0, rawLogs: ['my test mocked'] } };
      const mockResponse = buildMockResponse();
      const spyRead = jest.spyOn(readLastLines, 'read');
      spyRead.mockReturnValue('my test mocked');

      const controller = new UiLogsCtrl();
      await controller.getUiLogs(mockResponse);

      expect(mockResponse.ok).toHaveBeenCalledTimes(1);
      expect(mockResponse.ok.mock.calls.length).toBe(1);
      expect(mockResponse.ok).toHaveBeenCalledWith(result);
    });
  });
});
