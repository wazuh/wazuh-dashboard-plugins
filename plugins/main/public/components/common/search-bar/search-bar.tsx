import React from 'react';
import { getPlugins } from '../../../kibana-services';
import './search-bar.scss'
import { EuiPanel, EuiFlexGroup, EuiFlexItem, EuiBadge } from '@elastic/eui';

export const WzSearchBar = ({ fixedFilters, userFilters, ...restProps }) => {
  const SearchBar = getPlugins().data.ui.SearchBar;

  console.log({ fixedFilters, userFilters, restProps })

  return <EuiPanel
    className='wz-search-bar'
    paddingSize='s'
    hasShadow={false}
    hasBorder={false}
  >
    <SearchBar
      {...restProps}
      showFilterBar={false}
    />
    <EuiFlexGroup gutterSize='s'>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize='xs'
          className='globalFilterBar globalFilterGroup__filterBar'
        >
          {fixedFilters?.map((filter, idx) =>
            <EuiFlexItem grow={false} key={idx}>
              <EuiBadge className='globalFilterItem'>
                {`${filter.meta.key}: ${typeof filter.meta.value === 'function' ? filter.meta.value() : filter.meta.value}`}
              </EuiBadge>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem>
        <SearchBar
          {...restProps}
          filters={userFilters}
          showQueryBar={false}
          useDefaultBehaviors={false}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  </EuiPanel>
}