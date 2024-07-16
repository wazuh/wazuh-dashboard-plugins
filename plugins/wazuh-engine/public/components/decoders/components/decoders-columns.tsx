import React from 'react';
import { EuiButtonIcon } from '@elastic/eui';

export const columns = (setIsFlyoutVisible, setDetailsRequest) => {
  return [
    {
      field: 'filename',
      name: 'Name',
      align: 'left',
      sortable: true,
    },
    {
      field: 'status',
      name: 'Status',
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
      field: 'position',
      name: 'Position',
      align: 'left',
      sortable: true,
    },
    {
      field: 'details.order',
      name: 'Order',
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
                const file = {
                  name: item.filename,
                  path: item.relative_dirname,
                  details: item.details,
                };
                setDetailsRequest(file);
                setIsFlyoutVisible(true);
              }}
            />
          </>
        );
      },
    },
  ];
};

export const colors = [
  '#004A65',
  '#00665F',
  '#BF4B45',
  '#BF9037',
  '#1D8C2E',
  'BB3ABF',
  '#00B1F1',
  '#00F2E2',
  '#7F322E',
  '#7F6025',
  '#104C19',
  '7C267F',
  '#0079A5',
  '#00A69B',
  '#FF645C',
  '#FFC04A',
  '#2ACC43',
  'F94DFF',
  '#0082B2',
  '#00B3A7',
  '#401917',
  '#403012',
  '#2DD947',
  '3E1340',
  '#00668B',
  '#008C83',
  '#E55A53',
  '#E5AD43',
  '#25B23B',
  'E045E5',
];
