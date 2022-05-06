/*
 * Wazuh app - React component for render settings, json and xml tab selector.
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

import WzConfigurationSettingsHeader from './configuration-settings-header';
import WzViewSelector, { WzViewSelectorSwitch } from './view-selector';
import { WzSettingsViewer } from './code-viewer';

class WzConfigurationSettingsTabSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: ''
    };
  }
  changeView(view) {
    this.setState({ view });
  }
  getTitleDescription(view) {
    const result = {};
    if (view === 'json') {
      result.title = 'JSON Viewer';
      result.description = 'View this configuration in raw JSON format';
    } else if (view === 'xml') {
      result.title = 'XML Viewer';
      result.description = 'View this configuration in raw XML format';
    } else {
      result.title = this.props.title;
      result.description = this.props.description;
    }
    return result;
  }

  render() {
    const { view } = this.state;
    const { currentConfig, helpLinks, children, minusHeight } = this.props;
    const { title, description } = this.getTitleDescription(view);
    const codeViewerMinusHeight = minusHeight !== undefined ? minusHeight : 280;
    
    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title={title}
          description={description}
          settings={() => this.changeView('')}
          json={() => this.changeView('json')}
          xml={() => this.changeView('xml')}
          viewSelected={view}
          help={helpLinks}
        />
        <WzViewSelector view={view}>
          <WzViewSelectorSwitch default>{children}</WzViewSelectorSwitch>
          <WzViewSelectorSwitch view="json">
            <WzSettingsViewer
              mode="json"
              value={currentConfig}
              minusHeight={codeViewerMinusHeight}
            />
          </WzViewSelectorSwitch>
          <WzViewSelectorSwitch view="xml">
            <WzSettingsViewer
              mode="xml"
              value={currentConfig}
              minusHeight={codeViewerMinusHeight}
            />
          </WzViewSelectorSwitch>
        </WzViewSelector>
      </Fragment>
    );
  }
}

export default WzConfigurationSettingsTabSelector;
