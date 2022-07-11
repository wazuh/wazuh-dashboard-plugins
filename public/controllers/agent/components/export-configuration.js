/*
 * Wazuh app - React component for exporting the configuration of a group.
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

import {
  EuiPopover,
  EuiButton,
  EuiCheckboxGroup,
  EuiSpacer,
  EuiButtonEmpty
} from '@elastic/eui';

import PropTypes from 'prop-types';
import { UnsupportedComponents } from '../../../utils/components-os-support';
import { WAZUH_AGENTS_OS_TYPE } from '../../../../common/constants';
import { withErrorBoundary } from '../../../components/common/hocs';

export const ExportConfiguration = withErrorBoundary (class ExportConfiguration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      buttonDisabled: false,
      isPopoverOpen: false
    };

    const agentOptions = [
      'Global configuration',
      'Communication',
      'Anti-flooding settings',
      'Labels',
      'Policy monitoring',
      { name: 'oscap', desc: 'OpenSCAP' },
      'CIS-CAT',
      'Osquery',
      'Inventory data',
      'Active response',
      'Commands',
      { name: 'docker', desc: 'Docker listener' },
      'Log collection',
      'Integrity monitoring'
    ];
    const groupOptions = ['Configurations', 'Agents in group'];

    this.options = [];
    const list = this.props.type === 'agent' ? agentOptions : groupOptions;
    list.forEach((x, idx) => {
      if (
        typeof x === 'string' ||
        (x.name &&
          !(
            UnsupportedComponents[this.props.agentPlatform] ||
            UnsupportedComponents[WAZUH_AGENTS_OS_TYPE.OTHERS]
          ).includes(x.name))
      ) {
        this.options.push({ id: `${idx}`, label: x.desc || x });
      }
    });

    let initialChecks = {};
    this.options.forEach(x => {
      initialChecks[x.id] = true;
    });
    this.state.checkboxIdToSelectedMap = initialChecks;
  }

  selectAll(flag) {
    let newCheckboxIdToSelectedMap = {};
    for (let i = 0; i < this.options.length; i++) {
      newCheckboxIdToSelectedMap[`${this.options[i].id}`] = flag;
    }
    this.setState({
      checkboxIdToSelectedMap: newCheckboxIdToSelectedMap,
      buttonDisabled: !flag
    });
  }

  exportClick() {
    this.setState({
      isPopoverOpen: !this.state.isPopoverOpen
    });
  }

  closePopover() {
    this.setState({
      isPopoverOpen: false
    });
  }

  onChange = optionId => {
    const newCheckboxIdToSelectedMap = {
      ...this.state.checkboxIdToSelectedMap,
      ...{
        [optionId]: !this.state.checkboxIdToSelectedMap[optionId]
      }
    };
    let result = false;
    for (let i = 0; i < this.options.length; i++) {
      if (newCheckboxIdToSelectedMap[`${this.options[i].id}`] === true) {
        result = true;
      }
    }
    this.setState({
      checkboxIdToSelectedMap: newCheckboxIdToSelectedMap,
      buttonDisabled: !result
    });
  };

  render() {
    const button = (
      <EuiButtonEmpty
        iconType="importAction"
        iconSide="left"
        size="s"
        style={{ marginTop: '4px' }}
        onClick={this.exportClick.bind(this)}
      >
        Export PDF
      </EuiButtonEmpty>
    );
    return (
      <EuiPopover
        id="trapFocus"
        ownFocus
        button={button}
        isOpen={this.state.isPopoverOpen}
        closePopover={this.closePopover.bind(this)}
        anchorPosition="downRight"
      >
        <EuiCheckboxGroup
          options={this.options}
          idToSelectedMap={this.state.checkboxIdToSelectedMap}
          onChange={this.onChange}
          compressed
        />
        <EuiSpacer size="s" />
        {this.options.length > 3 &&
          <><EuiButtonEmpty size="xs" onClick={() => this.selectAll(true)}>
            Select all
          </EuiButtonEmpty><EuiSpacer size="s" /><EuiButtonEmpty size="xs" onClick={() => this.selectAll(false)}>
              Unselect all
            </EuiButtonEmpty></>}
        <EuiSpacer size="m" />
        <EuiButton
          isDisabled={this.state.buttonDisabled}
          onClick={() => {
            this.closePopover();
            this.props.exportConfiguration(this.state.checkboxIdToSelectedMap);
          }}
          fill
        >
          Generate PDF report
        </EuiButton>
      </EuiPopover>
    );
  }
});

ExportConfiguration.propTypes = {
  exportConfiguration: PropTypes.func,
  type: PropTypes.string,
  agentPlatform: PropTypes.string
};
