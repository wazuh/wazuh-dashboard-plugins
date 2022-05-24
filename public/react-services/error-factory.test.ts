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
import { ErrorFactory } from './error-factory';

describe('Error Factory', () => {
  it('Should return ERROR instance when receive an error', () => {
    const errorMessage = 'Error message';
    const error = new Error('Error message');
    const errorCreated = ErrorFactory.createError(error);
    expect(errorCreated).toBeInstanceOf(Error);
    expect(errorCreated.name).toBe('ResponseBaseError');
    expect(errorCreated.message).toEqual(errorMessage);
    expect(errorCreated.stack).toBeTruthy();
    expect(typeof errorCreated).not.toBe('string');
  });

  it('Should return ERROR instance when receive a string', () => {
    const errorMessage = 'String message';
    const errorCreated = ErrorFactory.createError(errorMessage);
    expect(errorCreated).toBeInstanceOf(Error);
    expect(errorCreated.name).toBe('ResponseBaseError');
    expect(errorCreated.message).toEqual(errorMessage);
    expect(errorCreated.stack).toBeTruthy();
    expect(typeof errorCreated).not.toBe('string');
  });
});
