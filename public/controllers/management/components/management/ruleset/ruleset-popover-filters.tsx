/*
 * Wazuh app - React component for show filter list.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  EuiFlexItem,
  EuiPopover,
  EuiButton,
  EuiButtonEmpty
} from '@elastic/eui';

class WzPopoverFilters extends Component {
  filters: {
    rules: { label: string; value: string; }[];
    decoders: { label: string; value: string; }[];
  };

  constructor(props) {
    super(props);
    this.state = {
      isPopoverOpen: false
    }
    this.filters = {
      rules: [
        { label: 'File', value: 'file' }, { label: 'Path', value: 'path' }, { label: 'Level', value: 'level' },
        { label: 'Group', value: 'group' }, { label: 'PCI control', value: 'pci' }, { label: 'GDPR', value: 'gdpr' }, { label: 'HIPAA', value: 'hipaa' }, { label: 'NIST-800-53', value: 'nist-800-53' }, { label: 'TSC', value: 'tsc' }
      ],
      decoders: [
        { label: 'File', value: 'file' }, { label: 'Path', value: 'path' }
      ]
    };
  }

  onButtonClick() {
    this.setState({
      isPopoverOpen: !this.state['isPopoverOpen'],
    });
  }

  closePopover() {
    this.setState({
      isPopoverOpen: false,
    });
  }

  render() {
    const { section } = this.props['state'];
    const button = (
      <EuiButton
        fill
        style={{ padding: 12 }}
        color='primary'
        onClick={() => this.onButtonClick()}
        iconType="logstashFilter"
        aria-label="Filter">
        Filters
      </EuiButton>
    );

    return (
      <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
        <EuiPopover
          id="trapFocus"
          ownFocus
          button={button}
          isOpen={this.state['isPopoverOpen']}
          anchorPosition="downRight"
          closePopover={this.closePopover.bind(this)}>
          {this.filters[section].map((filter, idx) => (
            <div key={idx}>
              <EuiButtonEmpty size="s"
                iconSide='right'
                // TODO: Add the logic to applyFilters
                onClick={() => null}>
                {filter.label}
              </EuiButtonEmpty>
            </div>
          ))}
        </EuiPopover>
      </EuiFlexItem>
    );
  }

}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzPopoverFilters);
