/*
 * Wazuh app - React component for registering agents.
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
// Redux
import store from '../../../../redux/store';
import WzReduxProvider from '../../../../redux/wz-redux-provider';
//Wazuh ruleset tables(rules, decoder, lists)
import WzRulesetOverview from './ruleset-overview';
//Information about rule or decoder
import WzRuleInfo from './rule-info';
import WzDecoderInfo from './decoder-info';
import WzRulesetEditor from './ruleset-editor';

export default class WzRuleset extends Component {
  constructor(props) {
    super(props);
    this.state = {}; //Init state empty to avoid fails when try to read any parameter and this.state is not defined yet
    this.store = store;
  }

  UNSAFE_componentWillMount() {
    this.store.subscribe(() => {
      const state = this.store.getState().rulesetReducers;
      this.setState(state);
    });
  }

  componentWillUnmount() {
    // When the component is going to be unmounted the ruleset state is reset
    const { ruleInfo, decoderInfo, listInfo, fileContent, addingRulesetFile } = this.state;
    if (!ruleInfo && !decoderInfo && !listInfo && !fileContent, !addingRulesetFile) this.store.dispatch({ type: 'RESET' });
  }


  render() {
    const { ruleInfo, decoderInfo, listInfo, fileContent, addingRulesetFile } = this.state;

    return (
      <WzReduxProvider>
        {
          ruleInfo && (<WzRuleInfo />)
          || decoderInfo && (<WzDecoderInfo />)
          || listInfo && (<h3>LIST INFO</h3>)
          || (fileContent || addingRulesetFile) && (<WzRulesetEditor />)
          || (<WzRulesetOverview />)
        }
      </WzReduxProvider>
    )
  }
}

