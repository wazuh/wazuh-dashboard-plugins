/*
 * Wazuh app - React component for build q queries.
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
import { EuiFlexGroup, EuiFlexItem, EuiIcon, EuiButtonEmpty, EuiButtonIcon } from '@elastic/eui';
import PropTypes from 'prop-types';
import './wz-menu.css';
import { AppState } from '../../react-services/app-state';
import {WzMisc} from '../../factories/misc';

export class WzMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentMenuTab: "",
      currentAPI: ""
    };
    console.log(WzMisc)
  }

  componentDidMount(){
    this.load();
  }

  componentDidUpdate(prevProps) {
    if(!this.state.currentAPI && JSON.parse(AppState.getCurrentAPI()).name || JSON.parse(AppState.getCurrentAPI()).name !== this.state.currentAPI ){
      this.setState( {currentAPI: JSON.parse(AppState.getCurrentAPI()).name })
    }
    
  }


  load(){
    //console.log(AppState.getNavigation().currLocation + " jk")
    if(!this.state.currentMenuTab &&  AppState.getNavigation().currLocation){
      this.setState( {currentMenuTab : AppState.getNavigation().currLocation.replace(/\//g, '')});
    }

  }

  setMenuItem(item){
    this.setState({currentMenuTab: item})
  }

  render() {
/*
    if(!this.state.currentMenuTab){
      this.setState( {currentMenuTab : AppState.getNavigation().currLocation.replace(/\//g, '')});
    }*/
    
    return (
      <div className="wz-menu-wrapper">
        <EuiFlexGroup className="wz-menu" responsive={false} direction="row">
            <EuiFlexItem grow={false} >
              <EuiFlexGroup style={{marginLeft: "10px", marginTop: "-6px"}}>
                      
              <EuiButtonEmpty
                className={"wz-menu-button " + (this.state.currentMenuTab === "overview" || this.state.currentMenuTab === "health-check" ? "wz-menu-active" : "")}
                color="text"
                href="#/overview"
                onClick={() => this.setMenuItem('overview')} >
                  <EuiIcon type='visualizeApp' color='primary' size='m' />
                  <span className="wz-menu-button-title "> Overview</span>
              </EuiButtonEmpty>

              <EuiButtonEmpty
                className={"wz-menu-button " + (this.state.currentMenuTab === "manager" ? "wz-menu-active" : "")}
                color="text"
                href="#/manager" 
                onClick={ () => this.setMenuItem('manager')}>
                  <EuiIcon type='managementApp' color='primary' size='m' />
                  <span className="wz-menu-button-title "> Management </span>
              </EuiButtonEmpty>

              <EuiButtonEmpty 
                className={"wz-menu-button " + (this.state.currentMenuTab === "agents-preview" || this.state.currentMenuTab === 'agents'  ? "wz-menu-active" : "")} 
                color="text"  
                href="#/agents-preview"
                onClick={ () => this.setMenuItem('agents-preview')}>
                  <EuiIcon type='watchesApp' color='primary' size='m' />
                  <span className="wz-menu-button-title "> Agents</span>
              </EuiButtonEmpty>
        
              <EuiButtonEmpty 
                className={"wz-menu-button " + (this.state.currentMenuTab === "wazuh-dev" ? "wz-menu-active" : "")} 
                color="text"  
                href="#/wazuh-dev"
                onClick={ () => this.setMenuItem('wazuh-dev')}>
                  <EuiIcon type='console' color='primary' size='m' />
                  <span className="wz-menu-button-title "> Dev Tools</span>
              </EuiButtonEmpty>


              </EuiFlexGroup>
            </EuiFlexItem>

            <EuiFlexItem></EuiFlexItem>
            <EuiFlexItem grow={false} style={{paddingTop: "6px", marginRight: "-4px"}}>
              {this.state.currentAPI && 
              (
                <span><EuiIcon type='starFilledSpace' color="primary" size='m'></EuiIcon> {this.state.currentAPI} </span>
              )
              }
              {!this.state.currentAPI && 
              (
                <span>- No API </span>
              )
              }
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginTop: "6px", marginRight: "1px"}}>
              <EuiButtonEmpty 
                className={"wz-menu-button" + (this.state.currentMenuTab === "settings" ? " wz-menu-active" : "")}
                href="#/settings"
                color="text"  
                aria-label="Settings"
                onClick={ () => this.setMenuItem('settings')}>
                  <EuiIcon type='advancedSettingsApp' color='primary' size='m' />
                  <span> </span>
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
      </div>
    );
  }
}

WzMenu.propTypes = { }
