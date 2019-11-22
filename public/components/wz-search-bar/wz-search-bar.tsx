/*
 * Wazuh app - React component for show search and filter in the rules,decoder and CDB lists.
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
import PropTypes, {InferProps} from 'prop-types';
import { EuiSuggest } from '../eui-suggest';
import { WzSearchFormatSelector } from './wz-search-format-selector'

export default class WzSearchBar extends Component {
  state: {
    searchFormat: string
  }
  props!:{
    status: string
    suggestions: JSX.Element
    onInputChange: Function
  }

  constructor(props) {
    super(props);
    this.state = {
      searchFormat: '?Q'
    }
  }

  
  onChangeSearchFormat = (format) => {console.log(format)}

  render() {
    const {status, suggestions, onInputChange} = this.props

    return <EuiSuggest
      status={status}
      append={<WzSearchFormatSelector onChange={this.onChangeSearchFormat}/>}
      suggestions={suggestions}
      onInputChange={onInputChange}
    />;
  }
}
