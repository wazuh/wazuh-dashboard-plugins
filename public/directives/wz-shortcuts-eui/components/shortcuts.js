/*
 * Wazuh app - React component for shortcuts bar.
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import { EuiKeyPadMenuItemButton, EuiIcon } from '@elastic/eui';

export class Shortcuts extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedShortcutId: false
    };
  }

  idOpened = shortcut => {
    return shortcut.isOpen && shortcut.id !== 'add';
  }

  onSelectedShortcutChanged = shortcut => {
    shortcut.action();
    this.setState({
      selectedShortcutId: shortcut.isOpen && shortcut.id !== 'add' ? shortcut.id : false
    });
  };

  renderShortcuts() {
    return this.props.shortcuts.map((shortcut, index) => (
<EuiKeyPadMenuItemButton
label={shortcut.name}
key={index}
betaBadgeIconType={this.idOpened(shortcut) ? 'cross' : ''}
betaBadgeLabel={this.idOpened(shortcut) ? 'Close' : ''}
onClick={() => this.onSelectedShortcutChanged(shortcut)}>
<EuiIcon type={shortcut.icon} size="l" />
</EuiKeyPadMenuItemButton>
    ));
  }

  render() {
    return (
      <Fragment>
        {this.renderShortcuts()}
      </Fragment>
    );
  }
}

Shortcuts.propTypes = {
  shortcuts: PropTypes.array
};
