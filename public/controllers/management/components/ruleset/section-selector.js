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

import PropTypes from 'prop-types';


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

export class WzSectionSelector extends Component {
  constructor(props) {
    super(props);

    this.state = {
      section: this.props.section
    }

    this.options = this.props.options;
  }

  componentDidMount() {
    console.log('SectionSelector mounted ', this.state);
    console.log('Options ', this.options)
  }

  onChange = e => {
    this.setState({
      section: e.target.value,
    });
  };


  render() {
    return (
      <EuiSelect
        id="wzSelector"
        options={this.options}
        value={this.state.section}
        onChange={this.onChange}
        aria-label="Section selector"
      />
    );
  }
}

WzSectionSelector.propTypes = {
  section: PropTypes.string,
  options: PropTypes.array
};