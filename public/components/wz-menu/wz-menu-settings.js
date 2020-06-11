/*
 * Wazuh app - React component for Settings submenu.
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
import { EuiFlexItem, EuiFlexGroup, EuiSideNav, EuiIcon, EuiButtonEmpty, EuiToolTip } from '@elastic/eui';
import { WzRequest } from '../../react-services/wz-request';
import { connect } from 'react-redux';
import { checkAdminMode } from '../../controllers/management/components/management/configuration/utils/wz-fetch';
import { updateAdminMode } from '../../redux/actions/appStateActions';
import { AppNavigate } from '../../react-services/app-navigate';
import chrome from 'ui/chrome';

class WzMenuSettings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // TODO: Fix the selected section
      selectedItemName: null
    };
    this.wzReq = WzRequest;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.section !== this.state.selectedItemName) {
      this.setState({ selectedItemName: nextProps.section });
    }
  }

  async componentDidMount() {
    try{
      const adminMode = await checkAdminMode();
      if(this.props.adminMode !== adminMode){
        this.props.updateAdminMode(adminMode);
      };
    }catch(error){}
  }

  avaibleSettings() {
    const {adminMode} = this.props;
    let auxSettings = {
      settings: { id: 'settings', text: 'Settings' },
      api: { id: 'api', text: 'API configuration' },
      modules: { id: 'modules', text: 'Modules' },
      sample_data: { id: 'sample_data', text: 'Sample Data' },
      configuration: { id: 'configuration', text: 'Configuration' },
      logs: { id: 'logs', text: 'Logs' },
      about: { id: 'about', text: 'About' },
    };
    if (!adminMode) {
      delete auxSettings.modules;
      delete auxSettings.sample_data;
    }
    return(auxSettings);
  }

  avaibleRenderSettings() {
    const {adminMode} = this.props;
    const avaibleSettings = this.avaibleSettings()
    let auxItems = [
      this.createItem(avaibleSettings.api),
      this.createItem(avaibleSettings.configuration),
      this.createItem(avaibleSettings.logs),
      this.createItem(avaibleSettings.about),
    ]
    if (adminMode) {
      auxItems.splice(1, 0, this.createItem(avaibleSettings.modules));
      auxItems.splice(1, 0, this.createItem(avaibleSettings.sample_data));
    }
    return(auxItems);
  }

  clickMenuItem = async(ev,section) => {
    this.props.closePopover();
    AppNavigate.navigateToModule(ev, 'settings', {tab: section} );
    if(this.props.currentMenuTab === 'settings'){
      const $injector = await chrome.dangerouslyGetActiveInjector();
      const router = $injector.get('$route');
      router.reload();
    }
  };

  createItem = (item, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: item.id,
      name: item.text,
      isSelected: this.props.state.section === item.id,
      onClick: () => {},
      onMouseDown: (ev) => this.clickMenuItem(ev, item.id)
    };
  };

  render() {
    const avaibleSettings = this.avaibleSettings()
    const renderSettings = this.avaibleRenderSettings()
    const sideNavAdmin = [
      this.createItem(avaibleSettings.settings, {
        disabled: true,
        icon: <EuiIcon type="gear" color="primary" />,
        items: renderSettings
      })
    ];


    return (
      <div className="WzManagementSideMenu" style={{ width: 200}}>
        <EuiFlexGroup responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiSideNav items={sideNavAdmin} style={{ padding: '4px 12px' }} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers,
    adminMode: state.appStateReducers.adminMode
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateAdminMode: adminMode => dispatch(updateAdminMode(adminMode))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzMenuSettings);
