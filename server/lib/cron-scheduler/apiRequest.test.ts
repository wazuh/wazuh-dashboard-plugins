import axios from 'axios';
import { ApiRequest, IApi } from './index'
jest.mock('axios');

describe('ApiRequest', () => {
  const apiExample1:IApi = {
    id: 'default',
    user: 'foo',
    password: 'bar',
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
      data: { error: 0, data: 'v3.12.0' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }
    axios.mockResolvedValue(mockResponse);
    
    const apiRequest = new ApiRequest('/version', apiExample1);
    const response = await apiRequest.getData();

    expect(response).toEqual(mockResponse.data);    
  });

  test('should return the object with the error when the path is invalid', async () => {
    const mockResponse = {
      response: {
        data: { 
          error: 603,
          message: 'The requested URL was not found on this server' },
          status: 404,
          statusText: 'Not Found',
          headers: {},
          config: {},
      }
    }
    axios.mockRejectedValue(mockResponse);

    const apiRequest = new ApiRequest('/versio', apiExample1);
    const response = await apiRequest.getData();

    expect(response).toEqual(mockResponse.response.data);
  })

  test('should ', async () => {
    const apiRequest = new ApiRequest('/version', apiExample1);
    const response = await apiRequest.makeRequest();
  });
  
  // test('should throw an error when the api user are invalid', () => {
  //   expect(true).toBe(false);
  // })
  
  // test('should throw an error when the port api are invalid', () => {
  //   expect(true).toBe(false);
  // })
  
  // test('should throw an error when the url api are invalid', () => {
  //   expect(true).toBe(false);
  // })

})