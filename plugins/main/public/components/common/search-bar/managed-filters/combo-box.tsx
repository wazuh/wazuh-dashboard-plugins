import React, { useState } from 'react';
import { EuiComboBox } from '@elastic/eui';
import { useAsyncActionRunOnStart } from '../../hooks';
import { withWrapComponent } from '../../hocs';
import { WzSearchBarCustomFilter } from './wrap-filter';
import { Filter } from '../../../../../../../src/plugins/data/common';

export interface WzSearchBarManagedFilterComboBoxAsyncProps {
  onFetch: () => string[];
  onChange: () => void;
  managedFilter: Filter;
}

const mapStringToComboBoxOption = label => ({ label });

export const WzSearchBarManagedFilterComboBoxAsync = withWrapComponent(
  WzSearchBarCustomFilter,
)(
  ({
    onFetch,
    onChange,
    managedFilter,
    ...rest
  }: WzSearchBarManagedFilterComboBoxAsyncProps) => {
    const [query, setQuery] = useState('');
    const fetchOptions = useAsyncActionRunOnStart(onFetch, [query]);

    const selectedOptions =
      managedFilter?.meta?.params?.map?.(mapStringToComboBoxOption) ?? [];

    const options = [
      ...selectedOptions,
      ...(Array.isArray(fetchOptions.data) // This assumes the suggestion is fetched and return in the expected data type
        ? fetchOptions.data.map(mapStringToComboBoxOption)
        : []),
    ];

    return (
      <EuiComboBox
        placeholder='Search'
        async
        options={options}
        selectedOptions={selectedOptions}
        isLoading={fetchOptions.running}
        onChange={onChange}
        onSearchChange={setQuery}
        compressed={true}
        {...rest}
      />
    );
  },
);
