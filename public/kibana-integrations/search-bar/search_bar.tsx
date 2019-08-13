/*
 * Author: Elasticsearch B.V.
 * Updated by Wazuh, Inc.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// @ts-ignore
import { EuiFilterButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { Filter } from '@kbn/es-query';
import { InjectedIntl, injectI18n } from '@kbn/i18n/react';
import classNames from 'classnames';
import React, { Component } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { FilterBar } from './filter_bar';
import { IndexPattern } from 'ui/index_patterns';
import { QueryBar } from 'ui/query_bar';
import { Storage } from 'ui/storage';

interface Query {
  query: string;
  language: string;
}

interface DateRange {
  from: string;
  to: string;
}

interface Props {
  query: {
    query: string;
    language: string;
  };
  onQuerySubmit: (payload: { dateRange: DateRange; query: Query }) => void;
  disableAutoFocus?: boolean;
  appName: string;
  indexPatterns: IndexPattern[];
  store: Storage;
  filters: Filter[];
  onFiltersUpdated: (filters: Filter[]) => void;
  showQueryBar: boolean;
  showFilterBar: boolean;
  intl: InjectedIntl;
  showDatePicker?: boolean;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  isRefreshPaused?: boolean;
  refreshInterval?: number;
  showAutoRefreshOnly?: boolean;
  onRefreshChange?: (options: { isPaused: boolean; refreshInterval: number }) => void;
}

interface State {
  isFiltersVisible: boolean;
}

class SearchBarUI extends Component<Props, State> {
  public static defaultProps = {
    showQueryBar: true,
    showFilterBar: true,
  };

  public filterBarRef: Element | null = null;
  public filterBarWrapperRef: Element | null = null;

  public state = {
    isFiltersVisible: true,
  };

  public setFilterBarHeight = () => {
    requestAnimationFrame(() => {
      const height =
        this.filterBarRef && this.state.isFiltersVisible ? this.filterBarRef.clientHeight : 0;
      if (this.filterBarWrapperRef) {
        this.filterBarWrapperRef.setAttribute('style', `height: ${height}px`);
      }
    });
  };

  // member-ordering rules conflict with use-before-declaration rules
  /* tslint:disable */
  public ro = new ResizeObserver(this.setFilterBarHeight);
  /* tslint:enable */

  public toggleFiltersVisible = () => {
    this.setState({
      isFiltersVisible: !this.state.isFiltersVisible,
    });
  };

  public componentDidMount() {
    if (this.filterBarRef) {
      this.setFilterBarHeight();
      this.ro.observe(this.filterBarRef);
    }
  }

  public componentDidUpdate() {
    if (this.filterBarRef) {
      this.setFilterBarHeight();
      this.ro.unobserve(this.filterBarRef);
    }
  }

  public render() {
    const filtersAppliedText = this.props.intl.formatMessage({
      id: 'common.ui.searchBar.filtersButtonFiltersAppliedTitle',
      defaultMessage: 'filters applied.',
    });
    const clickToShowOrHideText = this.state.isFiltersVisible
      ? this.props.intl.formatMessage({
        id: 'common.ui.searchBar.filtersButtonClickToShowTitle',
        defaultMessage: 'Select to hide',
      })
      : this.props.intl.formatMessage({
        id: 'common.ui.searchBar.filtersButtonClickToHideTitle',
        defaultMessage: 'Select to show',
      });

    const filterTriggerButton = (
      <EuiFilterButton
        onClick={this.toggleFiltersVisible}
        isSelected={this.state.isFiltersVisible}
        hasActiveFilters={this.state.isFiltersVisible}
        numFilters={this.props.filters.length > 0 ? this.props.filters.length : null}
        aria-controls="GlobalFilterGroup"
        aria-expanded={!!this.state.isFiltersVisible}
        title={`${this.props.filters.length} ${filtersAppliedText} ${clickToShowOrHideText}`}
      >
        Filters
      </EuiFilterButton>
    );

    const classes = classNames('globalFilterGroup__wrapper', {
      'globalFilterGroup__wrapper-isVisible': this.state.isFiltersVisible,
    });

    return (
      <div className="globalQueryBar">
        {this.props.showQueryBar ? (
          <QueryBar
            query={this.props.query}
            onSubmit={this.props.onQuerySubmit}
            appName={this.props.appName}
            indexPatterns={this.props.indexPatterns}
            store={this.props.store}
            prepend={this.props.showFilterBar ? filterTriggerButton : ''}
            showDatePicker={this.props.showDatePicker}
            dateRangeFrom={this.props.dateRangeFrom}
            dateRangeTo={this.props.dateRangeTo}
            isRefreshPaused={this.props.isRefreshPaused}
            refreshInterval={this.props.refreshInterval}
            showAutoRefreshOnly={this.props.showAutoRefreshOnly}
            onRefreshChange={this.props.onRefreshChange}
          />
        ) : (
            ''
          )}

        {this.props.showFilterBar ? (
          <div
            id="GlobalFilterGroup"
            ref={node => {
              this.filterBarWrapperRef = node;
            }}
            className={classes}
          >
            <div
              ref={node => {
                this.filterBarRef = node;
              }}
            >
              <FilterBar
                className="globalFilterGroup__filterBar"
                filters={this.props.filters}
                onFiltersUpdated={this.props.onFiltersUpdated}
                indexPatterns={this.props.indexPatterns}
              />
            </div>
          </div>
        ) : (
            ''
          )}
      </div>
    );
  }
}

export const SearchBar = injectI18n(SearchBarUI);