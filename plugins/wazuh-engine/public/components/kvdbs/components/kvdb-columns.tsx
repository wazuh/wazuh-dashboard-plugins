import React, { useState } from 'react';
import { EuiButtonIcon, EuiConfirmModal } from '@elastic/eui';
import { ResourcesHandler } from '../../../controllers/resources-handler';

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
      name: 'Actions',
      align: 'left',
      render: item => {
        return (
          <>
            <EuiButtonIcon
              aria-label='Edit Button'
              iconType='eye'
              onClick={async () => {
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
              }}
            />
            <EuiButtonIcon
              aria-label='Delete Button'
              iconType='trash'
              onClick={async ev => {
                setActualDB(item);
                setIsDeleteModalVisible(true);
              }}
              color='danger'
            />
            <EuiButtonIcon
              aria-label='Export Button'
              iconType='exportAction'
              onClick={async ev => {
                ev.stopPropagation();
              }}
            />
            {modal}
          </>
        );
      },
    },
  ];
};
