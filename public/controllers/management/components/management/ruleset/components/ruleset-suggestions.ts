import { WzRequest } from '../../../../../../react-services/wz-request';

const rulesItems = {
  field(currentValue) {
    return [
      {label: 'filename', description: 'filter by filename'},
      {label: 'gdpr', description: 'filter by GDPR requirement'},
      {label: 'gpg13', description: 'filter by GPG requirement'},
      {label: 'groups', description: 'filter by group'},
      {label: 'hipaa', description: 'filter by HIPAA requirement'},
      {label: 'level', description: 'filter by level'},
      {label: 'mitre', description: 'filter by MITRE ATT&CK requirement'},
      {label: 'pci_dss', description: 'filter by PCI DSS requirement'},
      {label: 'relative_dirname', description: 'filter by relative dirname'},
      {label: 'status', description: 'filter by status'},
      {label: 'tsc', description: 'filter by TSC requirement'},
      {label: 'nist-800-53', description: 'filter by NIST requirement'},
    ];
  },
  value: async (currentValue, { field }) => {
    try{ // TODO: distinct
      switch (field) {
        case 'status': {
          return ['enabled', 'disabled'].map(label => ({label}));
        }
        case 'groups': {
          const filter = { limit: 30 };
          if (currentValue) {
            filter['search'] = currentValue;
          }
          const result = await WzRequest.apiReq('GET', '/rules/groups', filter);
          return result?.data?.data?.affected_items.map(label => ({label}));
        }
        case 'level': {
          const filter = { limit: 30 };
          if (currentValue) {
            filter['search'] = currentValue;
          }
          const result = await WzRequest.apiReq('GET', '/rules/groups', filter);
          return [...Array(16).keys()].map(label => ({label}));
        }
        case 'filename': {
          const filter = { limit: 30 };
          if (currentValue) {
            filter['search'] = currentValue;
          }
          const result = await WzRequest.apiReq('GET', '/rules/files', filter);
          return result?.data?.data?.affected_items?.map((item) => ({label: item.filename}));
        }
        case 'relative_dirname': {
          const result = await WzRequest.apiReq('GET', '/manager/configuration', {
            params: {
              section: 'ruleset',
              field: 'rule_dir'
            }
          });
          return result?.data?.data?.affected_items?.[0].ruleset.rule_dir.map(label => ({label}));
        }
        case 'hipaa': {
          const result = await WzRequest.apiReq('GET', '/rules/requirement/hipaa', {});
          return result?.data?.data?.affected_items.map(label => ({label}));
        }
        case 'gdpr': {
          const result = await WzRequest.apiReq('GET', '/rules/requirement/gdpr', {});
          return result?.data?.data?.affected_items.map(label => ({label}));
        }
        case 'nist-800-53': {
          const result = await WzRequest.apiReq('GET', '/rules/requirement/nist-800-53', {});
          return result?.data?.data?.affected_items.map(label => ({label}));
        }
        case 'gpg13': {
          const result = await WzRequest.apiReq('GET', '/rules/requirement/gpg13', {});
          return result?.data?.data?.affected_items.map(label => ({label}));
        }
        case 'pci_dss': {
          const result = await WzRequest.apiReq('GET', '/rules/requirement/pci_dss', {});
          return result?.data?.data?.affected_items.map(label => ({label}));
        }
        case 'tsc': {
          const result = await WzRequest.apiReq('GET', '/rules/requirement/tsc', {});
          return result?.data?.data?.affected_items.map(label => ({label}));
        }
        case 'mitre': {
          const result = await WzRequest.apiReq('GET', '/rules/requirement/mitre', {});
          return result?.data?.data?.affected_items.map(label => ({label}));
        }
        default:
          return [];
      }
    }catch(error){
      return [];
    };
  },
};

const rulesFiles = {
  field(currentValue) {
    return ['filename'].map(label => ({label}));
  },
  value: async (currentValue, { field }) => {
    try{ // TODO: distinct
      switch (field) {
        case 'filename':{
          const filter = { limit: 30 };
          if (currentValue) {
            filter['search'] = currentValue;
          }
          const result = await WzRequest.apiReq('GET', '/rules/files', filter);
          return result?.data?.data?.affected_items?.map((item) => ({label: item.filename}));
          break;
        }
        default:
          return [];
      }
    }catch(error){
      return [];
    };
  },
};

const apiSuggestsItems = {
  items: rulesItems,
  files: rulesFiles,
};

export default apiSuggestsItems;
