import { WzRequest } from '../../../../../../react-services/wz-request';

const rulesItems = [
  {
    type: 'params',
    label: 'status',
    description: 'Filters the rules by status.',
    values: ['enabled', 'disabled']
  },
  {
    type: 'params',
    label: 'group',
    description: 'Filters the rules by group',
    values: async value => {
      const filter = { limit: 30 };
      if (value) {
        filter['search'] = value;
      }
      const result = await WzRequest.apiReq('GET', '/rules/groups', filter);
      return result?.data?.data?.affected_items;
    },
  },
  {
    type: 'params',
    label: 'level',
    description: 'Filters the rules by level',
    values: [...Array(16).keys()]
  },
  {
    type: 'params',
    label: 'filename',
    description: 'Filters the rules by file name.',
    values: async value => {
      const filter = { limit: 30 };
      if (value) {
        filter['search'] = value;
      }
      const result = await WzRequest.apiReq('GET', '/rules/files', filter);
      return result?.data?.data?.affected_items?.map((item) => { return item.filename });
    },
  },
  {
    type: 'params',
    label: 'relative_dirname',
    description: 'Path of the rules files',
    values: async () => {
      const result = await WzRequest.apiReq('GET', '/manager/configuration', {
        params: {
          section: 'ruleset',
          field: 'rule_dir'
        }
      });
      return result?.data?.data?.affected_items?.[0].ruleset.rule_dir;
    }
  },
  {
    type: 'params',
    label: 'hipaa',
    description: 'Filters the rules by HIPAA requirement',
    values: async () => {
      const result = await WzRequest.apiReq('GET', '/rules/requirement/hipaa', {});
      return result?.data?.data?.affected_items;
    }
  },
  {
    type: 'params',
    label: 'gdpr',
    description: 'Filters the rules by GDPR requirement',
    values: async () => {
      const result = await WzRequest.apiReq('GET', '/rules/requirement/gdpr', {});
      return result?.data?.data?.affected_items;
    }
  },
  {
    type: 'params',
    label: 'nist-800-53',
    description: 'Filters the rules by NIST requirement',
    values: async () => {
      const result = await WzRequest.apiReq('GET', '/rules/requirement/nist-800-53', {});
      return result?.data?.data?.affected_items;
    }
  },
  {
    type: 'params',
    label: 'gpg13',
    description: 'Filters the rules by GPG requirement',
    values: async () => {
      const result = await WzRequest.apiReq('GET', '/rules/requirement/gpg13', {});
      return result?.data?.data?.affected_items;
    }
  },
  {
    type: 'params',
    label: 'pci_dss',
    description: 'Filters the rules by PCI DSS requirement',
    values: async () => {
      const result = await WzRequest.apiReq('GET', '/rules/requirement/pci_dss', {});
      return result?.data?.data?.affected_items;
    }
  },
  {
    type: 'params',
    label: 'tsc',
    description: 'Filters the rules by TSC requirement',
    values: async () => {
      const result = await WzRequest.apiReq('GET', '/rules/requirement/tsc', {});
      return result?.data?.data?.affected_items;
    }
  },
  {
    type: 'params',
    label: 'mitre',
    description: 'Filters the rules by MITRE requirement',
    values: async () => {
      const result = await WzRequest.apiReq('GET', '/rules/requirement/mitre', {});
      return result?.data?.data?.affected_items;
    }
  }
];
const rulesFiles = [
  {
    type: 'params',
    label: 'filename',
    description: 'Filters the rules by file name.',
    values: async value => {
      const filter = { limit: 30 };
      if (value) {
        filter['search'] = value;
      }
      const result = await WzRequest.apiReq('GET', '/rules/files', filter);
      return result?.data?.data?.affected_items?.map((item) => { return item.filename });
    },
  },
];

const apiSuggestsItems = {
  items: rulesItems,
  files: rulesFiles,
};

export default apiSuggestsItems;
