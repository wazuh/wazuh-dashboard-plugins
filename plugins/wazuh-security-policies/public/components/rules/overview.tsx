import React, { useState } from 'react';
import { EuiPanel, EuiButton, EuiText } from '@elastic/eui';
import { HeaderPage } from '../common/header-page';
import { LastUpdateContentManagerText } from '../common/last-update-content-manager-text.tsx';
import { SearchBar } from '../common/searchbar';
import { decoder } from '../integretions/mock-data-rules';

export const RulesOverview = () => {
  const [query, setQuery] = useState({ text: '' });
  // Header start
  const titleHeader = 'Rules';
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

  for (const item of decoder) {
    if (!integrationOption[item.metadata.module]) {
      integrationOption.push(item.metadata.module);
    }
  }

  const filters = [
    {
      type: 'field_value_toggle_group',
      field: 'status',
      name: 'Status',
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
      operator: 'exact',
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
    },
  };

  return (
    <EuiPanel>
      <HeaderPage
        titleHeader={titleHeader}
        descriptionHeader={descriptionHeader}
        rightSideItems={rightSideItems}
      />
      <SearchBar schema={schema} filters={filters} setQuery={setQuery} />
    </EuiPanel>
  );
};
