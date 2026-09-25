import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'wazuh.case.status',
    placeholder: i18n.translate(
      'wazuh.caseManagement.casesFilters.statusPlaceholder',
      {
        defaultMessage: 'Status',
      },
    ),
  },
  {
    type: 'multiSelect',
    key: 'wazuh.case.severity',
    placeholder: i18n.translate(
      'wazuh.caseManagement.casesFilters.severityPlaceholder',
      {
        defaultMessage: 'Severity',
      },
    ),
  },
  {
    type: 'multiSelect',
    key: 'wazuh.case.priority',
    placeholder: i18n.translate(
      'wazuh.caseManagement.casesFilters.priorityPlaceholder',
      {
        defaultMessage: 'Priority',
      },
    ),
  },
  {
    type: 'multiSelect',
    key: 'wazuh.case.user.name',
    placeholder: i18n.translate(
      'wazuh.caseManagement.casesFilters.userPlaceholder',
      {
        defaultMessage: 'User',
      },
    ),
  },
];
