/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react'
import { Tactics, Techniques } from './components'; 
import { 
  EuiPage,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { ApiRequest } from '../../../react-services/api-request';
import { toastNotifications } from 'ui/notify';


export class Mitre extends Component {
  _isMount = false;
  state: {
    tacticsObject: object,
    selectedTactics: Array<any>
  }

  props: any;

  constructor(props) {
    super(props);
    this.state = {
      tacticsObject: {},
      selectedTactics: []
    }
  }

  
  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };


  async componentDidMount(){
    await this.buildTacticsObject();
  }


  async buildTacticsObject(){
    try{
      const data = await ApiRequest.request('GET', '/mitre', { select: "phase_name"});
      const result = (((data || {}).data || {}).data || {}).items;
      const tacticsObject = {};
      if(result){
        result.map( (item) => {
          const currentTechnique = item.id;
          const currentTactic = item.phase_name;
          currentTactic.map( (tactic) => {
            if(!tacticsObject[tactic]){ 
              tacticsObject[tactic] = [];
            }
            tacticsObject[tactic].push(currentTechnique);
          })
        });
      }
      this.setState({tacticsObject});

    }catch(err){
      this.showToast(
        'danger',
        'Error',
        `Mitre data could not be fetched: ${err}`,
        3000
      );
    }
  }


  render() {
    return (
      <EuiPage>
        <EuiPanel paddingSize="none">
          {Object.keys(this.state.tacticsObject).length && 
            <EuiFlexGroup>
              <EuiFlexItem grow={false} style={{width: "15%"}}>
                <Tactics tacticsObject={this.state.tacticsObject} />
              </EuiFlexItem>
              <EuiFlexItem>
                <Techniques selectedTactics={this.state.selectedTactics} tacticsObject={this.state.tacticsObject} />
              </EuiFlexItem>
            </EuiFlexGroup>
          }
        </EuiPanel>
      </EuiPage>
    );
  }
}

