import React, { useState } from 'react';
import { columns } from './kvdb-overview-columns';
import { EuiButtonEmpty } from '@elastic/eui';
import { KeyInfo } from '../keys/key-info';
import { getServices } from '../../../../services';
import { EngineFlyout } from '../../../../common/flyout';

export const KVDBTable = ({ TableWzAPI }) => {
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [getKeysRequest, setKeysRequest] = useState(false);
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
      aria-label='Add New KVDB'
      iconType='plusInCircle'
      onClick={() => {
        navigationService.getInstance().navigate('/engine/kvdbs/new');
      }}
    >
      Add new database
    </EuiButtonEmpty>,
  ];

  return (
    <>
      <TableWzAPI
        title='Databases'
        description='From here you can manage your keys databases.'
        actionButtons={actionButtons}
        tableColumns={columns(setIsFlyoutVisible, setKeysRequest)}
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
                const response = await WzRequest.apiReq('GET', '/lists', {
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
        endpoint={'/lists'}
        isExpandable={true}
        downloadCsv
        showReload
        tablePageSizeOptions={[10, 25, 50, 100]}
      />
      {isFlyoutVisible && (
        <EngineFlyout
          onClose={closeFlyout}
          children={
            <KeyInfo
              keys={getKeysRequest}
              setKeysRequest={setKeysRequest}
            ></KeyInfo>
          }
        ></EngineFlyout>
      )}
    </>
  );
};
