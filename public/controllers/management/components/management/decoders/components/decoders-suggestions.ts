import { WzRequest } from '../../../../../../react-services/wz-request';

const decodersItems = {
  field(currentValue) {
    return [
      {label: 'filename', description: 'filter by filename'},
      {label: 'relative_dirname', description: 'filter by relative path'},
      {label: 'status', description: 'filter by status'},
    ];
  },
  value: async (currentValue, { field }) => {
    try{ // TODO: distinct
      switch(field){
        case 'filename': {
          const filter = { limit: 30 };
          if (value) {
            filter['search'] = value;
          }
          const result = await WzRequest.apiReq('GET', '/decoders/files', filter);
          return result?.data?.data?.affected_items.map(item => ({label: item.filename}));
        }
        case 'relative_dirname': {
          const result = await WzRequest.apiReq('GET', '/manager/configuration', {
            params: {
              section: 'ruleset',
              field: 'decoder_dir'
            }
          });
          return result?.data?.data?.affected_items[0].ruleset.decoder_dir.map(label => ({label}));
        }
        case 'status': {
          return ['enabled', 'disabled'].map(label => ({label}));
        }
        default: {
          return [];
        }
      }
    }catch(error){
      return [];
    };
  },
};

const decodersFiles = {
  field(currentValue) {
    return []; // TODO: fields
  },
  value: async (currentValue, { field }) => {
    try{ // TODO: distinct
      return [];
    }catch(error){
      return [];
    };
  },
};

const apiSuggestsItems = {
  items: decodersItems,
  files: decodersFiles,
};

export default apiSuggestsItems;