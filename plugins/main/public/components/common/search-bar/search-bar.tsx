import React from 'react';
import { getPlugins } from '../../../kibana-services';
import './search-bar.scss';
import { EuiPanel, EuiFlexGroup, EuiFlexItem, EuiBadge } from '@elastic/eui';
import {
  SearchBarProps,
  Filter,
} from '../../../../../../src/plugins/data/public';

export interface WzSearchBarProps extends SearchBarProps {
  fixedFilters?: Filter[];
  userFilters?: Filter[];
  preQueryBar?: React.ReactElement;
  postFilters?: React.ReactElement;
}

export const WzSearchBar = ({
  fixedFilters = [],
  userFilters = [],
  preQueryBar,
  postFilters,
  ...restProps
}: WzSearchBarProps) => {
  const SearchBar = getPlugins().data.ui.SearchBar;

  const showQuery =
    restProps.showQueryBar ||
    restProps.showQueryInput ||
    restProps.showDatePicker !== false;
  const showFilters = restProps.showFilterBar !== false;

  return (
    <EuiPanel
      className='wz-search-bar wz-search-bar-no-padding'
      paddingSize='s'
      hasShadow={false}
      hasBorder={false}
    >
      {showQuery ? (
        <EuiFlexGroup
          gutterSize='s'
          alignItems='center'
          responsive={false}
          wrap={true}
        >
          {preQueryBar ? <EuiFlexItem>{preQueryBar}</EuiFlexItem> : null}
          <EuiFlexItem grow={!preQueryBar}>
            <SearchBar {...restProps} showFilterBar={false} />
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : null}
      {showFilters ? (
        <EuiFlexGroup gutterSize='s'>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup
              gutterSize='xs'
              className='globalFilterBar globalFilterGroup__filterBar'
              responsive={false}
              wrap={true}
            >
              {fixedFilters?.map((filter, idx) => (
                <EuiFlexItem grow={false} key={idx}>
                  <EuiBadge className='globalFilterItem'>
                    {`${filter.meta.key}: ${
                      typeof filter.meta.value === 'function'
                        ? filter.meta.value()
                        : filter.meta.value
                    }`}
                  </EuiBadge>
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup
              gutterSize='s'
              alignItems='center'
              responsive={false}
              wrap={true}
            >
              <EuiFlexItem>
                <SearchBar
                  {...restProps}
                  filters={userFilters}
                  showQueryBar={false}
                  useDefaultBehaviors={false}
                />
              </EuiFlexItem>
              {postFilters ? (
                <EuiFlexItem grow={false}>{postFilters}</EuiFlexItem>
              ) : null}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : null}
    </EuiPanel>
  );
};
