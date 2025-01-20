import React, { useEffect, useState } from 'react';
import {
  EuiPanel,
  EuiButton,
  EuiText,
  EuiBasicTable,
  EuiHealth,
} from '@elastic/eui';
import { decoder } from '../rules/mock-data-rules';
import { getHistory } from '../../plugin-services';
import { HeaderPage } from './header-page';
import { LastUpdateContentManagerText } from './last-update-content-manager-text.tsx';
import { SearchBar } from './searchbar';
import { NoResultsData } from './no-results';

interface OverviewTemplateProps {
  view: 'rules' | 'decoders' | 'kvdb';
}

export const OverviewTemplate = (props: OverviewTemplateProps) => {
  const { view } = props;
  const history = getHistory();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [decoderList, setDecoderList] = useState(decoder);
  const [query, setQuery] = useState({ text: '' });
  // Header start
  const titleHeader = view;
  const descriptionHeader = LastUpdateContentManagerText({
    status: 'Updated',
    lastUpdateDate: '31/01/2025',
  });
  const rightSideItems = [
    <EuiButton key='create-rule' onClick={() => console.log('clicked')} fill>
      Create
    </EuiButton>,
  ];
  // Header end
  // Searchbar start
  const isActiveOption = [
    { value: 'enable', name: 'Enabla' },
    { value: 'disable', name: 'Disable' },
    { value: 'draft', name: 'Draft' },
  ];
  const integrationOption: string[] = [];
  const nativeOrCustomOption = [
    { value: 'native', name: 'Native' },
    { value: 'custom', name: 'Custom' },
  ];

  for (const item of decoderList) {
    if (!integrationOption[item.metadata.module]) {
      integrationOption.push(item.metadata.module);
    }
  }

  const filters = [
    {
      type: 'field_value_toggle_group',
      field: 'status',
      multiSelect: 'or',
      items: isActiveOption,
    },
    {
      type: 'field_value_toggle_group',
      field: 'provider',
      name: 'Provider',
      multiSelect: 'or',
      items: nativeOrCustomOption,
    },
    {
      type: 'field_value_selection',
      field: 'metadata.module',
      name: 'Integrations',
      multiSelect: 'and',
      cache: 10000, // will cache the loaded tags for 10 sec
      options: integrationOption.map(integration => ({
        value: integration,
        view: <EuiText>{integration}</EuiText>,
      })),
    },
  ];
  const schema = {
    strict: true,
    fields: {
      status: {
        type: 'string',
      },
      'metadata.module': {
        type: 'string',
      },
      provider: {
        type: 'string',
      },
    },
  };
  // Search bar end
  // Table start

  useEffect(() => {
    if (query.text === '') {
      setDecoderList(decoder);

      return;
    }

    const decoderFilter = decoderList.filter(decoder =>
      Object.values(decoder).includes('enable'),
    );

    setDecoderList(decoderFilter);
  }, [query]);

  const renderStatus = (status: string) => {
    let color: string;
    let label: string;

    switch (status) {
      case 'enable': {
        color = 'success';
        label = 'Enable';
        break;
      }

      case 'disable': {
        color = 'danger';
        label = 'Disable';
        break;
      }

      case 'draft': {
        color = 'warning';
        label = 'Draft';
        break;
      }

      default: {
        color = 'text';
        label = '-141';
        break;
      }
    }

    return <EuiHealth color={color}>{label}</EuiHealth>;
  };

  const columns = [
    {
      field: 'name',
      name: 'Name',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'metadata.module',
      name: 'Integration',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'metadata.description',
      name: 'Description',
      truncateText: true,
    },
    {
      field: 'provider',
      name: 'Provider',
      sortable: true,
      truncateText: true,
      render: (item: string) => (
        <EuiText style={{ textTransform: 'capitalize' }}>{item}</EuiText>
      ),
    },
    {
      field: 'status',
      name: 'Status',
      dataType: 'boolean',
      render: (status: string) => renderStatus(status),
      sortable: true,
      mobileOptions: {
        show: false,
      },
    },
    {
      name: 'Actions',
      actions: [
        {
          name: 'Edit',
          isPrimary: true,
          description: 'Edit this user',
          icon: 'pencil',
          type: 'icon',
          onClick: () => {},
          'data-test-subj': 'action-edit',
        },
        {
          name: 'Remove',
          description: 'Remove this element',
          isPrimary: true,
          icon: 'trash',
          color: 'danger',
          type: 'icon',
          onClick: () => {},
        },
        {
          name: 'Clone',
          description: 'Clone this user',
          icon: 'copy',
          onClick: () => {},
        },
        {
          name: 'Share',
          description: 'Share this user',
          icon: 'share',
          type: 'icon',
          onClick: () => {},
          'data-test-subj': 'action-share',
        },
      ],
    },
  ];

  const onTableChange = ({
    page,
  }: {
    page: { index: number; size: number };
  }) => {
    const { index: pageIndex, size: pageSize } = page;

    setPageIndex(pageIndex);
    setPageSize(pageSize);
  };

  const pagination = {
    pageIndex: pageIndex,
    pageSize: pageSize,
    totalItemCount: decoderList.length,
    pageSizeOptions: [3, 5, 8],
  };

  const handleNavigation = (path: string) => {
    history.push(path);
  };

  const getRowProps = item => ({
    onClick: () =>
      handleNavigation(`/${titleHeader}/${encodeURIComponent(item.name)}`),
  });

  // Table end

  return (
    <EuiPanel>
      <HeaderPage
        titleHeader={titleHeader}
        descriptionHeader={descriptionHeader}
        rightSideItems={rightSideItems}
      />
      <SearchBar schema={schema} filters={filters} setQuery={setQuery} />
      <EuiBasicTable
        items={decoderList.slice(pageIndex, pageSize)}
        columns={columns}
        pagination={pagination}
        isSelectable={true}
        onChange={onTableChange}
        rowProps={getRowProps}
      />
      {decoder.length <= 0 && <NoResultsData query={query} />}
    </EuiPanel>
  );
};
