import React, { Component, Fragment } from 'react';

import {
  EuiPopover,
  EuiButton,
  EuiCheckboxGroup,
  EuiSpacer
} from '@elastic/eui';

import PropTypes from 'prop-types';

export class ExportConfiguration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      checkboxIdToSelectedMap:
        this.props.type === 'agent' ? {
          ['0']: true,
          ['1']: true,
          ['2']: true,
          ['3']: true,
          ['4']: true,
          ['5']: true,
          ['6']: true,
          ['7']: true,
          ['8']: true,
          ['9']: true,
          ['10']: true,
          ['11']: true,
          ['12']: true,
          ['13']: true
        } :
          {
            ['0']: true,
            ['1']: true
          },
      isPopoverOpen: false,
    };


    this.options = this.props.type === 'agent' ? [
      { id: '0', label: 'Global configuration' },
      { id: '1', label: 'Communication' },
      { id: '2', label: 'Anti-flooding settings' },
      { id: '3', label: 'Labels' },
      { id: '4', label: 'Policy monitoring' },
      { id: '5', label: 'OpenSCAP' },
      { id: '6', label: 'CIS-CAT' },
      { id: '7', label: 'Osquery' },
      { id: '8', label: 'Inventory data' },
      { id: '9', label: 'Active response' },
      { id: '10', label: 'Commands' },
      { id: '11', label: 'Docker listener' },
      { id: '12', label: 'Log collection' },
      { id: '13', label: 'Integrity monitoring' },
    ] :
      [
        { id: '0', label: 'Configurations' },
        { id: '1', label: 'Agents in group' }
      ]
      ;
  }

  onButtonClick() {
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

    this.setState({
      checkboxIdToSelectedMap: newCheckboxIdToSelectedMap,
    });
  };


  render() {
    const button = (
      <EuiButton
        iconType="importAction"
        iconSide="left"
        size="s"
        onClick={this.onButtonClick.bind(this)}>
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
        <EuiSpacer size="m" />
        <EuiButton
          onClick={() => { this.closePopover(); this.props.exportConfiguration(this.state.checkboxIdToSelectedMap) }}
          fill>Generate PDF report</EuiButton>
      </EuiPopover>
    );
  }
}

ExportConfiguration.propTypes = {
  exportConfiguration: PropTypes.func,
  type: PropTypes.string
};