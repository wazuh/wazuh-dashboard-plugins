import { vulnerabilitiesI18n } from '../../i18n';

export default [
  {
    type: 'multiSelect',
    key: 'vulnerability.id',
    placeholder: vulnerabilitiesI18n.filterCves,
  },
  {
    type: 'multiSelect',
    key: 'vulnerability.severity',
    placeholder: vulnerabilitiesI18n.filterSeverity,
  },
  {
    type: 'multiSelect',
    key: 'package.name',
    placeholder: vulnerabilitiesI18n.filterPackageName,
  },
];
