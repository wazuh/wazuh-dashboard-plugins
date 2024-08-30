/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { checkErrorType } from '../helpers';

describe('Test collecting metrics', () => {
  // TODO: need more tests

  test('check error type', () => {
    const badRequestError = {
      statusCode: 400,
    };
    const serverError = {
      statusCode: 500,
    };
    const unknownError = {
      statusCode: undefined,
    };
    const userErrorType = checkErrorType(badRequestError);
    const sysErrorType = checkErrorType(serverError);
    const unknownErrorType = checkErrorType(unknownError);
    expect(userErrorType).toEqual('user_error');
    expect(sysErrorType).toEqual('system_error');
    expect(unknownErrorType).toEqual('system_error');
  });
});
