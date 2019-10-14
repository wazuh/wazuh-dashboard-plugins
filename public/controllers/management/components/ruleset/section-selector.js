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
  updateRules,
  updateDecoders,
  updateLists,
  updateLoadingStatus
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

  onChange = async e => {
    try {
      this.props.updateLoadingStatus(true);
      const section = e.target.value;
      const result = await this.wzReq.request('GET', this.paths[section], {})
      const items = result.data.data.items;
      if (section === 'rules') this.props.updateRules(items);
      if (section === 'decoders') this.props.updateDecoders(items);
      if (section === 'lists') this.props.updateLists(items);
      this.props.changeSection(section);
      this.props.updateLoadingStatus(false);
    } catch(error){
      console.error('Error updating sections an data');
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
    updateRules: data => dispatch(updateRules(data)),
    updateDecoders: data => dispatch(updateDecoders(data)),
    updateLists: data => dispatch(updateLists(data)),
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status))
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzSectionSelector);
