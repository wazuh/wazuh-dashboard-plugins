import { request, disableRequests } from "./request-handler";
import * as kibanaServices from '../kibana-services';

function waitTimeout(ms) {
  return new Promise((resolve) => setTimeout(() => resolve(true), ms));
}

const fetchFunction = async (url, options) => {
  if (url === '/invalidurl') {
    return Promise.reject('URL Not found')
  }
  else {
    return Promise.resolve('data')
  }
}
const coreExpected = {
  http: {
    fetch: fetchFunction
  }
}


describe('test request-handler', () => {
  beforeAll(() => {
    jest.spyOn(kibanaServices, 'getCore').mockReturnValue(coreExpected)
  })

  it('should resolve data', () => {
    const info = {
      method: 'GET',
      path: '/validurl',
    }
    expect(request(info)).resolves.toMatchObject({ "data": "data" })
  });

  it('should reject "URL Not found" error', () => {
    const info = {
      method: 'GET',
      path: '/invalidurl',
    }
    expect(request(info)).rejects.toBe('URL Not found')
  });

  it('should reject "Missing parameters" (no path)', () => {
    const info = {
      method: 'GET'
    }
    expect(request(info)).rejects.toBe('Missing parameters')
  });

  it('should reject "Missing parameters" (no method)', () => {
    const info = {
      path: '/validurl',
    }
    expect(request(info)).rejects.toBe('Missing parameters')
  });

  it('should reject "Missing parameters" (no parameters)', () => {
    expect(request()).rejects.toBe('Missing parameters')
  });

  it('should reject "Requests are disabled"', () => {
    disableRequests();
    const info = {
      method: 'GET',
      path: '/invalidurl',
    }
    expect(request(info)).rejects.toBe('Requests are disabled')

  });

});
