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
  postFixedFilters?: () => React.ReactElement<any>[];
  hideFixedFilters?: boolean;
}

export const WzSearchBar = ({
  fixedFilters = [],
  postFixedFilters,
  preQueryBar,
  hideFixedFilters,
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
      color='transparent'
      grow={false}
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
            <SearchBar {...restProps} />
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : null}
      {showFilters ? (
        <EuiFlexGroup gutterSize='s'>
          {hideFixedFilters ? null : (
            <EuiFlexItem grow={false}>
              <EuiFlexGroup
                gutterSize='xs'
                className='globalFilterBar globalFilterGroup__filterBar'
                responsive={false}
                wrap={true}
              >
                {fixedFilters?.map((filter, idx) => (
                  <EuiFlexItem grow={false} key={idx}>
                    <EuiBadge className='globalFilterItem' color='hollow'>
                      {`${filter.meta.key}: ${
                        typeof filter.meta.value === 'function'
                          ? filter.meta.value()
                          : filter.meta.value
                      }`}
                    </EuiBadge>
                  </EuiFlexItem>
                ))}
                {postFixedFilters
                  ? postFixedFilters.map((Filter, idx) => (
                      <EuiFlexItem grow={false} key={idx}>
                        <Filter />
                      </EuiFlexItem>
                    ))
                  : null}
              </EuiFlexGroup>
            </EuiFlexItem>
          )}
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
