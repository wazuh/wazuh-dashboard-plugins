import axios from 'axios';
import { ApiRequest, IApi } from './index'
jest.mock('axios');

describe('ApiRequest', () => {
  const apiExample1: IApi = {
    id: 'default',
    user: 'wazuh',
    password: 'wazuh',
    url: 'http://localhost',
    port: 55000,
    cluster_info: {
      manager: 'master',
      cluster: 'Disabled',
      status: 'disabled',
    },
  }
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should return the object with the data of the request ', async () => {
    const mockResponse = {
      data: { "enabled": "yes", "running": "yes" },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }
    axios.mockResolvedValue(mockResponse);

    const apiRequest = new ApiRequest('/cluster/status', apiExample1);
    const response = await apiRequest.getData();

    expect(response).toEqual(mockResponse.data);
  });

  test('should return the object with the error when the path is invalid', async () => {
    const mockResponse = {
      response: {
        data: {
          "type": "about:blank",
          "title": "Not Found",
          "detail": "Nothing matches the given URI",
          "status": 404
        },
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {},
      },
      status: 404
    };
    axios.mockRejectedValue(mockResponse);

    const apiRequest = new ApiRequest('/cluster/statu', apiExample1);
    try {
      await apiRequest.getData();
    } catch (error) {
      expect(error).toEqual({error: 404, message: "Nothing matches the given URI"});
    }
  })

  test('should throw an error when the port or url api are invalid', async () => {
    const mockResponse = {response: { data: { detail: 'ECONNREFUSED' }, status: 500} }
    axios.mockRejectedValue(mockResponse);

    const apiRequest = new ApiRequest('/cluster/status', apiExample1);
    try {
      await apiRequest.getData();
    } catch (error) {
      expect(error).toStrictEqual({error: 3005, message: 'Wazuh API is not reachable. Please check your url and port.'});
    }
  })

  test('should throw an error when the url api are invalid', async () => {
    const mockResponse = {response: { data: { detail: 'ECONNRESET' }, status: 500} }
    axios.mockRejectedValue(mockResponse);
    const apiRequest = new ApiRequest('/cluster/status', apiExample1);
    try {
      await apiRequest.getData();
    } catch (error) {
      expect(error).toStrictEqual({error: 3005, message: 'Wrong protocol being used to connect to the Wazuh API'});
    }
  })

})