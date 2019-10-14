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

const initialState = {
  section: 'rules',
  sections: [
    { value: 'rules', text: 'Rules' },
    { value: 'decoders', text: 'Decoders' },
    { value: 'lists', text: 'CDB lists' },
  ],
  rules: {
    columns: [
      {
        field: 'id',
        name: 'ID',
        align: 'left',
        sortable: true
      },
      {
        field: 'description',
        name: 'Description',
        align: 'left',
        sortable: true
      },
      {
        field: 'groups',
        name: 'Groups',
        align: 'left',
        sortable: true
      },
      {
        field: 'pci',
        name: 'PCI',
        align: 'left',
        sortable: true
      },
      {
        field: 'gdpr',
        name: 'GDPR',
        align: 'left',
        sortable: true
      },
      {
        field: 'hipaa',
        name: 'HIPAA',
        align: 'left',
        sortable: true
      },
      {
        field: 'nist-800-53',
        name: 'NIST 800-53',
        align: 'left',
        sortable: true
      },
      {
        field: 'level',
        name: 'Level',
        align: 'left',
        sortable: true
      },
      {
        field: 'field',
        name: 'Field',
        align: 'left',
        sortable: true
      }
    ]
  },
  decoders: {
    columns: [
      {
        field: 'id',
        name: 'ID',
        align: 'left',
        sortable: true
      },
      {
        field: 'description',
        name: 'Description',
        align: 'left',
        sortable: true
      },
      {
        field: 'field',
        name: 'Field',
        align: 'left',
        sortable: true
      }
    ]
  }
}

const rulesetReducers = (state = initialState, action) => {
  switch (action.type) {
    //Changes the ruleset section
    case 'CHANGE_RULESET_SECTION':
      state.section = action.section;
      //return Object.assign({}, state, {ruleset: {section: action.section}});
      return Object.assign({}, state);
    default:
      return state;
  }
}

export default rulesetReducers;