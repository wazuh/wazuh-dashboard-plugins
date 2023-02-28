/*
 * Wazuh app - React component for show configuration of active response.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import WzTabSelector, {
  WzTabSelectorTab
} from '../util-components/tab-selector';
import WzConfigurationActiveResponseActiveResponse from './active-response-active-response';
import WzConfigurationActiveResponseCommands from './active-response-commands';
import withWzConfig from '../util-hocs/wz-config';

class WzConfigurationActiveResponse extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Fragment>
        <WzTabSelector>
          <WzTabSelectorTab label="Active response">
            <WzConfigurationActiveResponseActiveResponse {...this.props} />
          </WzTabSelectorTab>
          <WzTabSelectorTab label="Commands">
            <WzConfigurationActiveResponseCommands {...this.props} />
          </WzTabSelectorTab>
        </WzTabSelector>
      </Fragment>
    );
  }
}

const sections = [
  { component: 'analysis', configuration: 'command' },
  { component: 'analysis', configuration: 'active_response' }
];

WzConfigurationActiveResponse.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationActiveResponse);
