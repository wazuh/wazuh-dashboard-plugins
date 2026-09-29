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
import { i18n } from '@osd/i18n';
import {
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
  UI_LOGGER_LEVELS,
} from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { mitreAttack } from '../../../../utils/applications';
import { WzLink } from '../../../wz-link/wz-link';

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
        title: i18n.translate(
          'wazuh.mitreAttack.intelligenceSearchBar.errorGettingSuggestions',
          { defaultMessage: 'Error getting suggestions' },
        ),
      },
    };
    getErrorOrchestrator().handleError(options);
    return [];
  }
};

function buildResource(id: string, label: string) {
  const endpoint: string = `/mitre/${id}`;
  const fieldsMitreAttactResource = [
    {
      field: 'description',
      description: i18n.translate(
        'wazuh.mitreAttack.intelligenceSearchBar.filterByDescription',
        { defaultMessage: 'filter by description' },
      ),
    },
    {
      field: 'external_id',
      description: i18n.translate(
        'wazuh.mitreAttack.intelligenceSearchBar.filterByExternalId',
        { defaultMessage: 'filter by external ID' },
      ),
    },
    {
      field: 'name',
      description: i18n.translate(
        'wazuh.mitreAttack.intelligenceSearchBar.filterByName',
        { defaultMessage: 'filter by name' },
      ),
    },
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
            return fieldsMitreAttactResource.map(({ field, description }) => ({
              label: field,
              description,
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
        name: i18n.translate('wazuh.mitreAttack.intelligenceTable.columns.id', {
          defaultMessage: 'ID',
        }),
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
        name: i18n.translate(
          'wazuh.mitreAttack.intelligenceTable.columns.name',
          {
            defaultMessage: 'Name',
          },
        ),
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
        name: i18n.translate(
          'wazuh.mitreAttack.intelligenceTable.columns.description',
          { defaultMessage: 'Description' },
        ),
        sortable: true,
        render: value => (value ? <Markdown markdown={value} /> : ''),
        truncateText: true,
      },
    ],
    mitreFlyoutHeaderProperties: [
      {
        label: i18n.translate('wazuh.mitreAttack.intelligenceFlyout.id', {
          defaultMessage: 'ID',
        }),
        id: 'external_id',
      },
      {
        label: i18n.translate('wazuh.mitreAttack.intelligenceFlyout.name', {
          defaultMessage: 'Name',
        }),
        id: 'name',
      },
      {
        label: i18n.translate(
          'wazuh.mitreAttack.intelligenceFlyout.createdTime',
          {
            defaultMessage: 'Created Time',
          },
        ),
        id: 'created_time',
        render: value => (value ? formatUIDate(value) : ''),
      },
      {
        label: i18n.translate(
          'wazuh.mitreAttack.intelligenceFlyout.modifiedTime',
          { defaultMessage: 'Modified Time' },
        ),
        id: 'modified_time',
        render: value => (value ? formatUIDate(value) : ''),
      },
      {
        label: i18n.translate('wazuh.mitreAttack.intelligenceFlyout.version', {
          defaultMessage: 'Version',
        }),
        id: 'mitre_version',
      },
    ],
  };
}

export const MitreAttackResources = [
  buildResource(
    'groups',
    i18n.translate('wazuh.mitreAttack.intelligenceResources.groups', {
      defaultMessage: 'Groups',
    }),
  ),
  buildResource(
    'mitigations',
    i18n.translate('wazuh.mitreAttack.intelligenceResources.mitigations', {
      defaultMessage: 'Mitigations',
    }),
  ),
  buildResource(
    'software',
    i18n.translate('wazuh.mitreAttack.intelligenceResources.software', {
      defaultMessage: 'Software',
    }),
  ),
  buildResource(
    'tactics',
    i18n.translate('wazuh.mitreAttack.intelligenceResources.tactics', {
      defaultMessage: 'Tactics',
    }),
  ),
  buildResource(
    'techniques',
    i18n.translate('wazuh.mitreAttack.intelligenceResources.techniques', {
      defaultMessage: 'Techniques',
    }),
  ),
];
