import React, { useState } from 'react';
import { columns } from './decoders-overview-columns';
import { EuiButtonEmpty } from '@elastic/eui';
import { getServices } from '../../../../services';
import { DecodersDetails } from '../details/decoders-details';
import { EngineFlyout } from '../../../../common/flyout';

export const DecodersTable = () => {
  const TableWzAPI = getServices().TableWzAPI;
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [getDecodersRequest, setDecodersRequest] = useState(false);
  const WzRequest = getServices().WzRequest;
  const navigationService = getServices().navigationService;
  const closeFlyout = () => setIsFlyoutVisible(false);
  const searchBarWQLOptions = {
    searchTermFields: ['filename', 'relative_dirname'],
    filterButtons: [
      {
        id: 'relative-dirname',
        input: 'relative_dirname=etc/lists',
        label: 'Custom lists',
      },
    ],
  };

  const actionButtons = [
    <EuiButtonEmpty
      aria-label='Add new decoders file'
      iconType='plusInCircle'
      onClick={() => {
        navigationService.getInstance().navigate('/engine/decoders/new');
      }}
    >
      Add new decoders file
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      aria-label='Add new decoders file'
      iconType='importAction'
      onClick={() => {}}
    >
      Exports files
    </EuiButtonEmpty>,
  ];

  return (
    <div className='wz-inventory'>
      <TableWzAPI
        title='Decoders'
        description='From here you can manage your keys databases.'
        actionButtons={actionButtons}
        tableColumns={columns(setIsFlyoutVisible, setDecodersRequest)}
        tableInitialSortingField='filename'
        searchBarWQL={{
          options: searchBarWQLOptions,
          suggestions: {
            field(currentValue) {
              return [
                { label: 'filename', description: 'filter by filename' },
                {
                  label: 'relative_dirname',
                  description: 'filter by relative path',
                },
              ];
            },
            value: async (currentValue, { field }) => {
              try {
                const response = await WzRequest.apiReq('GET', '/decoders', {
                  params: {
                    distinct: true,
                    limit: 30,
                    select: field,
                    sort: `+${field}`,
                    ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
                  },
                });
                return response?.data?.data.affected_items.map(item => ({
                  label: item[field],
                }));
              } catch (error) {
                return [];
              }
            },
          },
        }}
        searchTable
        endpoint={'/decoders'}
        isExpandable={true}
        downloadCsv
        showFieldSelector
        showReload
        tablePageSizeOptions={[10, 25, 50, 100]}
      />
      {isFlyoutVisible && (
        <EngineFlyout
          onClose={closeFlyout}
          children={
            <DecodersDetails item={getDecodersRequest}></DecodersDetails>
          }
        ></EngineFlyout>
      )}
    </div>
  );
};