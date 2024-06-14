/*
 * Wazuh app - Error handler service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { GenericRequest } from './generic-request';
import { AppState } from './app-state';

// axios
import axios, { AxiosResponse } from 'axios';
jest.mock('axios');
// kibana services
jest.mock('../kibana-services', () => ({
  ...(jest.requireActual('../kibana-services') as object),
  getHttp: jest.fn().mockReturnValue({
    basePath: {
      get: () => {
        return 'http://localhost:5601';
      },
      prepend: (url: string) => {
        return `http://localhost:5601${url}`;
      },
    },
  }),
  getWzCurrentAppID: jest.fn().mockReturnValue('wz-endpoints-summary'),
  getCookies: jest.fn(),
}));

// app state
jest.mock('./app-state');

jest.mock('./navigation-service', () => ({
  getInstance() {
    return {
      getPathname() {
        return '';
      },
      navigate() {},
    };
  },
}));

// mock window location
const mockResponse = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    hash: {
      endsWith: mockResponse,
      includes: mockResponse,
    },
    href: mockResponse,
    assign: mockResponse,
  },
  writable: true,
});

describe('Generic Request', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('Should return data when request is successfully completed', async () => {
    const resDataMocked = { data: [] };
    (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(
      Promise.resolve(resDataMocked as AxiosResponse),
    );
    let res = await GenericRequest.request('GET', '/api/request');
    expect(res).toEqual(resDataMocked);
  });

  it('Should return ERROR when method or path are empty', async () => {
    try {
      await GenericRequest.request(null, '/api/request');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error)
        expect(error.message).toBe('Missing parameters');
    }
  });

  it('Should return an instance ERROR when the request fails', async () => {
    const resError = new Error('Error message');
    (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(
      Promise.reject(resError),
    );
    const currentEmptyApiMock = JSON.stringify({});
    AppState.getCurrentAPI = jest.fn().mockReturnValue(currentEmptyApiMock);
    try {
      await GenericRequest.request('GET', '/api/request');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error?.stack).toBeTruthy();
        expect(error?.message).toEqual(resError.message);
        expect(error?.stack).toBeTruthy();
      }
      expect(typeof error).not.toBe('string');
    }
  });

  it('Should return an instance ERROR when the request fails and have invalid api id', async () => {
    const resError = new Error('Error message');
    (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(
      Promise.reject(resError),
    );
    const currentApiMock = JSON.stringify({ id: 'mocked-api-id' });
    AppState.getCurrentAPI = jest.fn().mockReturnValue(currentApiMock);
    try {
      await GenericRequest.request('GET', '/api/request');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.stack).toBeTruthy();
        expect(error.message).toEqual(resError.message);
        expect(error.stack).toBeTruthy();
      }
      expect(typeof error).not.toBe('string');
    }
  });
});
