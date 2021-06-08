import { UiLogsCtrl } from './ui-logs.controller';
const readLastLines = require('read-last-lines');
import { WAZUH_UI_LOGS_RAW_FILENAME } from '../../../common/constants';

const buildMockResponse = () => {
  const res = {};
  res.ok = jest.fn().mockReturnValue(res);
  return res;
};

const buildMockRequest = () => {
  const req = {}
  req.body = jest.fn().mockReturnValue(req)
  req.params = jest.fn().mockReturnValue(req)
  return req
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

      it("Should 200 and return message Log has been added", async () => {
        const result = { body: { message: 'Log has been added'} };
        const mockResponse = buildMockResponse();
        const spyRead = jest.spyOn(readLastLines, 'read');
        spyRead.mockReturnValue('Log has been added');
  
        const mockRequest = buildMockRequest();
        mockRequest.body = {
          level: 'error',
          message: 'Message example',
          location: 'Location example'
        }
  
  
        const controller = new UiLogsCtrl();
        await controller.createUiLogs(mockRequest, mockResponse);
  
        expect(mockResponse.ok).toHaveBeenCalledTimes(1);
        expect(mockResponse.ok.mock.calls.length).toBe(1);
        expect(mockResponse.ok).toHaveBeenCalledWith(result);
      });

      it("Should return a Array logs", async () => {
        const controller = new UiLogsCtrl();
        let res = await controller.getUiFileLogs(WAZUH_UI_LOGS_RAW_FILENAME);
        
        expect(Array.isArray(res)).toBe(true);
  
      });

    });

});
