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
import { AxiosResponse } from 'axios';
import { WazuhApiError } from '../error-handler/errors';
import { ErrorFactory } from './error-factory';

describe('Error Factory', () => {
  it('Should return ERROR instance when receive an error', () => {
    const errorMessage = 'Error message';
    const error = new Error('Error message');
    const errorCreated = ErrorFactory.createError(error, Error);
    expect(errorCreated).toBeInstanceOf(Error);
    expect(errorCreated.name).toBe('Error');
    expect(errorCreated.message).toEqual(errorMessage);
    expect(errorCreated.stack).toBeTruthy();
    expect(typeof errorCreated).not.toBe('string');
  });

  it('Should return ERROR instance when receive a string', () => {
    const errorMessage = 'String message';
    const errorCreated = ErrorFactory.createError(errorMessage, Error);
    expect(errorCreated).toBeInstanceOf(Error);
    expect(errorCreated.name).toBe('Error');
    expect(errorCreated.message).toEqual(errorMessage);
    expect(errorCreated.stack).toBeTruthy();
    expect(typeof errorCreated).not.toBe('string');
  });

  it('Should return ERROR when receive and error with response property', () => {
    const response: AxiosResponse = {
      data: {
        statusCode: 500,
        error: 'Internal Server Error',
        message: '3099 - ERROR3099 - Wazuh not ready yet',
      },
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: {},
      request: {},
    };

    // creating an error with response property
    const error = new Error('Error');
    error['response'] = response;
    const errorCreated = ErrorFactory.createError(error, WazuhApiError);
    expect(errorCreated).toBeInstanceOf(Error);
    expect(errorCreated.name).toBe('WazuhApiError');
    expect(errorCreated.message).toEqual(response.data.message);
    expect(errorCreated.stack).toBeTruthy();
    expect(typeof errorCreated).not.toBe('string');
  });

  /* Todo: test that not create new error when receive an error for the same type
  it('Should return same ERROR instance when receive ErrorResponse, dont create a new error', () => {
    const errorResponseInstance = new Error('Error message');
    const errorReceived = ErrorFactory.createError(errorResponseInstance);
    const error = ErrorFactory.createError(errorReceived);
    expect(JSON.stringify(error)).toEqual(JSON.stringify(errorReceived));
    expect(error.message).toEqual(errorReceived.message);
    expect(error.name).toEqual(errorReceived.name);
    expect(error.stack).toEqual(errorReceived.stack);
  });
  */
});
