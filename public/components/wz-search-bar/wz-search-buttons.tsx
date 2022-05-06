/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { IFilter } from './';

export interface filterButton {
  label: string
  field: string
  value: string | number
  iconType?: string
}
const combine = (...args) => (input) => args.reduceRight((acc, arg) => acc = arg(acc), input)

export class WzSearchButtons extends Component {
  props!: {
    options: filterButton[]
    filters: IFilter[]
    onChange: Function
  };
  state: {
    IconSelectedMap: {},
    options: { [label: string]: IFilter }
  };

  constructor(props) {
    super(props);
    this.state = {
      IconSelectedMap: {},
      options: {}
    };
    this.onChange.bind(this);
    this.toggleIcon.bind(this);
    this.updateFilters.bind(this);
  }

  componentDidMount() {
    const options = this.props.options
      .reduce((acc, option) => ({ ...acc, [option.label]: option }), {})
    this.setState({ options });
  }

  shouldComponentUpdate(nextProps) {
    const currenttFilters = JSON.stringify(this.props.filters);
    const nextFilters = JSON.stringify(nextProps.filters);
    return (currenttFilters === nextFilters);
  }

  componentDidUpdate() {
    this.checkFilters();
  }

  buildOptions = () => this.props.options.map((item) => ({
    id: item.label,
    label: item.label,
    name: "options",
    ...(item.iconType && { iconType: item.iconType }),
  }));

  onChange = optionId => combine(this.props.onChange, this.updateFilters, this.toggleIcon)(optionId);

  toggleIcon = (optionId) => {
    const { IconSelectedMap } = this.state;
    return { ...IconSelectedMap, [optionId]: !IconSelectedMap[optionId] };
  }

  updateFilters = (IconSelectedMap) => {
    const { options } = this.state;
    const { filters } = this.props;
    return Object.keys(IconSelectedMap).reduce((acc: IFilter[], label) => {
      const newFilters = [...filters];
      const { field, value } = options[label];
      const filterIdx = filters.findIndex(filter => filter.field === field);
      (filterIdx !== -1 && !IconSelectedMap[label]) 
      ? newFilters.splice(filterIdx, 1)
      : newFilters.push({ field, value })
      return newFilters;
    }, filters)
  }

  checkFilters() {
    const { filters, options } = this.props;
    const { IconSelectedMap } = this.state;
    for (const button of options) {
      const filterExist = filters.find(
        filter => filter.field === button.field && filter.value === button.value
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
