/*
 * Wazuh app - Filter handler class
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class FilterHandler {
  constructor(pattern) {
    this.pattern = pattern;
  }

  base() {
    return {
      meta: {
        removable: false,
        index: this.pattern,
        negate: false,
        disabled: false,
        alias: null,
        type: 'phrase',
        key: null,
        value: null,
        params: {
          query: null,
          type: 'phrase'
        }
      },
      query: {
        match: null
      },
      $state: {
        store: 'appState'
      }
    };
  }

  agentQuery(agent) {
    const result = this.base();
    result.meta.key = 'agent.id';
    result.meta.value = agent;
    result.meta.params.query = agent;
    result.query.match = {
      'agent.id': {
        query: agent,
        type: 'phrase'
      }
    };
    return result;
  }

  nodeQuery(node) {
    const result = this.base();
    result.meta.key = 'cluster.node';
    result.meta.value = node;
    result.meta.params.query = node;
    result.query.match = {
      'cluster.node': {
        query: node,
        type: 'phrase'
      }
    };
    return result;
  }

  ruleGroupQuery(group) {
    const result = this.base();
    result.meta.key = 'rule.groups';
    result.meta.value = group;
    result.meta.params.query = group;
    result.query.match = {
      'rule.groups': {
        query: group,
        type: 'phrase'
      }
    };
    return result;
  }

  ruleIdQuery(ruleId) {
    const result = this.base();
    result.meta.removable = true;
    result.meta.key = 'rule.id';
    result.meta.value = ruleId;
    result.meta.params.query = ruleId;
    result.query.match = {
      'rule.id': {
        query: ruleId,
        type: 'phrase'
      }
    };
    return result;
  }

  managerQuery(manager, isCluster) {
    const result = this.base();
    result.meta.key = isCluster ? 'cluster.name' : 'manager.name';
    result.meta.value = manager;
    result.meta.params.query = manager;
    result.query.match = isCluster
      ? {
          'cluster.name': {
            query: manager,
            type: 'phrase'
          }
        }
      : {
          'manager.name': {
            query: manager,
            type: 'phrase'
          }
        };
    return result;
  }

  pciQuery() {
    const result = this.base();
    result.meta.type = 'exists';
    result.meta.value = 'exists';
    result.meta.key = 'rule.pci_dss';
    result.exists = {
      field: 'rule.pci_dss'
    };
    delete result.query;
    return result;
  }

  gdprQuery() {
    const result = this.base();
    result.meta.type = 'exists';
    result.meta.value = 'exists';
    result.meta.key = 'rule.gdpr';
    result.exists = {
      field: 'rule.gdpr'
    };
    delete result.query;
    return result;
  }

  hipaaQuery() {
    const result = this.base();
    result.meta.type = 'exists';
    result.meta.value = 'exists';
    result.meta.key = 'rule.hipaa';
    result.exists = {
      field: 'rule.hipaa'
    };
    delete result.query;
    return result;
  }

  nistQuery() {
    const result = this.base();
    result.meta.type = 'exists';
    result.meta.value = 'exists';
    result.meta.key = 'rule.nist_800_53';
    result.exists = {
      field: 'rule.nist_800_53'
    };
    delete result.query;
    return result;
  }

  tscQuery() {
    const result = this.base();
    result.meta.type = 'exists';
    result.meta.value = 'exists';
    result.meta.key = 'rule.tsc';
    result.exists = {
      field: 'rule.tsc'
    };
    delete result.query;
    return result;
  }

  mitreQuery() {
    const result = this.base();
    result.meta.type = 'exists';
    result.meta.value = 'exists';
    result.meta.key = 'rule.mitre.id';
    result.exists = {
      field: 'rule.mitre.id'
    };
    delete result.query;
    return result;
  }
}
