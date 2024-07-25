import React, { useState } from 'react';
import {
  EuiButton,
  EuiContextMenu,
  EuiPopover,
  EuiButtonEmpty,
} from '@elastic/eui';
import { Layout } from '../components';
import specification from '../spec.json';
import { transformAssetSpecToListTableColumn } from '../utils/transform-asset-spec';
import { Detail } from '../components/detail';
import { CreateAssetSelectorButton } from '../../../common/assets';

const modalOptions = isEdit => [
  {
    id: 'create-asset-visual',
    label: 'Visual',
    help: `Use the visual editor to ${isEdit ? 'update' : 'create'} your asset${
      isEdit ? '' : ' using pre-defined options.'
    }`,
    routePath: 'visual',
  },
  {
    id: 'create-asset-file-editor',
    label: 'File editor',
    help: `Use the file editor to ${isEdit ? 'update' : 'create'} your asset${
      isEdit ? '' : ' using pre-defined options.'
    }`,
    routePath: 'file',
  },
];

export const List = props => {
  const {
    TableIndexer,
    IntegrationsDataSource,
    IntegrationsDataSourceRepository,
    title,
  } = props;

  const actions = [
    <EuiButton
      onClick={() => {
        // TODO: Implement
      }}
      iconType='importAction'
    >
      Import file
    </EuiButton>,
    <EuiButton
      fill
      onClick={() => {
        props.navigationService
          .getInstance()
          .navigate('/engine/integrations/create');
      }}
      iconType='importAction'
    >
      Create Integration
    </EuiButton>,
  ];

  const [indexPattern, setIndexPattern] = React.useState(null);
  const [inspectedHit, setInspectedHit] = React.useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const defaultColumns = React.useMemo(
    () => [
      ...transformAssetSpecToListTableColumn(specification, {
        title: {
          render: (prop, item) => (
            <EuiButtonEmpty onClick={() => setInspectedHit(item._document)}>
              {prop}
            </EuiButtonEmpty>
          ),
          show: true,
        },
      }),
      {
        // The field property does not exist on the data, but it used to display the column with
        // show
        field: 'actions',
        name: 'Actions',
        show: true,
        actions: [
          {
            name: 'View',
            isPrimary: true,
            description: 'View details',
            icon: 'eye',
            type: 'icon',
            onClick: ({ _document }) => {
              setInspectedHit(_document);
            },
            'data-test-subj': 'action-view',
          },
          {
            name: 'Edit',
            isPrimary: true,
            description: 'Edit',
            icon: 'pencil',
            type: 'icon',
            onClick: (...rest) => {
              console.log({ rest });
            },
            'data-test-subj': 'action-edit',
          },
          {
            name: 'Export',
            isPrimary: true,
            description: 'Export file',
            icon: 'exportAction',
            type: 'icon',
            onClick: (...rest) => {
              console.log({ rest });
            },
            'data-test-subj': 'action-export',
          },
          {
            name: 'Delete',
            isPrimary: true,
            description: 'Delete file',
            icon: 'trash',
            type: 'icon',
            onClick: (...rest) => {
              console.log({ rest });
            },
            'data-test-subj': 'action-delete',
          },
        ],
      },
    ],
    [],
  );

  return (
    <Layout title={title} actions={actions}>
      <TableIndexer
        DataSource={IntegrationsDataSource}
        DataSourceRepository={IntegrationsDataSourceRepository}
        tableProps={{
          title: 'Catalog',
          description: 'Manage the engine integrations',
          tableColumns: defaultColumns,
          actionButtons: props => TableActions({ ...props, selectedItems }),
          tableSortingInitialField: defaultColumns[0].field,
          tableSortingInitialDirection: 'asc',
          tableProps: {
            itemId: 'name',
            selection: {
              onSelectionChange: item => {
                setSelectedItems(item);
              },
            },
            isSelectable: true,
          },
          saveStateStorage: {
            system: 'localStorage',
            key: 'wz-engine:integrations-main',
          },
        }}
        exportCSVPrefixFilename='integrations'
        onSetIndexPattern={setIndexPattern}
      />
      {inspectedHit && (
        <Detail
          {...props}
          onClose={() => setInspectedHit(null)}
          data={inspectedHit}
          indexPattern={indexPattern}
        />
      )}
    </Layout>
  );
};

const TableActions = ({ selectedItems }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <EuiPopover
      panelPaddingSize='none'
      button={
        <EuiButton
          iconType='arrowDown'
          iconSide='right'
          onClick={() => setIsOpen(state => !state)}
        >
          Actions
        </EuiButton>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
    >
      <EuiContextMenu
        initialPanelId={0}
        // The EuiContextMenu has bug when testing in jest
        // the props change won't make it rerender
        key={''}
        panels={[
          {
            id: 0,
            items: [
              {
                name: 'Export',
                disabled: selectedItems.length === 0,
                'data-test-subj': 'editAction',
                onClick: () => {
                  /* TODO: implement */
                },
              },
              { isSeparator: true },
              {
                name: 'Delete',
                disabled: selectedItems.length === 0,
                'data-test-subj': 'deleteAction',
                onClick: () => {
                  /* TODO: implement */
                },
              },
            ],
          },
        ]}
      />
    </EuiPopover>
  );
};
