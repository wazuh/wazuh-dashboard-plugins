/*
 * Wazuh app - Unit test for ErrorOrchestratorUI.
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
import { ErrorOrchestratorUI } from './error-orchestrator-ui';
import loglevel from 'loglevel';

const options: UIErrorLog = {
  context: 'unitTest',
  level: 'INFO',
  severity: 'UI',
  display: true,
  store: false,
  error: {
    error: 'Testing loglevel INFO',
    message: 'Message loglevel INFO',
    title: 'title jest testing1',
  },
};

describe('Wazuh Error Orchestrator UI', () => {
  describe('Given a valid options params for log INFO', () => {
    it('Should be called loglevelInfo', () => {
      const mockLoglevelInfo = loglevel.info = jest.fn();
      const mockError = 'Testing loglevel INFO';
      const mockMessage = 'Message loglevel INFO';

      const errorOrchestratorUI: ErrorOrchestrator = new ErrorOrchestratorUI();
      errorOrchestratorUI.loadErrorLog(options);

      expect(mockLoglevelInfo).toBeCalled();
      expect(mockLoglevelInfo).toBeCalledWith(mockMessage, mockError);
      expect(mockLoglevelInfo).toBeCalledTimes(1);
    });
  });

  describe('Given a valid options params for log WARNING', () => {
    it('Should be called loglevelWarning', () => {
      options.level = 'WARNING';
      options.error.error = 'Testing loglevel WARNING';
      options.error.message = 'Message loglevel WARNING';

      const mockError = 'Testing loglevel WARNING';
      const mockMessage = 'Message loglevel WARNING';

      const mockLoglevelWarning = loglevel.warn = jest.fn();

      const errorOrchestratorUI: ErrorOrchestrator = new ErrorOrchestratorUI();
      errorOrchestratorUI.loadErrorLog(options);

      expect(mockLoglevelWarning).toBeCalled();
      expect(mockLoglevelWarning).toBeCalledWith(mockMessage, mockError);
      expect(mockLoglevelWarning).toBeCalledTimes(1);
    });
  });

  describe('Given a valid options params for log ERROR', () => {
    it('Should be called loglevelError', () => {
      options.level = 'ERROR';
      options.error.error = 'Testing loglevel ERROR';
      options.error.message = 'Message loglevel ERROR';

      const mockError = 'Testing loglevel ERROR';
      const mockMessage = 'Message loglevel ERROR';

      const mockLoglevelError = loglevel.error = jest.fn();

      const errorOrchestratorUI: ErrorOrchestrator = new ErrorOrchestratorUI();
      errorOrchestratorUI.loadErrorLog(options);

      expect(mockLoglevelError).toBeCalled();
      expect(mockLoglevelError).toBeCalledWith(mockMessage, mockError);
      expect(mockLoglevelError).toBeCalledTimes(1);
    });
  });
});
