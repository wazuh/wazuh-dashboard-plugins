/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const permissionsMissingToast = (action: string) => {
  return {
    title: 'Error ' + action,
    color: 'danger',
    iconType: 'alert',
    id: 'permissionsMissingErrorToast' + action.replace(' ', ''),
    text: (
      <p>Insufficient permissions. Reach out to your OpenSearch Dashboards administrator.</p>
    ),
  };
};

export const permissionsMissingActions = {
  CHANGE_SCHEDULE_STATUS: 'changing schedule status.',
  DELETE_REPORT_DEFINITION: 'deleting report definition.',
  GENERATING_REPORT: 'generating report.',
  LOADING_REPORTS_TABLE: 'loading reports table.',
  LOADING_DEFINITIONS_TABLE: 'loading report definitions table.',
  VIEWING_EDIT_PAGE: 'viewing edit page.',
  UPDATING_DEFINITION: 'updating report definition',
  CREATING_REPORT_DEFINITION: 'creating new report definition.',
};

export const timeRangeMatcher = /time:\(from:(.+?),to:(.+?)\)/;
