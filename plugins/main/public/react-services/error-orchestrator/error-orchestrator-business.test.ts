/*
 * Wazuh app - Unit test for ErrorOrchestratorBusiness.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import { ErrorOrchestrator, UIErrorLog } from './types';
import { getToasts } from '../../kibana-services';
import { ErrorOrchestratorBusiness } from './error-orchestrator-business';
import { ErrorToastOptions } from 'kibana/public';

const options: UIErrorLog = {
  context: 'unitTest',
  level: 'INFO',
  severity: 'BUSINESS',
  display: true,
  store: false,
  error: {
    error: 'Testing toast INFO',
    message: 'Message toast INFO',
    title: 'title jest testing1',
  },
};

jest.mock('../../kibana-services', () => ({
  getToasts: () => ({
    addInfo: (mockError: string, toast: ErrorToastOptions) => {},
  }),
}));

describe.skip('Wazuh Error Orchestrator Business', () => {
  describe('Given a valid options params for display toast INFO', () => {
    it('Should be called toast and addInfo', () => {
      const toast = {
        title: 'title jest testing1',
        toastMessage: 'Message loglevel INFO',
        toastLifeTimeMs: 3000,
      };

      const mockError = 'Testing loglevel INFO';
      const mockMessage = 'Message loglevel INFO';
      const mockToastInfo = getToasts.prototype.addInfo = jest.fn();
      // const mockToastInfo = getToasts().addInfo(mockError, toast as ErrorToastOptions) = jest.fn();

      const errorOrchestratorBusiness: ErrorOrchestrator = new ErrorOrchestratorBusiness();
      errorOrchestratorBusiness.loadErrorLog(options);

      expect(mockToastInfo.getToasts().addInfo).toBeCalled();
      expect(mockToastInfo).toBeCalledWith(mockMessage, mockError);
      expect(mockToastInfo).toBeCalledTimes(1);
    });
  });

  // describe('Given a valid options params for display toast WARNING', () => {
  //   it('Should be called loglevelWarning', () => {
  //     options.level = 'WARNING';
  //     options.error.error = 'Testing loglevel WARNING';
  //     options.error.message = 'Message loglevel WARNING';
  //
  //     const mockError = 'Testing loglevel WARNING';
  //     const mockMessage = 'Message loglevel WARNING';
  //
  //     const mockLoglevelWarning = loglevel.warn = jest.fn();
  //
  //     const errorOrchestratorUI: ErrorOrchestrator = new ErrorOrchestratorUI();
  //     errorOrchestratorUI.loadErrorLog(options);
  //
  //     expect(mockLoglevelWarning).toBeCalled();
  //     expect(mockLoglevelWarning).toBeCalledWith(mockMessage, mockError);
  //     expect(mockLoglevelWarning).toBeCalledTimes(1);
  //   });
  // });
  //
  // describe('Given a valid options params for display toast ERROR', () => {
  //   it('Should be called loglevelError', () => {
  //     options.level = 'ERROR';
  //     options.error.error = 'Testing loglevel ERROR';
  //     options.error.message = 'Message loglevel ERROR';
  //
  //     const mockError = 'Testing loglevel ERROR';
  //     const mockMessage = 'Message loglevel ERROR';
  //
  //     const mockLoglevelError = loglevel.error = jest.fn();
  //
  //     const errorOrchestratorUI: ErrorOrchestrator = new ErrorOrchestratorUI();
  //     errorOrchestratorUI.loadErrorLog(options);
  //
  //     expect(mockLoglevelError).toBeCalled();
  //     expect(mockLoglevelError).toBeCalledWith(mockMessage, mockError);
  //     expect(mockLoglevelError).toBeCalledTimes(1);
  //   });
  // });
});
