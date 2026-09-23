import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'interface.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.interfacesFilters.name.placeholder',
      { defaultMessage: 'Name' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'interface.state',
    placeholder: i18n.translate(
      'wazuh.itHygiene.interfacesFilters.state.placeholder',
      { defaultMessage: 'State' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'interface.type',
    placeholder: i18n.translate(
      'wazuh.itHygiene.interfacesFilters.type.placeholder',
      { defaultMessage: 'Type' },
    ),
  },
];
