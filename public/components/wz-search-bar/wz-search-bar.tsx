/*
 * Wazuh app - React component for show search and filter in the rules,decoder and CDB lists.
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import PropTypes, {InferProps} from 'prop-types';
import {
  EuiSearchBar,
  EuiButtonEmpty,
  EuiFormRow,
  EuiPopover,
  EuiButton,
  EuiFlexItem,
  EuiFlexGroup,
} from '@elastic/eui';
import { filter } from 'bluebird';

interface filter {
  label: string,
  value: string,
}
export default class WzSearchBarFilter extends Component {
  state: {
    isPopoverOpen: boolean,
    query: string,
  }
  props!: {
    filters: filter[]
  }
  constructor(props) {
    super(props);
    this.state = {
      isPopoverOpen: false,
      query: '',
    }
  }

  closePopover(): void {
    this.setState({ isPopoverOpen: false });
  }

  renderPopOver(): JSX.Element {
    const { query } = this.state;
    const button = (
      <EuiButton
        fill
        style={{ padding: 12, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
        color='primary'
        onClick={() => {this.setState({ isPopoverOpen:true })}}
        iconType="logstashFilter"
        aria-label="Filter">
        Filters
      </EuiButton>
    );
    return (
      <EuiPopover
        id="trapFocus"
        ownFocus
        button={button}
        isOpen={this.state.isPopoverOpen}
        anchorPosition="downRight"
        closePopover={this.closePopover.bind(this)}>
        
        {this.props.filters.map((filter, idx) => (
              <div key={idx}>
                <EuiButtonEmpty size="s"
                  iconSide='right'
                  // TODO: Add the logic to applyFilters
                  onClick={() => this.setState({query:`${query} ${filter.value}:`})}>
                  {filter.label}
                </EuiButtonEmpty>
              </div>
            )
          )
        }
      </EuiPopover>
    )
  }

  renderSearchBar(): JSX.Element {
    const { query } = this.state
    return (
      <EuiFormRow
        className="wz-form-row"
        isInvalid={false}
        error={"Gola"}
      >
        <EuiSearchBar
          onChange={() => {}}
          query={query} />
      </EuiFormRow>
    );
  }

  render() {
    const popOver = this.renderPopOver();
    const searchBar = this.renderSearchBar();
    return (
      <EuiFlexGroup>
        <EuiFlexItem grow={false} style={{marginRight: 0}}>
          {this.props.filters 
            ? popOver
            : null
          }
        </EuiFlexItem>
        <EuiFlexItem style={{marginLeft: 0}}>
          {searchBar}
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }
}

WzSearchBarFilter.propTypes = {
  filters: PropTypes.array,
}