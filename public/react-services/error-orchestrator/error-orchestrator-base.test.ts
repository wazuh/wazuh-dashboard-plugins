/*
 * Wazuh app - React test for ErrorOrchestratorBase.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import { ErrorOrchestratorBase } from './error-orchestrator-base';
import { UIErrorLog } from './types';

describe('Wazuh Error Orchestrator Base', () => {
  describe('Given a valid options params ', () => {
    it('Should be called displayError and storeError', () => {
      const options: UIErrorLog = {
        context: 'unitTest',
        level: 'ERROR',
        severity: 'UI',
        display: true,
        store: true,
        error: {
          error: 'error name test1',
          message: 'message test1',
          title: 'title jest testing1',
        },
      };
      const errorOrchestratorBase = new ErrorOrchestratorBase();
      const myDisplayError = (ErrorOrchestratorBase.prototype.displayError = jest.fn());
      const myStoreError = jest.spyOn(ErrorOrchestratorBase.prototype as any, 'storeError');
      myStoreError.mockImplementation(() => {})

      errorOrchestratorBase.loadErrorLog(options);

      expect(myDisplayError).toBeCalledTimes(1);
      expect(myStoreError).toBeCalledTimes(1);
    });
  });
});
