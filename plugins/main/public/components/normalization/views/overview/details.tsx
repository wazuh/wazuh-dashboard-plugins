import React, { useEffect } from 'react';
import {
  EuiCallOut,
  EuiFlexGrid,
  EuiFlexItem,
  EuiIconTip,
  EuiInMemoryTable,
  EuiProgress,
  EuiSpacer,
  EuiTabbedContent,
  EuiTitle,
} from '@elastic/eui';
import { get } from 'lodash';
import { useAsyncAction } from '../../../common/hooks';
import {
  fetchInternalOpenSearchIndex,
  fetchInternalOpenSearchIndexItemsRelation,
} from '../../services/http';
import { indexName } from './info';
import { indexName as DecodersIndexName } from '../decoders/info';
import { indexName as KVDBsIndexName } from '../kvdbs/info';
import { Metadata } from '../../components/metadata/metadata';

const relationDecodersIDField = '___decoders';
const relationKVDBsIDField = '___kvdbs';
const missingFieldMarker = 'missing';

const detailsMapLabels: { [key: string]: string } = {
  'document.author': 'Author',
  'document.category': 'Category',
  'document.date': 'Date',
  'document.description': 'Description',
  'document.documentation': 'Documentation',
  'document.enable_decoders': 'Enable Decoders',
  'document.id': 'ID',
  'document.name': 'Name',
  'document.title': 'Title',
  'document.references': 'References',
};

const MissingAssetInTable: React.FC<{ value: string }> = ({ value }) => (
  <div>
    <span>{value}</span>

    <EuiIconTip
      aria-label='Warning'
      type='alert'
      color='warning'
      content='Data not found'
    />
  </div>
);

const columnsRelationDecoders = [
  {
    field: 'document.name',
    name: 'Name',
    sortable: true,
    render: (value, item: string) =>
      item[missingFieldMarker] ? <MissingAssetInTable value={value} /> : value,
  },
];

const columnsRelationKVDBs = [
  {
    field: 'document.title',
    name: 'Name',
    sortable: true,
    render: (value, item: string) =>
      item[missingFieldMarker] ? <MissingAssetInTable value={value} /> : value,
  },
];

const AssetViewer: React.FC<{ items: string }> = ({
  items,
  columns,
  schema = true,
}) => {
  const search = {
    box: {
      incremental: true,
      schema,
    },
  };
  return (
    <>
      <EuiSpacer />
      <EuiInMemoryTable
        search={search}
        items={items}
        columns={columns}
      ></EuiInMemoryTable>
    </>
  );
};

export const Details: React.FC<{ item: { document: { id: string } } }> = ({
  item,
}) => {
  const action = useAsyncAction(async () => {
    // TODO: take item form props or fetch the data
    const response = await fetchInternalOpenSearchIndex(indexName, {
      size: 1,
      query: {
        ids: { values: [item.document.id] },
      },
    });

    const hit = response?.hits?.hits?.[0];

    if (!hit) {
      throw new Error('Decoder not found');
    }

    const [hitWithRelation] = await fetchInternalOpenSearchIndexItemsRelation(
      [hit._source],
      {
        decoders: {
          field: 'document.decoders',
          indexField: 'document.id',
          index: DecodersIndexName,
          target_field: relationDecodersIDField,
          onMissing: item => {
            return { document: { title: item }, [missingFieldMarker]: true };
          },
          includeFields: ['document.name', 'document.id'],
        },
        kvdbs: {
          field: 'document.kvdbs',
          indexField: 'document.id',
          index: KVDBsIndexName,
          target_field: relationKVDBsIDField,
          onMissing: item => {
            return { document: { title: item }, [missingFieldMarker]: true };
          },
          includeFields: ['document.title', 'document.id'],
        },
      },
    );

    return hitWithRelation;
  });

  useEffect(() => {
    action.run();
  }, []);

  if (action.running) {
    return <EuiProgress size='xs' color='primary' />;
  }

  if (action.error) {
    return (
      <EuiCallOut
        color='danger'
        title={`Error: ${action.error.message}`}
        iconType='iInCircle'
      />
    );
  }

  if (action.data) {
    return (
      <EuiTabbedContent
        tabs={[
          {
            id: 'info',
            name: 'Info',
            content: (
              <>
                <EuiSpacer />
                <EuiFlexGrid columns={2}>
                  {[
                    'document.id',
                    'document.author',
                    'document.category',
                    ['document.date', 'date'],
                    'document.documentation',
                    ['document.enable_decoders', 'boolean_yesno'],
                    'document.title',
                    ['document.references', 'url'],
                  ].map(item => {
                    const [field, type] =
                      typeof item === 'string' ? [item, 'text'] : item;
                    return (
                      <EuiFlexItem key={field}>
                        <Metadata
                          label={detailsMapLabels[field]}
                          value={get(action.data, field)}
                          type={type as 'text' | 'url'}
                        />
                      </EuiFlexItem>
                    );
                  })}
                </EuiFlexGrid>
                <EuiSpacer />
                {action.data?.document?.description && (
                  <>
                    <EuiTitle size='s'>
                      <h5>Description</h5>
                    </EuiTitle>
                    <EuiSpacer size='s' />
                    <Metadata
                      label=''
                      value={action.data.document.description}
                      type={'text'}
                    />
                  </>
                )}
              </>
            ),
          },
          {
            id: 'decoders',
            name: 'Decoders',
            content: (
              <AssetViewer
                items={action.data[relationDecodersIDField] || []}
                columns={columnsRelationDecoders}
                schema={{
                  strict: true,
                  fields: {
                    'document.name': {
                      type: 'string',
                    },
                    'document.id': {
                      type: 'string',
                    },
                    [missingFieldMarker]: {
                      type: 'boolean',
                    },
                  },
                }}
              />
            ),
          },
          {
            id: 'kvdbs',
            name: 'KVDBs',
            content: (
              <AssetViewer
                items={action.data[relationKVDBsIDField] || []}
                columns={columnsRelationKVDBs}
                schema={{
                  strict: true,
                  fields: {
                    'document.title': {
                      type: 'string',
                    },
                    'document.id': {
                      type: 'string',
                    },
                    [missingFieldMarker]: {
                      type: 'boolean',
                    },
                  },
                }}
              />
            ),
          },
        ]}
      />
    );
  }

  return null;
};
