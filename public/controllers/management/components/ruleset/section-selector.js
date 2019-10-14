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
import { changeRulesetSection } from '../../../../redux/actions/rulesetActions';


/**
 * The section must be a key of the options in order to match, example:
 * 
 *  const section = 'rules';
 *  const options = [
 *     { value: 'rules', text: 'Rules' },
 *     { value: 'decoders', text: 'Decoders' },
 *     { value: 'lists', text: 'CDB lists' },
 *    ];
 * 
 */

class WzSectionSelector extends Component {
  constructor(props) {
    super(props);
  }

  onChange = e => {
    const section = e.target.value;
    this.props.changeSection(section);
  };


  render() {
    return (
      <EuiSelect
        id="wzSelector"
        options={this.props.state.rulesetReducers.sections}
        value={this.props.state.rulesetReducers.section}
        onChange={this.onChange}
        aria-label="Section selector"
      />
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeSection: section => dispatch(changeRulesetSection(section))
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(WzSectionSelector);
