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
import { EuiSelect } from '@elastic/eui';

import { connect } from 'react-redux';
import {
  updateRulesetSection,
  updateLoadingStatus,
  toggleShowFiles,
  cleanFilters,
  updateError,
  updateIsProcessing
} from '../../../../redux/actions/rulesetActions';

import { WzRequest } from '../../../../react-services/wz-request';

class WzSectionSelector extends Component {
  constructor(props) {
    super(props);

    this.sections = [
      { value: 'rules', text: 'Rules' },
      { value: 'decoders', text: 'Decoders' },
      { value: 'lists', text: 'CDB lists' }
    ];

    this.paths = {
      rules: '/rules',
      decoders: '/decoders',
      lists: '/lists/files'
    };

    this.wzReq = WzRequest;
  }

  /**
   * Fetch the data for a section: rules, decoders, lists...
   * @param {String} newSection
   */
  async fetchData(newSection) {
    try {
      const currentSection = this.props.state.section;
      if (
        Object.keys(this.props.state.filters).length &&
        newSection === currentSection
      )
        return; // If there's any filter and the section is de same doesn't fetch again
      this.props.changeSection(newSection);
      this.props.updateLoadingStatus(true);
      const result = await this.wzReq.apiReq('GET', this.paths[newSection], {});
      const items = result.data.data.items;
      
      this.props.toggleShowFiles(false);
      this.props.changeSection(newSection);
      this.props.updateLoadingStatus(false);
    } catch (error) {
      this.props.updateError(error);
    }
  }

  onChange = async e => {
    const section = e.target.value;
    this.props.cleanFilters();
    this.props.updateIsProcessing(true);
    this.fetchData(section);
  };

  render() {
    return (
      <EuiSelect
        id="wzSelector"
        options={this.sections}
        value={this.props.state.section}
        onChange={this.onChange}
        aria-label="Section selector"
      />
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
    changeSection: section => dispatch(updateRulesetSection(section)),
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    toggleShowFiles: status => dispatch(toggleShowFiles(status)),
    cleanFilters: () => dispatch(cleanFilters()),
    updateError: error => dispatch(updateError(error)),
    updateIsProcessing: isProcessing =>
      dispatch(updateIsProcessing(isProcessing))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzSectionSelector);
