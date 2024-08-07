import React, { useState } from 'react';
import { EuiLink } from '@elastic/eui';
import { getServices } from '../../../../services';

export const columns = (setIsFlyoutVisible, setDetailsRequest) => {
  const navigationService = getServices().navigationService;

  return [
    {
      name: 'Policy',
      field: 'policy',
      align: 'left',
      show: true,
      render: name => {
        return (
          <>
            <EuiLink onClick={() => {}}>&nbsp;{name}</EuiLink>
          </>
        );
      },
    },
    {
      field: 'hash',
      name: 'Hash',
      align: 'left',
      sortable: true,
      show: true,
    },
    {
      field: 'assets',
      name: 'Assets',
      align: 'left',
      sortable: true,
      show: true,
    },
    {
      field: 'default_parents',
      name: 'Default parents',
      align: 'left',
      sortable: true,
    },
    {
      name: 'Actions',
      align: 'left',
      show: true,
      actions: [
        {
          name: 'View',
          isPrimary: true,
          description: 'View details',
          icon: 'eye',
          type: 'icon',
          onClick: async item => {},
          'data-test-subj': 'action-view',
        },
        {
          name: 'Edit',
          isPrimary: true,
          description: 'Edit policy',
          icon: 'pencil',
          type: 'icon',
          onClick: async item => {},
          'data-test-subj': 'action-edit',
        },
        {
          name: 'Delete',
          isPrimary: true,
          description: 'Delete policy',
          icon: 'trash',
          type: 'icon',
          onClick: async item => {
            const file = {};
          },
          'data-test-subj': 'action-delete',
        },
        {
          name: 'Import',
          isPrimary: true,
          description: 'Import policy',
          icon: 'importAction',
          type: 'icon',
          onClick: async item => {},
          'data-test-subj': 'action-import',
        },
      ],
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
