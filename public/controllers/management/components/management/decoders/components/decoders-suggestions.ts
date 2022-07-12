import { WzRequest } from '../../../../../../react-services/wz-request';

const decodersItems = [
  {
    type: 'params',
    label: 'filename',
    description: 'Filters the decoders by file name.',
    values: async value => {
      const filter = { limit: 30 };
      if (value) {
        filter['search'] = value;
      }
      const result = await WzRequest.apiReq('GET', '/decoders/files', filter);
      return (((result || {}).data || {}).data || {}).affected_items.map((item) => { return item.filename });
    },
  },
  {
    type: 'params',
    label: 'relative_dirname',
    description: 'Path of the decoders files.',
    values: async () => {
      const result = await WzRequest.apiReq('GET', '/manager/configuration', {
        params: {
          section: 'ruleset',
          field: 'decoder_dir'
        }
      });
      return (((result || {}).data || {}).data || {}).affected_items[0].ruleset.decoder_dir;
    }
  },
  {
    type: 'params',
    label: 'status',
    description: 'Filters the decoders by status.',
    values: ['enabled', 'disabled']
  }
];

const apiSuggestsItems = {
  items: decodersItems,
  files: [],
};

export default apiSuggestsItems;