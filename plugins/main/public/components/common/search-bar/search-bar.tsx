import React from 'react';
import { getPlugins } from '../../../kibana-services';
import './search-bar.scss'
import { EuiPanel, EuiFlexGroup, EuiFlexItem, EuiBadge } from '@elastic/eui';
import { SearchBarProps, Filter } from '../../../../../../src/plugins/data/public';

export interface WzSearchBarProps extends SearchBarProps {
  fixedFilters?: Filter[],
  userFilters?: Filter[],
}

export const WzSearchBar = ({ fixedFilters = [], userFilters = [], ...restProps }: WzSearchBarProps) => {
  const SearchBar = getPlugins().data.ui.SearchBar;

  return <EuiPanel
    className='wz-search-bar wz-search-bar-no-padding'
    paddingSize='s'
    hasShadow={false}
    hasBorder={false}
  >
    {!(restProps.showQueryBar === false) && <SearchBar
      {...restProps}
      showFilterBar={false}
    />}
    {!(restProps.showFilterBar === false) && <EuiFlexGroup gutterSize='s'>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize='xs'
          className='globalFilterBar globalFilterGroup__filterBar'
          responsive={false}
          wrap={true}
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
    </EuiFlexGroup>}
  </EuiPanel>
}