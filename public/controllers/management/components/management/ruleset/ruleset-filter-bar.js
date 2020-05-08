/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';

import { EuiComboBox, EuiFormRow } from '@elastic/eui';
import { connect } from 'react-redux';

import {
  updateLoadingStatus,
  updateFilters,
  updateError
} from '../../../../../redux/actions/rulesetActions';

import RulesetHandler from './utils/ruleset-handler';

class WzRulesetFilterBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isInvalid: false,
      selectedOptions: []
    };

    this.rulesetHandler = RulesetHandler;
    this.availableOptions = {
      rules: [
        'nist-800-53',
        'hipaa',
        'gdpr',
        'pci',
        'gpg13',
        'tsc',
        'group',
        'level',
        'path',
        'file'
      ],
      decoders: ['path', 'file'],
      lists: []
    };
    this.notValidMessage = false;
  }

  componentDidMount() {
    this.buildSelectedOptions(this.props.state.filters); // If there are any filter in the redux store it will be restored when the component was mounted
  }

  isValid = value => {
    const { section, showingFiles } = this.props.state;
    if (section === 'lists' || showingFiles) return true; //There are not filters for lists
    const lowerValue = value.toLowerCase();
    const availableOptions = this.availableOptions[
      this.props.state.section
    ].toString();
    this.notValidMessage = false;
    const options = this.availableOptions[this.props.state.section];
    const valueSplit = lowerValue.split(':');
    const oneTwoDots = valueSplit.length - 1 === 1; // Has : once
    const moreTwoDots = valueSplit.length - 1 > 1; // Has : several times
    const notAvailable = !options.includes(valueSplit[0]); // Not include in the available options
    if (moreTwoDots || (oneTwoDots && notAvailable)) {
      if (oneTwoDots) {
        this.notValidMessage = `${
          valueSplit[0]
        } is a not valid filter, the available filters are: ${availableOptions}`;
      } else {
        this.notValidMessage = 'Only allow ":" once';
      }
      return false;
    }
    return true;
  };

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
          label: option
        };
        selectedOptions.push(newOption);
      });
      this.setState({ selectedOptions });
      //const result = await this.wzReq.apiReq('GET', this.paths[section], {})
      if (Object.keys(filters).length) await this.fetchItems(filters);
    } catch (error) {
      console.error('error building selected options ', error);
    }
  }

  /**
   * Fetch items (rules, decoders)
   * @param {Object} filters
   */
  async fetchItems(filters) {
    try {
      const { section } = this.props.state;
      let fetcher = this.rulesetHandler.getRules; // By default the fetcher is for rules
      if (section === 'decoders') fetcher = this.rulesetHandler.getDecoders; // If section is decoders the fetcher changes
      if (section === 'lists') fetcher = this.rulesetHandler.getLists; // If the sections is lists the fetcher changes too
      this.props.updateLoadingStatus(true);
      const result = await fetcher(filters);
      this.props.updateLoadingStatus(false);
    } catch (error) {
      this.props.updateError(error);
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
      const keysToRemove = currentOptiosnKeys.filter(option => {
        return !remainingKeys.includes(option);
      });
      keysToRemove.forEach(key => delete currentOptions[key]);
      this.props.updateFilters(currentOptions);
      await this.fetchItems(currentOptions);
    } catch (error) {
      console.error('error cleaning current options ', error);
    }
  }

  onCreateOption = searchValue => {
    const isList = this.props.state.section === 'lists';
    const lowerValue = searchValue.toLowerCase();
    const currentOptions = { ...this.props.state.filters };
    const creatingSplit = lowerValue.split(':');
    let key = 'search';
    let value;
    if (!isList) {
      if (creatingSplit.length > 1) {
        key = creatingSplit[0];
        value = creatingSplit[1];
      } else {
        value = creatingSplit[0];
      }
      if (!this.isValid(lowerValue) || !value) return false; // Return false to explicitly reject the user's input.
    } else {
      value = lowerValue;
    }
    currentOptions[key] = value;
    this.props.updateFilters(currentOptions);
    this.buildSelectedOptions(currentOptions);
  };

  // When writting in the filter bar
  onSearchChange = searchValue => {
    if (!searchValue) {
      this.setState({
        isInvalid: false
      });

      return;
    }

    this.setState({
      isInvalid: !this.isValid(searchValue)
    });
  };

  onChange = selectedOptions => {
    this.setState({
      selectedOptions,
      isInvalid: false
    });
    this.cleanCurrentOption(selectedOptions);
  };

  render() {
    const { section, showingFiles } = this.props.state;
    const { selectedOptions, isInvalid } = this.state;
    const options = !Object.keys(this.props.state.filters).length
      ? []
      : selectedOptions;
    const filters = !showingFiles
      ? `Filter ${section}...`
      : `Search ${section} files...`;

    return (
      <EuiFormRow
        className="wz-form-row"
        isInvalid={isInvalid}
        error={this.notValidMessage}
      >
        <EuiComboBox
          noSuggestions
          placeholder={filters}
          selectedOptions={options}
          onCreateOption={this.onCreateOption}
          onChange={this.onChange}
          onSearchChange={this.onSearchChange}
          isInvalid={isInvalid}
        />
      </EuiFormRow>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateFilters: filters => dispatch(updateFilters(filters)),
    updateError: error => dispatch(updateError(error))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzRulesetFilterBar);
