import React, { Component } from 'react';

import {
  EuiPopover,
  EuiButton,
  EuiCheckboxGroup,
  EuiSpacer,
  EuiButtonEmpty
} from '@elastic/eui';

import PropTypes from 'prop-types';
import { ComponentsOsSupport } from '../../../utils/components-os-support';

export class ExportConfiguration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      buttonDisabled: false,
      isPopoverOpen: false
    };

    const agentOptions = ['Global configuration', 'Communication', 'Anti-flooding settings', 'Labels', 'Policy monitoring',
      { name: 'oscap', desc: 'OpenSCAP' }, 'CIS-CAT', 'Osquery', 'Inventory data', 'Active response', 'Commands',
      { name: 'docker', desc: 'Docker listener' }, 'Log collection', 'Integrity monitoring'];
    const groupOptions = ['Configurations', 'Agents in group'];

    this.options = [];
    const list = this.props.type === 'agent' ? agentOptions : groupOptions;
    let idx = 0;
    list.forEach(x => {
      if (typeof x === 'string' || (x.name && ComponentsOsSupport[x.name].includes(this.props.agentPlat))) {
        this.options.push({ id: `${idx}`, label: x.desc || x });
        idx++;
      }
    });

    let initialChecks = {};
    Object.keys(this.options).forEach(x => {
      initialChecks[x] = true;
    });
    this.state.checkboxIdToSelectedMap = initialChecks;
  }

  selectAll(flag) {
    let newCheckboxIdToSelectedMap = {};
    for (let i = 0; i < this.options.length; i++) {
      newCheckboxIdToSelectedMap[`${i}`] = flag;
    }
    this.setState({
      checkboxIdToSelectedMap: newCheckboxIdToSelectedMap,
      buttonDisabled: !flag
    });
  }

  exportClick() {
    this.setState({
      isPopoverOpen: !this.state.isPopoverOpen,
    });
  }

  closePopover() {
    this.setState({
      isPopoverOpen: false,
    });
  }

  onChange = optionId => {
    const newCheckboxIdToSelectedMap = {
      ...this.state.checkboxIdToSelectedMap,
      ...{
        [optionId]: !this.state.checkboxIdToSelectedMap[optionId],
      },
    };
    let result = false;
    for (let i = 0; i < this.options.length; i++) {
      if (newCheckboxIdToSelectedMap[`${i}`] === true) {
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
      <EuiButton
        iconType="importAction"
        iconSide="left"
        size="s"
        onClick={this.exportClick.bind(this)}>
        PDF
      </EuiButton>
    );
    return (
      <EuiPopover
        id="trapFocus"
        ownFocus
        button={button}
        isOpen={this.state.isPopoverOpen}
        closePopover={this.closePopover.bind(this)}
        anchorPosition="downRight">
        <EuiCheckboxGroup
          options={this.options}
          idToSelectedMap={this.state.checkboxIdToSelectedMap}
          onChange={this.onChange}
          compressed
        />
        <EuiSpacer size="s" />
        <EuiButtonEmpty
          size="xs"
          onClick={() => this.selectAll(true)}>
          Select all
        </EuiButtonEmpty>
        <EuiSpacer size="s" />
        <EuiButtonEmpty
          size="xs"
          onClick={() => this.selectAll(false)}>
          Unselect all
        </EuiButtonEmpty>
        <EuiSpacer size="m" />
        <EuiButton
          isDisabled={this.state.buttonDisabled}
          onClick={() => { this.closePopover(); this.props.exportConfiguration(this.state.checkboxIdToSelectedMap) }}
          fill>Generate PDF report</EuiButton>
      </EuiPopover >
    );
  }
}

ExportConfiguration.propTypes = {
  exportConfiguration: PropTypes.func,
  type: PropTypes.string,
  agentPlat: PropTypes.string
};