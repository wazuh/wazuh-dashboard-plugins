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
import PropTypes, {InferProps, bool} from 'prop-types';
import {
  EuiPopover,
  EuiButtonEmpty,
  EuiPopoverFooter,
  EuiButtonGroup,
  EuiPopoverTitle,
  EuiText,
} from '@elastic/eui';

interface toggleButton {
  id: string, label: string
}

export class WzSearchFormatSelector extends Component {
  state: {
    isPopoverOpen:boolean
    toggleIdSelected: toggleButton
  }
  
  toggleButtons: toggleButton[]

  props!: {
    onChange: Function
    qFilterEnabled?: boolean
    apiFilterEnabled?: boolean
  }


  constructor(props) {
    super(props);
    const { qFilterEnabled, apiFilterEnabled } = props;  
    this.toggleButtons = this.initToggleButtons(qFilterEnabled, apiFilterEnabled);
    this.state = {
      isPopoverOpen: false,
      toggleIdSelected: this.toggleButtons[0],
    };
  }

  initToggleButtons(qEnable:boolean, apiEnable:boolean):toggleButton[] {
    const makeId = () => {
      const id = Math.random().toString(36).slice(-8);
      return /^\d/.test(id) ? 'x' + id : id;
    }
    const idPrefix = makeId();
    const toggleButtons:toggleButton[] = [];
    if (qEnable) {
      toggleButtons.push(
        {
          id: `${idPrefix}0`,
          label: '?Q',
        }
      )
    }

    if (apiEnable) {
      toggleButtons.push(
        {
          id: `${idPrefix}1`,
          label: 'API',
        },
      )
    }
    return toggleButtons;
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

  onToggleChange = optionId => {
    const newSelectedOption = this.getLabelButtonSelected(optionId);
    this.setState({
      toggleIdSelected: newSelectedOption,
    });
    this.props.onChange((newSelectedOption || {}).label);
  };

  getLabelButtonSelected(optionId) {
    const toggleIdSelected = this.toggleButtons.find((item) => {return item.id == optionId});
    return toggleIdSelected;
  }

  renderFooter():JSX.Element | null {
    const {toggleIdSelected} = this.state;
    if (this.toggleButtons.length <= 1) {
      return null;
    }
    return (
      <EuiPopoverFooter>
        <EuiButtonGroup
          legend="This is a basic group"
          color='primary'
          options={this.toggleButtons}
          idSelected={toggleIdSelected.id}
          onChange={this.onToggleChange}
        />
      </EuiPopoverFooter>
    );
  }

  render() {
    const {toggleIdSelected} = this.state;
    const button = (
      <EuiButtonEmpty
        onClick={this.onButtonClick.bind(this)}>
        {toggleIdSelected.label}
      </EuiButtonEmpty>
    );
    const renderFooter = this.renderFooter()
    return (
      <EuiPopover 
        id='wzFormatSelector'
        ownFocus
        button={button}
        isOpen={this.state.isPopoverOpen}
        closePopover={this.closePopover.bind(this)}>
        <EuiPopoverTitle>{toggleIdSelected.label}</EuiPopoverTitle>
          <div style={{ width: '300px' }}>
            <EuiText>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Donec mattis varius volutpat. In tempus egestas justo at 
                consectetur. Donec sit amet finibus massa, eget sollicitudin 
                tortor. Donec sed libero ex. Praesent at lacinia arcu, 
                eu porta nisl.
              </p>
            </EuiText>
          </div>
          { renderFooter }
      </EuiPopover>
    );
  }
}

WzSearchFormatSelector.propTypes = {
  onChange: PropTypes.func,
}