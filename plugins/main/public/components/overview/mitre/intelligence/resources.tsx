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

import { WzRequest } from '../../../../react-services';
import { Markdown } from '../../../common/util';
import { formatUIDate } from '../../../../react-services';
import React from 'react';
import {
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
  UI_LOGGER_LEVELS,
} from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { mitreAttack } from '../../../../utils/applications';
import { WzLink } from '../../../wz-link/wz-link';
import { mitreI18n, mitreResourceLabels } from '../i18n';

const getMitreAttackIntelligenceSuggestions = async (
  endpoint: string,
  field: string,
  currentValue: string,
) => {
  try {
    const params = {
      distinct: true,
      limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
      select: field,
      sort: `+${field}`,
      ...(currentValue ? { q: `${field}~${currentValue}` } : {}),
    };
    const response = await WzRequest.apiReq('GET', endpoint, { params });
    return response?.data?.data.affected_items.map(item => ({
      label: item[field],
    }));
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
        title: mitreI18n.errorGettingSuggestions,
      },
    };
    getErrorOrchestrator().handleError(options);
    return [];
  }
};

function buildResource(resourceKey: keyof typeof mitreResourceLabels) {
  const label = mitreResourceLabels[resourceKey];
  const id = resourceKey;
  const endpoint: string = `/mitre/${id}`;
  const fieldsMitreAttactResource = [
    { field: 'description', name: mitreI18n.fieldDescription },
    { field: 'external_id', name: mitreI18n.fieldExternalId },
    { field: 'name', name: mitreI18n.fieldName },
  ];
  return {
    label: label,
    id,
    searchBar: {
      wql: {
        options: {
          searchTermFields: fieldsMitreAttactResource.map(({ field }) => field),
        },
        suggestions: {
          field(currentValue) {
            return fieldsMitreAttactResource.map(({ field, name }) => ({
              label: field,
              description: mitreI18n.filterByField(name),
            }));
          },
          value: async (currentValue, { field }) => {
            try {
              return await getMitreAttackIntelligenceSuggestions(
                endpoint,
                field,
                currentValue,
              );
            } catch (error) {
              return [];
            }
          },
        },
      },
    },
    apiEndpoint: endpoint,
    fieldName: 'name',
    initialSortingField: 'name',
    tableColumnsCreator: () => [
      {
        field: 'external_id',
        name: mitreI18n.id,
        width: '12%',
        render: value => (
          <WzLink
            appId={mitreAttack.id}
            path={`/overview?tab=mitre&tabView=intelligence&tabRedirect=${id}&idToRedirect=${value}`}
          >
            {value}
          </WzLink>
        ),
      },
      {
        field: 'name',
        name: mitreI18n.name,
        sortable: true,
        width: '30%',
        render: (value, item) => (
          <WzLink
            appId={mitreAttack.id}
            path={`/overview?tab=mitre&tabView=intelligence&tabRedirect=${id}&idToRedirect=${item.external_id}`}
          >
            {value}
          </WzLink>
        ),
      },
      {
        field: 'description',
        name: mitreI18n.description,
        sortable: true,
        render: value => (value ? <Markdown markdown={value} /> : ''),
        truncateText: true,
      },
    ],
    mitreFlyoutHeaderProperties: [
      {
        label: mitreI18n.id,
        id: 'external_id',
      },
      {
        label: mitreI18n.name,
        id: 'name',
      },
      {
        label: mitreI18n.createdTime,
        id: 'created_time',
        render: value => (value ? formatUIDate(value) : ''),
      },
      {
        label: mitreI18n.modifiedTime,
        id: 'modified_time',
        render: value => (value ? formatUIDate(value) : ''),
      },
      {
        label: mitreI18n.version,
        id: 'mitre_version',
      },
    ],
  };
}

export const MitreAttackResources = [
  buildResource('groups'),
  buildResource('mitigations'),
  buildResource('software'),
  buildResource('tactics'),
  buildResource('techniques'),
];
