/*
 * Wazuh app - React component for registering agents.
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

import { EuiComboBox } from '@elastic/eui';
import { connect } from 'react-redux';

import {
  updateLoadingStatus,
  updateItems,
  updateFilters
} from '../../../../redux/actions/rulesetActions';

import RulesetHandler from './utils/ruleset-handler';

class WzRulesetFilterBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isInvalid: false,
      selectedOptions: [],
    };

    this.rulesetHandler = RulesetHandler;
    this.availableOptions = ['nist-800-53', 'hipaa', 'gdpr', 'pci', 'group', 'level', 'path', 'file'];
    this.currentOptions = {};

  }

  componentDidMount() {
    this.buildSelectedOptions(this.props.state.filters); // If there are any filter in the redux store it will be restored when the component was mounted
  }



  isValid = value => {
    const valueSplit = value.split(':');
    const oneTwoDots = valueSplit.length - 1 === 1; // Has : once 
    const moreTwoDots = valueSplit.length - 1 > 1; // Has : several times
    const notAvailable = !this.availableOptions.includes(valueSplit[0]); // Not include in the available options
    if (moreTwoDots || (oneTwoDots && notAvailable)) return false; // Only allow : once in order to split, also only allow the this.availableOptions if contents :
    return true;
  }

  /**
   * Set a valid array of objects for the options in the combo box [{label: value}, {label: value}]
   */
  async buildSelectedOptions(filters) {
    try {
      const selectedOptions = [];
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        const option = key === 'search' ? value : `${key}:${value}`;
        const newOption = {
          label: option,
        };
        selectedOptions.push(newOption);
      });
      this.setState({ selectedOptions });
      //const result = await this.wzReq.apiReq('GET', this.paths[section], {})
      if (Object.keys(filters).length) await this.fetchItems(filters);
    } catch (error) {
      console.error('error building selected options ', error)
    }
  }


  /**
   * Fetch items (rules, decoders)
   * @param {Object} filters 
   */
  async fetchItems(filters) {
    try {
      this.props.updateLoadingStatus(true);
      this.props.updateItems([]);
      const result = await this.rulesetHandler.getRules(filters);
      this.props.updateItems(result);
      this.props.updateLoadingStatus(false);
    } catch (error) {
      return Promise.reject(error);
    }

  }

  /**
   * When any element is removed from the this.state.selectedOptions is removed too from this.props.state.filters
   * @param {Array} selectedOptions
   */
  async cleanCurrentOption(selectedOptions) {
    try {
      const remainingKeys = [];
      const currentOptions = { ...this.props.state.filters };
      selectedOptions.forEach(option => {
        const value = option.label;
        const valueSplit = value.split(':');
        const isSearch = valueSplit.length === 1;
        const keyToRemove = isSearch ? 'search' : valueSplit[0];
        remainingKeys.push(keyToRemove);
      });
      const currentOptiosnKeys = Object.keys(currentOptions);
      const keysToRemove = currentOptiosnKeys.filter(option => { return !remainingKeys.includes(option) });
      keysToRemove.forEach(key => delete currentOptions[key]);
      this.props.updateFilters(currentOptions);
      await this.fetchItems(currentOptions);
    } catch (error) {
      console.error('error cleaning current options ', error);
    }
  }

  onCreateOption = searchValue => {
    const currentOptions = { ...this.props.state.filters };
    const creatingSplit = searchValue.split(':');
    let key;
    let value;
    if (creatingSplit.length > 1) {
      key = creatingSplit[0];
      value = creatingSplit[1];
    } else {
      key = 'search';
      value = creatingSplit[0];
    }
    if (!this.isValid(searchValue) || !value) return false; // Return false to explicitly reject the user's input.
    currentOptions[key] = value;
    this.props.updateFilters(currentOptions);
    this.buildSelectedOptions(currentOptions);
  };

  // When writting in the filter bar
  onSearchChange = searchValue => {
    if (!searchValue) {
      this.setState({
        isInvalid: false,
      });

      return;
    }

    this.setState({
      isInvalid: !this.isValid(searchValue),
    });

  };

  onChange = selectedOptions => {
    this.setState({
      selectedOptions,
      isInvalid: false,
    });
    this.cleanCurrentOption(selectedOptions);
  };

  render() {
    const { selectedOptions, isInvalid } = this.state;
    return (
      <EuiComboBox
        className="WzFilterBar"
        fullWidth={true}
        noSuggestions
        placeholder="Filters..."
        selectedOptions={selectedOptions}
        onCreateOption={this.onCreateOption}
        onChange={this.onChange}
        onSearchChange={this.onSearchChange}
        isInvalid={isInvalid}
      />
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateItems: items => dispatch(updateItems(items)),
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateFilters: filters => dispatch(updateFilters(filters))
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetFilterBar);
