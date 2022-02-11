/*
 * Wazuh app - React component for render no config.
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

import {
  EuiIcon,
  EuiHorizontalRule,
  EuiSpacer,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem
} from '@elastic/eui';

import WzHelpButtonPopover from './help-button-popover';

class WzNoConfig extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { error, help } = this.props;
    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <div style={{ textAlign: 'center' }}>
              <EuiIcon type="help" style={{ marginRight: '4px' }} />
                <span>Configuration not available</span>
              {help && <WzHelpButtonPopover links={help} />}
              <EuiHorizontalRule margin="s" />
              {(error === 'not-present' && (
                <p>This section is not present on the configuration file.</p>
              )) || (
                <span>
                  There was a problem while fetching the configuration for this
                  section. It may be a server problem or the configuration doesn't exist.
                </span>
              )}
              <EuiSpacer size="s" />
              <div>
                <p>
                  Click on the <EuiIcon type="questionInCircle" /> icon for
                  help. Check the documentation links to learn more about how to
                  configure it.
                </p>
              </div>
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}

WzNoConfig.propTypes = {
  error: PropTypes.string.isRequired,
  links: PropTypes.array
};

export default WzNoConfig;
