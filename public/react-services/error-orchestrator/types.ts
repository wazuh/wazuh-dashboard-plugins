/*
 * Wazuh app - Error logger types
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

type WARNING = 'WARNING';
type INFO = 'INFO';
type ERROR = 'ERROR';
export type UILogLevel = WARNING | INFO | ERROR;

type UI = 'UI';
type BUSINESS = 'BUSINESS';
type CRITICAL = 'CRITICAL';
export type UIErrorSeverity = UI | BUSINESS | CRITICAL;
export const UI_ERROR_SEVERITIES = {
  UI: 'UI',
  BUSINESS: 'BUSINESS',
  CRITICAL: 'CRITICAL',
};

export type UIError = {
  message: string;
  error: any;
  title?: string;
};

export type UIErrorLog = {
  context?: string;
  level: UILogLevel;
  severity: UIErrorSeverity;
  display?: boolean;
  store?: boolean;
  error: UIError;
};

export type ErrorOrchestrator = {
  loadErrorLog: (uiErrorLog: UIErrorLog) => void;
};
