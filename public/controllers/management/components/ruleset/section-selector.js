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
import {
  EuiSelect
} from '@elastic/eui';

import { connect } from 'react-redux';
import {
  updateRulesetSection,
  updateLoadingStatus,
  updateItems,
  resetRuleset
} from '../../../../redux/actions/rulesetActions';

import { WzRequest } from '../../../../react-services/wz-request';

class WzSectionSelector extends Component {
  constructor(props) {
    super(props);

    this.sections = [
      { value: 'rules', text: 'Rules' },
      { value: 'decoders', text: 'Decoders' },
      { value: 'lists', text: 'CDB lists' },
    ];

    this.paths = {
      rules: '/rules',
      decoders: '/decoders',
      lists: '/lists/files'
    }

    this.wzReq = WzRequest;
  }

  componentWillUnmount() {
    // When the component is going to be unmounted the ruleset state is reset
    this.props.resetRuleset();
  }


  onChange = async e => {
    try {
      this.props.updateLoadingStatus(true);
      const section = e.target.value;
      const result = await this.wzReq.request('GET', this.paths[section], {})
      const items = result.data.data.items;
      this.props.updateItems(items);
      this.props.changeSection(section);
      this.props.updateLoadingStatus(false);
    } catch(error){
      console.error('Error updating sections an data ', error);
    }
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

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeSection: section => dispatch(updateRulesetSection(section)),
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateItems: items => dispatch(updateItems(items)),
    resetRuleset: () => dispatch(resetRuleset())
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzSectionSelector);
