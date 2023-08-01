import { WzRequest } from '../../../../../../react-services/wz-request';

const decodersItems = {
  field(currentValue) {
    return [
      { label: 'details.order', description: 'filter by program name' },
      { label: 'details.program_name', description: 'filter by program name' },
      { label: 'filename', description: 'filter by filename' },
      { label: 'name', description: 'filter by name' },
      { label: 'relative_dirname', description: 'filter by relative path' },
    ];
  },
  value: async (currentValue, { field }) => {
    try {
      switch (field) {
        case 'details.order': {
          const filter = {
            distinct: true,
            limit: 30,
            select: field,
            ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
          };
          const result = await WzRequest.apiReq('GET', '/decoders', {
            params: filter,
          });
          return (
            result?.data?.data?.affected_items
              // There are some affected items that doesn't return any value for the selected property
              ?.filter(item => typeof item?.details?.order === 'string')
              ?.map(item => ({
                label: item?.details?.order,
              }))
          );
        }
        case 'details.program_name': {
          const filter = {
            distinct: true,
            limit: 30,
            select: field,
            ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
          };
          const result = await WzRequest.apiReq('GET', '/decoders', {
            params: filter,
          });
          // FIX: this breaks the search bar component because returns a non-string value.
          return result?.data?.data?.affected_items
            ?.filter(item => item?.details?.program_name)
            .map(item => ({
              label: item?.details?.program_name,
            }));
        }
        case 'filename': {
          const filter = {
            distinct: true,
            limit: 30,
            select: field,
            sort: `+${field}`,
            ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
          };
          const result = await WzRequest.apiReq('GET', '/decoders/files', {
            params: filter,
          });
          return result?.data?.data?.affected_items?.map(item => ({
            label: item[field],
          }));
        }
        case 'name': {
          const filter = {
            distinct: true,
            limit: 30,
            select: field,
            sort: `+${field}`,
            ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
          };
          const result = await WzRequest.apiReq('GET', '/decoders', {
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
          const result = await WzRequest.apiReq('GET', '/decoders', {
            params: filter,
          });
          return result?.data?.data?.affected_items.map(item => ({
            label: item[field],
          }));
        }
        default: {
          return [];
        }
      }
    } catch (error) {
      return [];
    }
  },
};

const decodersFiles = {
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
          const result = await WzRequest.apiReq('GET', '/decoders/files', {
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
          const result = await WzRequest.apiReq('GET', '/decoders', {
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
  items: decodersItems,
  files: decodersFiles,
};

export default apiSuggestsItems;
