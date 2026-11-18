/*
 * Wazuh app - Case management option labels
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { i18n } from '@osd/i18n';
import {
  CasePriority,
  CaseSeverity,
  CaseStatus,
} from './case-management-service';

export const CASE_STATUS_OPTIONS: Array<{
  value: CaseStatus;
  text: string;
  description: string;
}> = [
  {
    value: 'active',
    text: i18n.translate('wazuh.common.caseManagementStatus.active', {
      defaultMessage: 'Active',
    }),
    description: i18n.translate(
      'wazuh.common.caseManagementStatus.activeDescription',
      { defaultMessage: 'Open. No one is working on it yet.' },
    ),
  },
  {
    value: 'acknowledged',
    text: i18n.translate('wazuh.common.caseManagementStatus.acknowledged', {
      defaultMessage: 'Acknowledged',
    }),
    description: i18n.translate(
      'wazuh.common.caseManagementStatus.acknowledgedDescription',
      { defaultMessage: 'Open. Someone is working on it.' },
    ),
  },
  {
    value: 'completed',
    text: i18n.translate('wazuh.common.caseManagementStatus.completed', {
      defaultMessage: 'Completed',
    }),
    description: i18n.translate(
      'wazuh.common.caseManagementStatus.completedDescription',
      { defaultMessage: 'Closed. No more work needed.' },
    ),
  },
  {
    value: 'audit',
    text: i18n.translate('wazuh.common.caseManagementStatus.audit', {
      defaultMessage: 'Audit',
    }),
    description: i18n.translate(
      'wazuh.common.caseManagementStatus.auditDescription',
      { defaultMessage: 'Kept for review or compliance.' },
    ),
  },
  {
    value: 'error',
    text: i18n.translate('wazuh.common.caseManagementStatus.error', {
      defaultMessage: 'Error',
    }),
    description: i18n.translate(
      'wazuh.common.caseManagementStatus.errorDescription',
      { defaultMessage: 'Marked as a mistake, for example a false positive.' },
    ),
  },
  {
    value: 'deleted',
    text: i18n.translate('wazuh.common.caseManagementStatus.deleted', {
      defaultMessage: 'Deleted',
    }),
    description: i18n.translate(
      'wazuh.common.caseManagementStatus.deletedDescription',
      { defaultMessage: 'Marked as removed. Kept for history.' },
    ),
  },
];

export const CASE_SEVERITY_OPTIONS: Array<{
  value: CaseSeverity;
  text: string;
}> = [
  {
    value: 'informational',
    text: i18n.translate('wazuh.common.caseManagementSeverity.informational', {
      defaultMessage: 'Informational',
    }),
  },
  {
    value: 'low',
    text: i18n.translate('wazuh.common.caseManagementSeverity.low', {
      defaultMessage: 'Low',
    }),
  },
  {
    value: 'medium',
    text: i18n.translate('wazuh.common.caseManagementSeverity.medium', {
      defaultMessage: 'Medium',
    }),
  },
  {
    value: 'high',
    text: i18n.translate('wazuh.common.caseManagementSeverity.high', {
      defaultMessage: 'High',
    }),
  },
  {
    value: 'critical',
    text: i18n.translate('wazuh.common.caseManagementSeverity.critical', {
      defaultMessage: 'Critical',
    }),
  },
];

export const EMPTY_OPTION = { value: '' as const, text: '—' };

export const CASE_PRIORITY_OPTIONS: Array<{
  value: CasePriority | '';
  text: string;
}> = [
  EMPTY_OPTION,
  {
    value: 'urgent',
    text: i18n.translate('wazuh.common.caseManagementPriority.urgent', {
      defaultMessage: 'Urgent',
    }),
  },
  {
    value: 'high',
    text: i18n.translate('wazuh.common.caseManagementPriority.high', {
      defaultMessage: 'High',
    }),
  },
  {
    value: 'medium',
    text: i18n.translate('wazuh.common.caseManagementPriority.medium', {
      defaultMessage: 'Medium',
    }),
  },
  {
    value: 'low',
    text: i18n.translate('wazuh.common.caseManagementPriority.low', {
      defaultMessage: 'Low',
    }),
  },
];
