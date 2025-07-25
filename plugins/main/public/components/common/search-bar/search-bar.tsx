import React from 'react';
import { getPlugins } from '../../../kibana-services';
import './search-bar.scss';
import { EuiPanel, EuiFlexGroup, EuiFlexItem, EuiBadge } from '@elastic/eui';
import {
  SearchBarProps,
  Filter,
} from '../../../../../../src/plugins/data/public';
import { opensearchFilters } from '../../../../../../src/plugins/data/public';
import classNames from 'classnames';
import '../../../../public/styles/media-queries.scss';

export interface WzSearchBarProps extends SearchBarProps {
  fixedFilters?: Filter[];
  userFilters?: Filter[];
  preQueryBar?: React.ReactElement;
  postFilters?: React.ReactElement;
  postFixedFilters?: () => React.ReactElement<any>[];
  hideFixedFilters?: boolean;
  showSaveQueryButton?: boolean;
  showSaveQuery?: boolean;
}

export const WzSearchBar = ({
  fixedFilters = [],
  postFixedFilters,
  showSaveQueryButton = true,
  showSaveQuery = true,
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
      className='wz-search-bar no-padding'
      paddingSize='s'
      hasShadow={false}
      hasBorder={false}
      color='transparent'
      grow={false}
    >
      {showQuery ? (
        <EuiFlexGroup
          className='wz-search-bar-query'
          gutterSize='s'
          alignItems='center'
          responsive={false}
          wrap={true}
        >
          {preQueryBar ? <EuiFlexItem>{preQueryBar}</EuiFlexItem> : null}
          {/* WORKAROUND: The search bar is not displayed when the preQueryBar is enabled and the date picker is disabled to avoid rendering an empty flexItem */}
          {!preQueryBar || restProps?.showDatePicker ? (
            <EuiFlexItem grow={!preQueryBar}>
              <SearchBar
                {...restProps}
                showFilterBar={showSaveQueryButton}
                showSaveQuery={showSaveQuery}
              />
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      ) : null}
      {showFilters ? (
        <EuiFlexGroup className='wz-search-bar-filters' gutterSize='s'>
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
                    <FixedFilterLabel filter={filter} />
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
          <EuiFlexItem className='overflow-hidden'>
            <EuiFlexGroup
              gutterSize='s'
              alignItems='center'
              responsive={false}
              wrap={true}
            >
              <EuiFlexItem className='overflow-hidden'>
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

function getClasses(negate: boolean) {
  return classNames('globalFilterItem', {
    'globalFilterItem-isExcluded': negate,
  });
}

const { FilterLabel } = opensearchFilters;

const FixedFilterLabel = ({ filter }) => {
  const className = getClasses(filter.meta.negate);

  /* TODO: to cover other rendering cases, this should follow the same approach as the defined in
  the platform. See https://github.com/wazuh/wazuh-dashboard/blob/v4.12.0/src/plugins/data/public/ui/filter_bar/filter_view/index.tsx#L75-L104 */
  return (
    <EuiBadge className={className} color='hollow'>
      <FilterLabel
        filter={filter}
        valueLabel={
          typeof filter.meta.value === 'function'
            ? filter.meta.value()
            : filter.meta.value
        }
      />
    </EuiBadge>
  );
};
