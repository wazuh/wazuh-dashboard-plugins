import React, { useState } from 'react';
import { columns } from './kvdb-columns';
import { ResourcesHandler } from '../../../controllers/resources-handler';
import { EuiFlyout } from '@elastic/eui';
import { KeyInfo } from './keys/key-info';
import { getServices } from '../../../services';

export const KVDBTable = ({ TableWzAPI }) => {
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const [getKeysRequest, setKeysRequest] = useState(false);
  const resourcesHandler = new ResourcesHandler('lists');
  const WzRequest = getServices().WzRequest;
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

  /**
   * Columns and Rows properties
   */
  const getRowProps = item => {
    const { id, name } = item;

    return {
      'data-test-subj': `row-${id || name}`,
      className: 'customRowClass',
      onClick: async ev => {
        const result = await resourcesHandler.getFileContent(
          item.filename,
          item.relative_dirname,
        );
        const file = {
          name: item.filename,
          content: result,
          path: item.relative_dirname,
        };
        setKeysRequest(file);
        setIsFlyoutVisible(true);
      },
    };
  };

  const closeFlyout = () => setIsFlyoutVisible(false);

  const ManageFiles = getServices().actionButtons.manageFiles;
  const AddNewFileButton = getServices().actionButtons.addNewFileButton;
  const AddNewCdbListButton = getServices().actionButtons.addNewCdbListButton;
  const UploadFilesButton = getServices().actionButtons.uploadFilesButton;
  const actionButtons = [
    <ManageFiles section={'lists'} />,
    <AddNewFileButton section={'lists'} />,
    <AddNewCdbListButton section={'lists'} />,
    <UploadFilesButton section={'lists'} />,
  ];

  return (
    <>
      <TableWzAPI
        title='Databases'
        description='From here you can manage your keys databases.'
        actionButtons={actionButtons}
        tableColumns={columns}
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
        rowProps={getRowProps}
        tablePageSizeOptions={[10, 25, 50, 100]}
      />
      {isFlyoutVisible && (
        <EuiFlyout onClose={closeFlyout}>
          <KeyInfo
            keys={getKeysRequest}
            setKeysRequest={setKeysRequest}
          ></KeyInfo>
        </EuiFlyout>
      )}
    </>
  );
};
