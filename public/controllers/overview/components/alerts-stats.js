/*
 * Wazuh app - React component for alerts stats.
 *
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
import { visualizations } from '../../../components/visualize/visualizations';
import PropTypes from 'prop-types';
import { EuiStat, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { connect } from 'react-redux';
import { getServices } from 'plugins/kibana/discover/kibana_services';
import { buildPhrasesFilter, buildRangeFilter } from '../../../../../../src/plugins/data/common';
import { esFilters } from '../../../../../../src/plugins/data/common';
import { getIndexPattern } from '../../../../public/components/overview/mitre/lib';
import '../../../../public/less/loader';


class AlertsStats extends Component {
  constructor(props) {
    super(props);
    this.visualizations = visualizations;
    this.state = {
      items: [],
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.state) {
      nextProps.items.forEach(x => {
        x.value = nextProps.state[x.id] || '-';
      });
    }
    this.setState({
      items: nextProps.items
    });
  }

  async componentDidMount() {
    const indexPattern = await getIndexPattern();
    this.setState({indexPattern: indexPattern})
  }

  buildStats() {
    const stats = (this.state.items || []).map((item, index) => {
      const title = typeof item.value !== 'undefined' ? item.value : '-';
      let auxFunction;
      switch(item.description) {
        case 'Level 12 or above alerts':
            auxFunction = () => this.filterLevel()
          break;
        case 'Authentication failure':
            auxFunction = () => this.filterAuthenticationFailure()
          break;
        case 'Authentication success':
          auxFunction = () => this.filterAuthenticationSuccess()
          break;
        default:
          auxFunction = () => {}
      }
      return (
        <EuiFlexItem key={`${item.description}${title}`}>
          <EuiStat
            title={<span className={index !== 0 && this.props.tab === 'general' ? 'cursor-pointer' : 'cursor-default' }>{title}</span>}
            description={item.description}
            titleColor={item.color || 'primary'}
            textAlign="center"
            onClick={() => item.value !== '-' && auxFunction()}
          />
        </EuiFlexItem>
      );
    });
    return stats;
  }

  addFilter(filter) {    
    const { filterManager } = getServices();
    const matchPhrase = {};
    matchPhrase[filter.key] = filter.value;
    const newFilter = {
      "meta": {
        "disabled": false,
        "key": filter.key,
        "params": { "query": filter.value },
        "type": "phrase",
        "negate": filter.negate || false,
        "index": "wazuh-alerts-3.x-*"
      },
      "query": { "match_phrase": matchPhrase },
      "$state": { "store": "appState" }
    }
    filterManager.addFilters([newFilter]);
  }

  filterLevel() {
    const { indexPattern } = this.state;
    const { filterManager } = getServices();
    const valuesArray = {gte: 12, lt: null};
    const filters = {
      ...buildRangeFilter({ name: "rule.level", type: "integer" }, valuesArray, indexPattern),
      "$state": { "store": "appState" }
    }
    filterManager.addFilters(filters);
  }

  filterAuthenticationFailure() {
    const { indexPattern } = this.state;
    const { filterManager } = getServices();
    const valuesArray = ["win_authentication_failed", "authentication_failed", "authentication_failures"];
    const filters = {
      ...buildPhrasesFilter({ name: "rule.groups", type: "string" }, valuesArray, indexPattern),
      "$state": { "store": "appState" }
    }
    filterManager.addFilters(filters);
  }

  filterAuthenticationSuccess() {
    this.addFilter({key: 'rule.groups', value: "authentication_success", negate: false} );
  }

  render() {
    const items = this.buildStats();
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem />
          {items}
          <EuiFlexItem />
        </EuiFlexGroup>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.visualizationsReducers
  };
};

export default connect(mapStateToProps)(AlertsStats);

AlertsStats.propTypes = {
  items: PropTypes.array,
  tab: PropTypes.string
};
