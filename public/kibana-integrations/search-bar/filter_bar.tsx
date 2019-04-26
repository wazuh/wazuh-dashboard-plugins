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
import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiPopover } from '@elastic/eui';
import {
  buildEmptyFilter,
  disableFilter,
  enableFilter,
  Filter,
  pinFilter,
  toggleFilterDisabled,
  toggleFilterNegated,
  unpinFilter,
} from '@kbn/es-query';
import { FormattedMessage, InjectedIntl, injectI18n } from '@kbn/i18n/react';
import classNames from 'classnames';
import React, { Component } from 'react';
import chrome from 'ui/chrome';
import { IndexPattern } from 'ui/index_patterns';
import { FilterOptions } from 'ui/search_bar/components/filter_options';
import { FilterEditor } from 'ui/filter_bar/filter_editor';
import { FilterItem } from './filter_item';

const config = chrome.getUiSettingsClient();

interface Props {
  filters: Filter[];
  onFiltersUpdated: (filters: Filter[]) => void;
  className: string;
  indexPatterns: IndexPattern[];
  intl: InjectedIntl;
}

interface State {
  isAddFilterPopoverOpen: boolean;
}

class FilterBarUI extends Component<Props, State> {
  public state = {
    isAddFilterPopoverOpen: false,
  };

  public render() {
    const classes = classNames('globalFilterBar', this.props.className);

    return (
      <EuiFlexGroup
        className="globalFilterGroup"
        gutterSize="none"
        alignItems="flexStart"
        responsive={false}
      >
        <EuiFlexItem className="globalFilterGroup__branch" grow={false}>
          <FilterOptions
            onEnableAll={this.onEnableAll}
            onDisableAll={this.onDisableAll}
            onPinAll={this.onPinAll}
            onUnpinAll={this.onUnpinAll}
            onToggleAllNegated={this.onToggleAllNegated}
            onToggleAllDisabled={this.onToggleAllDisabled}
            onRemoveAll={this.onRemoveAll}
          />
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiFlexGroup
            className={classes}
            wrap={true}
            responsive={false}
            gutterSize="xs"
            alignItems="center"
          >
            {this.renderItems()}
            {this.renderAddFilter()}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  private renderItems() {
    return this.props.filters.map((filter, i) => (
      <EuiFlexItem key={i} grow={false}>
        <FilterItem
          id={`${i}`}
          filter={filter}
          onUpdate={newFilter => this.onUpdate(i, newFilter)}
          onRemove={() => this.onRemove(i)}
          indexPatterns={this.props.indexPatterns}
        />
      </EuiFlexItem>
    ));
  }

  private renderAddFilter() {
    const isPinned = config.get('filters:pinnedByDefault');
    const [indexPattern] = this.props.indexPatterns;
    const index = indexPattern && indexPattern.id;
    const newFilter = buildEmptyFilter(isPinned, index);

    const button = (
      <EuiButtonEmpty size="xs" onClick={this.onOpenAddFilterPopover} data-test-subj="addFilter">
        +{' '}
        <FormattedMessage
          id="common.ui.filterBar.addFilterButtonLabel"
          defaultMessage="Add filter"
        />
      </EuiButtonEmpty>
    );

    return (
      <EuiFlexItem grow={false}>
        <EuiPopover
          id="addFilterPopover"
          button={button}
          isOpen={this.state.isAddFilterPopoverOpen}
          closePopover={this.onCloseAddFilterPopover}
          anchorPosition="downLeft"
          withTitle
          panelPaddingSize="none"
          ownFocus={true}
        >
          <EuiFlexItem grow={false}>
            <div style={{ width: 400 }}>
              <FilterEditor
                filter={newFilter}
                indexPatterns={this.props.indexPatterns}
                onSubmit={this.onAdd}
                onCancel={this.onCloseAddFilterPopover}
              />
            </div>
          </EuiFlexItem>
        </EuiPopover>
      </EuiFlexItem>
    );
  }

  private onAdd = (filter: Filter) => {
    this.onCloseAddFilterPopover();
    const filters = [...this.props.filters, filter];
    this.props.onFiltersUpdated(filters);
  };

  private onRemove = (i: number) => {
    const filters = [...this.props.filters];
    filters.splice(i, 1);
    this.props.onFiltersUpdated(filters);
  };

  private onUpdate = (i: number, filter: Filter) => {
    const filters = [...this.props.filters];
    filters[i] = filter;
    this.props.onFiltersUpdated(filters);
  };

  private onEnableAll = () => {
    const filters = this.props.filters.map(enableFilter);
    this.props.onFiltersUpdated(filters);
  };

  private onDisableAll = () => {
    const filters = this.props.filters.map(disableFilter);
    this.props.onFiltersUpdated(filters);
  };

  private onPinAll = () => {
    const filters = this.props.filters.map(pinFilter);
    this.props.onFiltersUpdated(filters);
  };

  private onUnpinAll = () => {
    const filters = this.props.filters.map(unpinFilter);
    this.props.onFiltersUpdated(filters);
  };

  private onToggleAllNegated = () => {
    const filters = this.props.filters.map(toggleFilterNegated);
    this.props.onFiltersUpdated(filters);
  };

  private onToggleAllDisabled = () => {
    const filters = this.props.filters.map(toggleFilterDisabled);
    this.props.onFiltersUpdated(filters);
  };

  private onRemoveAll = () => {
    this.props.onFiltersUpdated([]);
  };

  private onOpenAddFilterPopover = () => {
    this.setState({
      isAddFilterPopoverOpen: true,
    });
  };

  private onCloseAddFilterPopover = () => {
    this.setState({
      isAddFilterPopoverOpen: false,
    });
  };
}

export const FilterBar = injectI18n(FilterBarUI);
