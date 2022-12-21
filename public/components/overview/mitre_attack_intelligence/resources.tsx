/*
 * Wazuh app - Mitre Att&ck resources.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from '../../../react-services';
import { Markdown } from '../../common/util';
import { formatUIDate } from '../../../react-services';
import React from 'react';
import { EuiLink } from '@elastic/eui';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

const getMitreAttackIntelligenceSuggestions = (endpoint: string, field: string) => async (input: string) => {
  try{
    const response = await WzRequest.apiReq('GET', endpoint, {});
    return response?.data?.data.affected_items
      .map(item => item[field])
      .filter(item => item && item.toLowerCase().includes(input.toLowerCase()))
      .sort()
      .slice(0,9)
  }catch(error){
    const options = {
      context: `${ModuleMitreAttackIntelligenceResource.name}.getMitreItemToRedirect`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      display: true,
      error: {
        error: error,
        message: error.message || error,
        title: `Error getting suggestions`,
      },
    };
    getErrorOrchestrator().handleError(options);
    return [];
  };
};

function buildResource(label: string, labelResource: string){
  const id = label.toLowerCase();
  const endpoint: string = `/mitre/${id}`;
  return {
    label: label,
    id,
    searchBarSuggestions: [
      {
        type: 'q',
        label: 'description',
        description: `${labelResource} description`,
        operators: ['~'],
        values: (input) => input ? [input] : []
      },
      {
        type: 'q',
        label: 'name',
        description: `${labelResource} name`,
        operators: ['=', '!='],
        values: getMitreAttackIntelligenceSuggestions(endpoint, 'name')
      },
      {
        type: 'q',
        label: 'external_id',
        description: `${labelResource} ID`,
        operators: ['=', '!='],
        values: getMitreAttackIntelligenceSuggestions(endpoint, 'external_id')
      }
    ],
    apiEndpoint: endpoint,
    fieldName: 'name',
    initialSortingField: 'name',
    tableColumnsCreator: (openResourceDetails) => [
      {
        field: 'external_id',
        name: 'ID',
        width: '12%',
        render: (value, item) => <EuiLink onClick={() => openResourceDetails(item)}>{value}</EuiLink>
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        width: '30%',
        render: (value, item) => <EuiLink onClick={() => openResourceDetails(item)}>{value}</EuiLink>
      },
      {
        field: 'description',
        name: 'Description',
        sortable: true,
        render: (value) => value ? <Markdown markdown={value} /> : '',
        truncateText: true
      }
    ],
    mitreFlyoutHeaderProperties: [
      {
        label: 'ID',
        id: 'external_id',
      },
      {
        label: 'Name',
        id: 'name'
      },
      {
        label: 'Created Time',
        id: 'created_time',
        render: (value) => value ? (
          formatUIDate(value)
        ) : ''
      },
      {
        label: 'Modified Time',
        id: 'modified_time',
        render: (value) => value ? (
          formatUIDate(value)
        ) : ''
      },
      {
        label: 'Version',
        id: 'mitre_version'
      },
    ],
  }
};

export const MitreAttackResources = [
  buildResource('Groups', 'Group'),
  buildResource('Mitigations', 'Mitigation'),
  buildResource('Software', 'Software'),
  buildResource('Tactics', 'Tactic'),
  buildResource('Techniques', 'Technique')
];
