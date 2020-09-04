/*
 * Wazuh app - Integrity monitoring components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { Component } from 'react';
import { getAngularModule } from '../../../../../../src/plugins/discover/public/kibana_services';
import { ModulesHelper } from './modules-helper'

export class Dashboard extends Component {
  _isMount = false;
  constructor(props) {
    super(props);
    this.modulesHelper = ModulesHelper;
  }

  async componentDidMount() {
    this._isMount = true;
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    const app = getAngularModule('app/wazuh');
    this.$rootScope = app.$injector.get('$rootScope');
    this.$rootScope.showModuleDashboard = this.props.section;
    await this.modulesHelper.getDiscoverScope();
    if (this._isMount) {
      this.$rootScope.moduleDiscoverReady = true;
      this.$rootScope.$applyAsync();
    }
  }

  componentWillUnmount() {
    this._isMount = false;
    this.$rootScope.showModuleDashboard = false;
    this.$rootScope.moduleDiscoverReady = false;
    this.$rootScope.$applyAsync();
  }

  render() {
    return false;
  }
}
