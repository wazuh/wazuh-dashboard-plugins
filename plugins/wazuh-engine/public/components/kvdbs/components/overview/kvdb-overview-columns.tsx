import React, { useState } from 'react';
import { EuiConfirmModal } from '@elastic/eui';
import { ResourcesHandler } from '../../../../controllers/resources-handler';

export const columns = (setIsFlyoutVisible, setKeysRequest) => {
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [getActualDB, setActualDB] = useState(null);
  let modal;

  if (isDeleteModalVisible) {
    modal = (
      <EuiConfirmModal
        title='Do this thing'
        onCancel={() => {
          setIsDeleteModalVisible(false);
        }}
        onConfirm={async () => {
          await resourcesHandler.deleteFile(
            getActualDB.filename || getActualDB.name,
          );
          setIsDeleteModalVisible(false);
        }}
        cancelButtonText="No, don't do it"
        confirmButtonText='Yes, do it'
        defaultFocusedButton='confirm'
      >
        <p>Are you sure?</p>
      </EuiConfirmModal>
    );
  }
  const resourcesHandler = new ResourcesHandler('lists');

  return [
    {
      field: 'date',
      name: 'Date',
      align: 'left',
      sortable: true,
    },
    {
      field: 'filename',
      name: 'Name',
      align: 'left',
      sortable: true,
    },
    {
      field: 'description',
      name: 'Description',
      align: 'left',
      sortable: true,
    },
    {
      field: 'relative_dirname',
      name: 'Path',
      align: 'left',
      sortable: true,
    },
    {
      field: 'elements',
      name: 'Elements',
      align: 'left',
      sortable: true,
    },
    {
      field: '',
      name: 'Actions',
      align: 'left',
      sortable: true,
      actions: [
        {
          name: 'View',
          isPrimary: true,
          description: 'View details',
          icon: 'eye',
          type: 'icon',
          onClick: async item => {
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
          'data-test-subj': 'action-view',
        },
        {
          name: 'Edit',
          isPrimary: true,
          description: 'Edit database',
          icon: 'pencil',
          type: 'icon',
          onClick: async item => {},
          'data-test-subj': 'action-edit',
        },
        {
          name: 'Delete',
          isPrimary: true,
          description: 'Delete database',
          icon: 'trash',
          type: 'icon',
          onClick: async item => {
            setActualDB(item);
            setIsDeleteModalVisible(true);
          },
          'data-test-subj': 'action-delete',
        },
        {
          name: 'Import',
          isPrimary: true,
          description: 'Import database',
          icon: 'eye',
          type: 'icon',
          onClick: async item => {},
          'data-test-subj': 'action-import',
        },
      ],
    },
  ];
};
