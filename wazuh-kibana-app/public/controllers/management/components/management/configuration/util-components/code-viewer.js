/*
 * Wazuh app - React component for code viewer in configuration.
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

import WzConfigurationSettingsHeader from './configuration-settings-header';
import WzCodeEditor from './code-editor';
import { getJSON, getXML } from '../utils/utils';

class WzCodeViewer extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const {
      title,
      mode,
      description,
      editorValue,
      view,
      settings,
      json,
      xml,
      help,
      height,
      minusHeight
    } = this.props;
    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title={title}
          description={description}
          viewSelected={view}
          settings={settings}
          json={json}
          xml={xml}
          help={help}
        />
        <WzCodeEditor
          mode={mode}
          value={editorValue}
          height={height}
          minusHeight={minusHeight}
          isReadOnly
        />
      </Fragment>
    );
  }
}

WzCodeViewer.propTypes = {
  title: PropTypes.string.isRequired,
  mode: PropTypes.string.isRequired,
  view: PropTypes.string.isRequired,
  editorValue: PropTypes.string.isRequired
};

export default WzCodeViewer;

export class WzSettingsViewer extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <WzCodeEditor
        mode={this.props.mode}
        value={(this.props.mode === 'json' ? getJSON : getXML)(
          this.props.value
        )}
        isReadOnly
        minusHeight={this.props.minusHeight}
      />
    );
  }
}
