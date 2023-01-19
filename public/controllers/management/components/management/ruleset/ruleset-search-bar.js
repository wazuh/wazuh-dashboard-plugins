/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2022 Wazuh, Inc.
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

import { i18n } from '@kbn/i18n';

import {
  updateFilters,
  updateIsProcessing,
} from '../../../../../redux/actions/rulesetActions';
import { WzRequest } from '../../../../../react-services/wz-request';
import { WzSearchBar } from '../../../../../components/wz-search-bar';

class WzRulesetSearchBar extends Component {
  constructor(props) {
    super(props);
  }

  rulesItems = [
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.status',
        {
          defaultMessage: 'status',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.status1',
        {
          defaultMessage: 'Filters the rules by status.',
        },
      ),
      values: ['enabled', 'disabled'],
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.group',
        {
          defaultMessage: 'group',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.group1',
        {
          defaultMessage: 'Filters the rules by group',
        },
      ),
      values: async value => {
        const filter = { limit: 30 };
        if (value) {
          filter['search'] = value;
        }
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/groups', filter);
        return (((result || {}).data || {}).data || {}).affected_items;
      },
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.level',
        {
          defaultMessage: 'level',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.rulefile',
        {
          defaultMessage: 'Filters the rules by level',
        },
      ),
      values: [...Array(16).keys()],
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.filename3',
        {
          defaultMessage: 'filename',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.filterRule',
        {
          defaultMessage: 'Filters the rules by file name.',
        },
      ),
      values: async value => {
        const filter = { limit: 30 };
        if (value) {
          filter['search'] = value;
        }
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/files', filter);
        return (((result || {}).data || {}).data || {}).affected_items.map(
          item => {
            return item.filename;
          },
        );
      },
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.relativedirname',
        {
          defaultMessage: 'relative_dirname',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.pathRules',
        {
          defaultMessage: 'Path of the rules files',
        },
      ),
      values: async value => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/manager/configuration', {
          params: {
            section: 'ruleset',
            field: 'rule_dir',
          },
        });
        return (((result || {}).data || {}).data || {}).affected_items[0]
          .ruleset.rule_dir;
      },
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.hipaa',
        {
          defaultMessage: 'hipaa',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.hipaaReq',
        {
          defaultMessage: 'Filters the rules by HIPAA requirement',
        },
      ),
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/requirement/hipaa', {});
        return (((result || {}).data || {}).data || {}).affected_items;
      },
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.gdpr',
        {
          defaultMessage: 'gdpr',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.gdprReq',
        {
          defaultMessage: 'Filters the rules by GDPR requirement',
        },
      ),
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/requirement/gdpr', {});
        return (((result || {}).data || {}).data || {}).affected_items;
      },
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.nist-800-53',
        {
          defaultMessage: 'nist-800-53',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.nist',
        {
          defaultMessage: 'Filters the rules by NIST requirement',
        },
      ),
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/requirement/nist-800-53', {});
        return (((result || {}).data || {}).data || {}).affected_items;
      },
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.gpg13',
        {
          defaultMessage: 'gpg13',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.gpg',
        {
          defaultMessage: 'Filters the rules by GPG requirement',
        },
      ),
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/requirement/gpg13', {});
        return (((result || {}).data || {}).data || {}).affected_items;
      },
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.pci_dss',
        {
          defaultMessage: 'pci_dss',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.rulesDss',
        {
          defaultMessage: 'Filters the rules by PCI DSS requirement',
        },
      ),
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/requirement/pci_dss', {});
        return (((result || {}).data || {}).data || {}).affected_items;
      },
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.tsc',
        {
          defaultMessage: 'tsc',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.tscReq',
        {
          defaultMessage: 'Filters the rules by TSC requirement',
        },
      ),
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/requirement/tsc', {});
        return (((result || {}).data || {}).data || {}).affected_items;
      },
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.mitre',
        {
          defaultMessage: 'mitre',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.req',
        {
          defaultMessage: 'Filters the rules by MITRE requirement',
        },
      ),
      values: async () => {
        const result = await WzRequest.apiReq(
          'GET',
          '/rules/requirement/mitre',
          {},
        );
        return (((result || {}).data || {}).data || {}).affected_items;
      },
    },
  ];
  rulesFiles = [
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.filename',
        {
          defaultMessage: 'filename',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.filter',
        {
          defaultMessage: 'Filters the rules by file name.',
        },
      ),
      values: async value => {
        const filter = { limit: 30 };
        if (value) {
          filter['search'] = value;
        }
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/rules/files', filter);
        return (((result || {}).data || {}).data || {}).affected_items.map(
          item => {
            return item.filename;
          },
        );
      },
    },
  ];

  decodersItems = [
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.filename1',
        {
          defaultMessage: 'filename',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.fileName',
        {
          defaultMessage: 'Filters the decoders by file name.',
        },
      ),
      values: async value => {
        const filter = { limit: 30 };
        if (value) {
          filter['search'] = value;
        }
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/decoders/files', filter);
        return (((result || {}).data || {}).data || {}).affected_items.map(
          item => {
            return item.filename;
          },
        );
      },
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.relativedirname',
        {
          defaultMessage: 'relative_dirname',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.pathFiles',
        {
          defaultMessage: 'Path of the decoders files.',
        },
      ),
      values: async () => {
        const wzReq = (...args) => WzRequest.apiReq(...args);
        const result = await wzReq('GET', '/manager/configuration', {
          params: {
            section: 'ruleset',
            field: 'decoder_dir',
          },
        });
        return (((result || {}).data || {}).data || {}).affected_items[0]
          .ruleset.decoder_dir;
      },
    },
    {
      type: 'params',
      label: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.status',
        {
          defaultMessage: 'status',
        },
      ),
      description: i18n.translate(
        'wazuh.public.controller.management.ruleset.searchBar.decoder',
        {
          defaultMessage: 'Filters the decoders by status.',
        },
      ),
      values: ['enabled', 'disabled'],
    },
  ];

  apiSuggestsItems = {
    items: {
      rules: this.rulesItems,
      decoders: this.decodersItems,
      list: [],
    },
    files: {
      rule: this.rulesFiles,
      decoders: [],
      list: [],
    },
  };

  buttonOptions = {
    rules: [
      {
        label: i18n.translate(
          'wazuh.public.controller.management.ruleset.searchBar.Customrules',
          {
            defaultMessage: 'Custom rules',
          },
        ),
        field: 'relative_dirname',
        value: 'etc/rules',
      },
    ],
    decoders: [
      {
        label: i18n.translate(
          'wazuh.public.controller.management.ruleset.searchBar.Customdecoders',
          {
            defaultMessage: 'Custom decoders',
          },
        ),
        field: 'relative_dirname',
        value: 'etc/decoders',
      },
    ],
    list: [],
  };

  render() {
    const { section, showingFiles, filters } = this.props.state;
    const type = showingFiles ? 'files' : 'items';
    const suggestions = this.apiSuggestsItems[type][section] || [];
    const buttonOptions = this.buttonOptions[section];
    return (
      <WzSearchBar
        noDeleteFiltersOnUpdateSuggests
        suggestions={suggestions}
        buttonOptions={buttonOptions}
        placeholder={i18n.translate(
          'wazuh.public.controller.management.ruleset.searchBar.Filterorsearch',
          {
            defaultMessage: 'Filter or search',
          },
        )}
        filters={filters}
        onFiltersChange={this.props.updateFilters}
      />
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.rulesetReducers,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateFilters: filters => dispatch(updateFilters(filters)),
    updateIsProcessing: state => dispatch(updateIsProcessing(state)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzRulesetSearchBar);
