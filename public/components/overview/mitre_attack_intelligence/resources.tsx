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
import { i18n } from '@kbn/i18n';

const getMitreAttackIntelligenceSuggestions =
  (endpoint: string, field: string) => async (input: string) => {
    try {
      const response = await WzRequest.apiReq('GET', endpoint, {});
      return response?.data?.data.affected_items
        .map(item => item[field])
        .filter(
          item => item && item.toLowerCase().includes(input.toLowerCase()),
        )
        .sort()
        .slice(0, 9);
    } catch (error) {
      const options = {
        context: `${ModuleMitreAttackIntelligenceResource.name}.getMitreItemToRedirect`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: i18n.translate(
            'wazuh.public.components.overview.mitre.attack.resources.error',
            {
              defaultMessage: 'Error getting suggestions',
            },
          ),
        },
      };
      getErrorOrchestrator().handleError(options);
      return [];
    }
  };

function buildResource(label: string, labelResource: string) {
  const id = label.toLowerCase();
  const endpoint: string = `/mitre/${id}`;
  return {
    label: label,
    id,
    searchBarSuggestions: [
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.components.overview.mitre.attack.resources.description',
          {
            defaultMessage: 'description',
          },
        ),
        description: `${labelResource} description`,
        operators: ['~'],
        values: input => (input ? [input] : []),
      },
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.components.overview.mitre.attack.resources.name',
          {
            defaultMessage: 'name',
          },
        ),
        description: `${labelResource} name`,
        operators: ['=', '!='],
        values: getMitreAttackIntelligenceSuggestions(endpoint, 'name'),
      },
      {
        type: 'q',
        label: i18n.translate(
          'wazuh.public.components.overview.mitre.attack.resources.externalId',
          {
            defaultMessage: 'external_id',
          },
        ),
        description: `${labelResource} ID`,
        operators: ['=', '!='],
        values: getMitreAttackIntelligenceSuggestions(endpoint, 'external_id'),
      },
    ],
    apiEndpoint: endpoint,
    fieldName: 'name',
    initialSortingField: 'name',
    tableColumnsCreator: openResourceDetails => [
      {
        field: 'external_id',
        name: i18n.translate(
          'wazuh.public.components.overview.mitre.attack.resources.ID',
          {
            defaultMessage: 'ID',
          },
        ),
        width: '12%',
        render: (value, item) => (
          <EuiLink onClick={() => openResourceDetails(item)}>{value}</EuiLink>
        ),
      },
      {
        field: 'name',
        name: i18n.translate(
          'wazuh.public.components.overview.mitre.attack.resources.Name',
          {
            defaultMessage: 'Name',
          },
        ),
        sortable: true,
        width: '30%',
        render: (value, item) => (
          <EuiLink onClick={() => openResourceDetails(item)}>{value}</EuiLink>
        ),
      },
      {
        field: 'description',
        name: i18n.translate(
          'wazuh.public.components.overview.mitre.attack.resources.Description',
          {
            defaultMessage: 'Description',
          },
        ),
        sortable: true,
        render: value => (value ? <Markdown markdown={value} /> : ''),
        truncateText: true,
      },
    ],
    mitreFlyoutHeaderProperties: [
      {
        label: i18n.translate(
          'wazuh.public.components.overview.mitre.attack.resources.ID',
          {
            defaultMessage: 'ID',
          },
        ),
        id: 'external_id',
      },
      {
        label: i18n.translate(
          'wazuh.public.components.overview.mitre.attack.resources.Name',
          {
            defaultMessage: 'Name',
          },
        ),
        id: 'name',
      },
      {
        label: i18n.translate(
          'wazuh.public.components.overview.mitre.attack.resources.createdTime',
          {
            defaultMessage: 'Created Time',
          },
        ),
        id: 'created_time',
        render: value => (value ? formatUIDate(value) : ''),
      },
      {
        label: i18n.translate(
          'wazuh.public.components.overview.mitre.attack.resources.modifiedTime',
          {
            defaultMessage: 'Modified Time',
          },
        ),
        id: 'modified_time',
        render: value => (value ? formatUIDate(value) : ''),
      },
      {
        label: i18n.translate(
          'wazuh.public.components.overview.mitre.attack.resources.Version',
          {
            defaultMessage: 'Version',
          },
        ),
        id: 'mitre_version',
      },
    ],
  };
}

export const MitreAttackResources = [
  buildResource('Groups', 'Group'),
  buildResource('Mitigations', 'Mitigation'),
  buildResource('Software', 'Software'),
  buildResource('Tactics', 'Tactic'),
  buildResource('Techniques', 'Technique'),
];
