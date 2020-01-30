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
import { connect } from 'react-redux';

import { updateFilters, updateIsProcessing } from '../../../../../redux/actions/rulesetActions';
import { WzRequest } from '../../../../../react-services/wz-request';
import WzSearchBar from '../../../../../components/wz-search-bar/wz-search-bar';


class WzRulesetSearchBar extends Component {
  constructor(props) {
    super(props)
  }

  rulesItems = [
    {
      label: 'status',
      description: 'Filters the rules by status.',
      values: ['enabled', 'disabled'],
    },
    {
      label: 'group',
      description: 'Filters the rules by group',
      values: async (value) => {
        const filter = {limit:30};
        if (value){
          filter['search'] = value;
        }
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/groups', filter);
        return (((result || {}).data || {}).data || {}).items;
      },
    },
    {
      label: 'level',
      description: 'Filters the rules by level',
      values: [...Array(16).keys()],
    },
    {
      label: 'file',
      description: 'Filters the rules by file name.',
      values: async (value) => {
        const filter = {limit:30};
        if (value){
          filter['search'] = value;
        }
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/files', filter);
        return (((result || {}).data || {}).data || {}).items.map((item) => {return item.file});
      },
    },
    {
      label: 'path',
      description: 'Path of the rules files',
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/manager/configuration', {
          section:'ruleset',
          field: 'rule_dir',
        });
        console.log(result.data)
        return ((result || {}).data || {}).data;
      }
    },
    {
      label: 'hipaa',
      description: 'Filters the rules by HIPAA',
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/hipaa', {});
        console.log(result.data)
        return (((result || {}).data || {}).data || {}).items;
      }
    },
    {
      label: 'gdpr',
      description: 'Filters the rules by HIPAA',
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/gdpr', {});
        console.log(result.data)
        return (((result || {}).data || {}).data || {}).items;
      }
    },
    {
      label: 'nist-800-53',
      description: 'Filters the rules by HIPAA',
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/nist-800-53', {});
        console.log(result.data)
        return (((result || {}).data || {}).data || {}).items;
      }
    },
    {
      label: 'gpg13',
      description: 'Filters the rules by HIPAA',
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/gpg13', {});
        console.log(result.data)
        return (((result || {}).data || {}).data || {}).items;
      }
    },
    {
      label: 'pci',
      description: 'Filters the rules by HIPAA',
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/pci', {});
        console.log(result.data)
        return (((result || {}).data || {}).data || {}).items;
      }
    },
  ]
  rulesFiles = [
    {
      label: 'file',
      description: 'Filters the rules by file name.',
      values: async (value) => {
        const filter = {limit:30};
        if (value){
          filter['search'] = value;
        }
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/files', filter);
        return (((result || {}).data || {}).data || {}).items.map((item) => {return item.file});
      },
    },
  ];

  decodersItems = [
    {
      label: 'file',
      description: 'Filters the decoders by file name.',
      values: async (value) => {
        const filter = {limit:30};
        if (value){
          filter['search'] = value;
        }
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/decoders/files', filter);
        return (((result || {}).data || {}).data || {}).items.map((item) => {return item.file});
      },
    },
    {
      label: 'path',
      description: 'Path of the decoders files.',
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/manager/configuration', {
          section:'ruleset',
          field: 'decoder_dir',
        });
        return ((result || {}).data || {}).data;
      }
    },
    {
      label: 'status',
      description: 'Filters the decoders by status.',
      values: ['enabled', 'disabled'],
    },
  ]

  apiSuggestsItems = {
    items: {
      rules: this.rulesItems,
      decoders: this.decodersItems,
      list: []
    },
    files: {
      rule: this.rulesFiles,
      decoders: [],
      list: []
    }
  }

  buttonOptions = {
    rules: [{label: "Custom rules", field:"path", value:"etc/rules"}, ],
    decoders: [{label: "Custom decoders", field:"path", value:"etc/decoders"}, ],
    list: []
  }
  

  render() {
    const { section, showingFiles } = this.props.state;
    const type = showingFiles ? 'files' : 'items';
    const apiSuggests = this.apiSuggestsItems[type][section];
    const buttonOptions = this.buttonOptions[section];
    return (
    <WzSearchBar
      apiSuggests={apiSuggests}
      onInputChange={this.props.updateFilters}
      placeholder={"Add filter or search"} 
      buttonOptions={buttonOptions}
      noDeleteFiltersOnUpdateSuggests={true} />
    )
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.rulesetReducers,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateFilters: filters => dispatch(updateFilters(filters)),
    updateIsProcessing: state => dispatch(updateIsProcessing(state)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetSearchBar);
