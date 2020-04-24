/*
 * Wazuh app - React component for show search and filter
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
import { EuiButtonGroup } from '@elastic/eui';

export interface filterButton {
  label: string
  field: string
  value: string | number
  iconType?: string
}

export class WzSearchButtons extends Component {
  props!: {
    options: filterButton[]
    filters: {}
    onChange: Function
  };
  state: {
    IconSelectedMap: {}
  };

  constructor(props) {
    super(props);
    this.state = {
      IconSelectedMap: {},
    };
    this.onChange.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    const currenttFilters = JSON.stringify(this.props.filters);
    const nextFilters = JSON.stringify(nextProps.filters);
    return (currenttFilters === nextFilters);
  }

  componentDidUpdate() {
    this.checkFilters();
  }

  buildOptions() {
    const { options } = this.props;
    const buttonGroupOption = options.map((item, index) => {
      return {
        id: item.label,
        label: item.label,
        name: "options",
        ...(item.iconType && {iconType:item.iconType}),
      }
    });
    return buttonGroupOption;
  }

  onChange(optionId) {
    const { IconSelectedMap } = this.state;
    const newToggleIconIdToSelectedMap = {
      ...IconSelectedMap,
      ...{
        [optionId]: !IconSelectedMap[optionId],
      },
    };

    const result = this.changeFilters(optionId, !IconSelectedMap[optionId]);
    this.props.onChange(result);
    this.setState({
      IconSelectedMap: newToggleIconIdToSelectedMap,
    });
  }

  changeFilters(optionId, status) {
    const { options, filters } = this.props;
    const button = options.find(item => item.label === optionId) || {};

    if(status) {
      return {
        ...filters,
        [button['field']]: button['value']
      }
    } else {
      return delete filters[button['field']]
    }
  }

  checkFilters() {
    const { filters, options } = this.props;
    const { IconSelectedMap } = this.state;

    for (const button of options) {
      const filterExist = Object.keys(filters).find( 
        item => item === button.field && filters[item] === button.value
      );

      IconSelectedMap[button.label] = !!filterExist
    }
  }

  render() {
    const { IconSelectedMap } = this.state;
    const options = this.buildOptions();
    return (
      <EuiButtonGroup
        legend="Text align"
        name="textAlign"
        buttonSize="m"
        options={options}
        idToSelectedMap={IconSelectedMap}
        type="multi"
        onChange={this.onChange.bind(this)}
      />
    )
  }
}
