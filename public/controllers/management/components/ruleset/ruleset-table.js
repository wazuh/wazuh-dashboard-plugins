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
  EuiBasicTable
} from '@elastic/eui';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';

class WzRulesetTable extends Component {
  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    try {
      const result = await this.props.wzReq('GET', '/rules', {});
      const items = result.data.data.items;
      this.setState({ items: items });
    } catch (error) {
      console.error('error mounting ', error)
    }
  }

  render() {
    const columns = this.props.state.rulesetReducers[this.props.state.rulesetReducers.section].columns
    const items = (this.state && this.state.items) ? [...this.state.items] : [];
    return (
      <EuiBasicTable
        itemId="id"
        items={items}
        columns={columns}
      />
    )
  }
}

WzRulesetTable.propTypes = {
  wzReq: PropTypes.func
};

const mapStateToProps = (state, ownProps) => {
  return {
    state: state
  };
};

export default connect(mapStateToProps)(WzRulesetTable);
