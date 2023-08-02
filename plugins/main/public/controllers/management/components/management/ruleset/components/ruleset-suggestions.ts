import { WzRequest } from '../../../../../../react-services/wz-request';

const rulesItems = {
  field(currentValue) {
    return [
      { label: 'id', description: 'filter by ID' },
      { label: 'filename', description: 'filter by filename' },
      { label: 'gdpr', description: 'filter by GDPR requirement' },
      { label: 'gpg13', description: 'filter by GPG requirement' },
      { label: 'groups', description: 'filter by group' },
      { label: 'hipaa', description: 'filter by HIPAA requirement' },
      { label: 'level', description: 'filter by level' },
      { label: 'mitre', description: 'filter by MITRE ATT&CK requirement' },
      { label: 'nist_800_53', description: 'filter by NIST requirement' },
      { label: 'pci_dss', description: 'filter by PCI DSS requirement' },
      { label: 'relative_dirname', description: 'filter by relative dirname' },
      { label: 'status', description: 'filter by status' },
      { label: 'tsc', description: 'filter by TSC requirement' },
    ];
  },
  value: async (currentValue, { field }) => {
    try {
      switch (field) {
        case 'id': {
          const filter = {
            distinct: true,
            limit: 30,
            select: field,
            sort: `+${field}`,
            ...(currentValue ? { q: `id~${currentValue}` } : {}),
          };
          const result = await WzRequest.apiReq('GET', '/rules', {
            params: filter,
          });
          return result?.data?.data?.affected_items.map(label => ({
            label: label[field],
          }));
        }
        case 'status': {
          return ['enabled', 'disabled'].map(label => ({ label }));
        }
        case 'groups': {
          const filter = {
            limit: 30,
            ...(currentValue ? { search: currentValue } : {}),
          };
          const result = await WzRequest.apiReq('GET', '/rules/groups', {
            params: filter,
          });
          return result?.data?.data?.affected_items.map(label => ({ label }));
        }
        case 'level': {
          return [...Array(16).keys()].map(label => ({ label }));
        }
        case 'filename': {
          const filter = {
            distinct: true,
            limit: 30,
            select: field,
            sort: `+${field}`,
            ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
          };
          const result = await WzRequest.apiReq('GET', '/rules/files', {
            params: filter,
          });
          return result?.data?.data?.affected_items?.map(item => ({
            label: item[field],
          }));
        }
        case 'relative_dirname': {
          const filter = {
            distinct: true,
            limit: 30,
            select: field,
            sort: `+${field}`,
            ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
          };
          const result = await WzRequest.apiReq('GET', '/rules', {
            params: filter,
          });
          return result?.data?.data?.affected_items.map(item => ({
            label: item[field],
          }));
        }
        case 'hipaa': {
          const filter = {
            limit: 30,
            ...(currentValue ? { search: currentValue } : {}),
          };
          const result = await WzRequest.apiReq(
            'GET',
            '/rules/requirement/hipaa',
            { params: filter },
          );
          return result?.data?.data?.affected_items.map(label => ({ label }));
        }
        case 'gdpr': {
          const filter = {
            limit: 30,
            ...(currentValue ? { search: currentValue } : {}),
          };
          const result = await WzRequest.apiReq(
            'GET',
            '/rules/requirement/gdpr',
            { params: filter },
          );
          return result?.data?.data?.affected_items.map(label => ({ label }));
        }
        case 'nist_800_53': {
          const filter = {
            limit: 30,
            ...(currentValue ? { search: currentValue } : {}),
          };
          const result = await WzRequest.apiReq(
            'GET',
            '/rules/requirement/nist-800-53',
            { params: filter },
          );
          return result?.data?.data?.affected_items.map(label => ({ label }));
        }
        case 'gpg13': {
          const filter = {
            limit: 30,
            ...(currentValue ? { search: currentValue } : {}),
          };
          const result = await WzRequest.apiReq(
            'GET',
            '/rules/requirement/gpg13',
            { params: filter },
          );
          return result?.data?.data?.affected_items.map(label => ({ label }));
        }
        case 'pci_dss': {
          const filter = {
            limit: 30,
            ...(currentValue ? { search: currentValue } : {}),
          };
          const result = await WzRequest.apiReq(
            'GET',
            '/rules/requirement/pci_dss',
            { params: filter },
          );
          return result?.data?.data?.affected_items.map(label => ({ label }));
        }
        case 'tsc': {
          const filter = {
            limit: 30,
            ...(currentValue ? { search: currentValue } : {}),
          };
          const result = await WzRequest.apiReq(
            'GET',
            '/rules/requirement/tsc',
            { params: filter },
          );
          return result?.data?.data?.affected_items.map(label => ({ label }));
        }
        case 'mitre': {
          const filter = {
            limit: 30,
            ...(currentValue ? { search: currentValue } : {}),
          };
          const result = await WzRequest.apiReq(
            'GET',
            '/rules/requirement/mitre',
            { params: filter },
          );
          return result?.data?.data?.affected_items.map(label => ({ label }));
        }
        default:
          return [];
      }
    } catch (error) {
      return [];
    }
  },
};

const rulesFiles = {
  field(currentValue) {
    return [
      { label: 'filename', description: 'filter by filename' },
      { label: 'relative_dirname', description: 'filter by relative dirname' },
    ];
  },
  value: async (currentValue, { field }) => {
    try {
      switch (field) {
        case 'filename': {
          const filter = {
            distinct: true,
            limit: 30,
            select: field,
            sort: `+${field}`,
            ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
          };
          const result = await WzRequest.apiReq('GET', '/rules/files', {
            params: filter,
          });
          return result?.data?.data?.affected_items?.map(item => ({
            label: item[field],
          }));
          break;
        }
        case 'relative_dirname': {
          const filter = {
            distinct: true,
            limit: 30,
            select: field,
            sort: `+${field}`,
            ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
          };
          const result = await WzRequest.apiReq('GET', '/rules', {
            params: filter,
          });
          return result?.data?.data?.affected_items.map(item => ({
            label: item[field],
          }));
        }
        default:
          return [];
      }
    } catch (error) {
      return [];
    }
  },
};

const apiSuggestsItems = {
  items: rulesItems,
  files: rulesFiles,
};

export default apiSuggestsItems;
