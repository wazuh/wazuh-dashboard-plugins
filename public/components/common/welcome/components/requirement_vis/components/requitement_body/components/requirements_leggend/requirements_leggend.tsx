/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// @ts-ignore
import React from "react";
import { EuiIcon } from "@elastic/eui";
import { EuiListGroup } from "@elastic/eui";
import './requirements_leggend.scss';
import rison from 'rison-node';
import { buildPhraseFilter } from '../../../../../../../../../../../../src/plugins/data/common';
import { getIndexPattern } from '../../../../../../../../overview/mitre/lib';
import store from '../../../../../../../../../redux/store';
import { updateCurrentAgentData } from '../../../../../../../../../redux/actions/appStateActions';
import { getAngularModule } from '../../../../../../../../../kibana-services';

export function Requirements_leggend({ data, colors, requirement, agent }) {
  const list = data.map((item, idx) => ({
    label: `${item.key} (${item.doc_count})`,
    icon: <EuiIcon type="dot" size='l' color={colors[idx]} />,
    onClick: () => (requirement === 'gpg13' ? undefined : goToDashboardWithFilter(requirement, item, agent)),
    size: 'xs',
    color: 'text',
  }));

  return (
    <EuiListGroup
      className="wz-list-group"
      listItems={list}
      color='text'
      flush />
  );
}

const goToDashboardWithFilter = (requirement, item, agent) => {
  store.dispatch(updateCurrentAgentData(agent));
  const $injector = getAngularModule().$injector;
  const route = $injector.get('$route');
  getIndexPattern().then(indexPattern => {
    const filters = [{
      ...buildPhraseFilter({ name: `rule.${requirement}`, type: 'text' }, item.key, indexPattern),
      "$state": { "isImplicit": false, "store": "appState" },
    }]
    const _w = { filters };
    const params = {
      tab: tabEquivalence[requirement],
      _w: rison.encode(_w)
    };
    const url = Object.entries(params).map(e => e.join('=')).join('&');
    window.location.href = `#/overview?${url}`;
    route.reload();
  });  
}

const tabEquivalence = {
  'pci_dss': 'pci',
  'gdpr': 'gdpr',
  'nist_800_53': 'nist',
  'hipaa': 'hipaa',
  'gpg13': '',
  'tsc': 'tsc',
}