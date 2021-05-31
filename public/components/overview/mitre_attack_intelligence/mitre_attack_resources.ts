/*
 * Wazuh app - Mitre Att&ck resouces.
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

import { formatUIDate } from '../../../react-services';
 
export const MitreAttackResources = [
  {
    label: 'Groups',
    id: 'groups',
    searchBarSuggestions: [{
      type: 'q',
      label: 'id',
      description: 'Tactic ID',
      operators: ['=', '!='],
      values: () => []
    }],
    apiEndpoint: '/mitre/groups',
    fieldName: 'name',
    tableColumns: [
      {
        field: 'name',
        name: 'Name',
        sortable: true
      },
      {
        field: 'description',
        name: 'Description',
        sortable: true,
        truncateText: true
      },
      {
        field: 'created_time',
        name: 'Created time',
        sortable: true,
        render: formatUIDate
      },
      {
        field: 'modified_time',
        name: 'Modified time',
        sortable: true,
        render: formatUIDate
      }
    ]
  },
  {
    label: 'Mitigations',
    id: 'mitigations',
    searchBarSuggestions: [{
      type: 'q',
      label: 'id',
      description: 'Tactic ID',
      operators: ['=', '!='],
      values: () => []
    }],
    apiEndpoint: '/mitre/mitigations',
    fieldName: 'name',
    tableColumns: [
      {
        field: 'name',
        name: 'Name',
        sortable: true
      },
      {
        field: 'description',
        name: 'Description',
        sortable: true,
        truncateText: true
      },
      {
        field: 'created_time',
        name: 'Created time',
        sortable: true,
        render: formatUIDate
      },
      {
        field: 'modified_time',
        name: 'Modified time',
        sortable: true,
        render: formatUIDate
      }
    ]
  },
  {
    label: 'Software',
    id: 'software',
    searchBarSuggestions: [{
      type: 'q',
      label: 'id',
      description: 'Tactic ID',
      operators: ['=', '!='],
      values: () => []
    }],
    apiEndpoint: '/mitre/software',
    fieldName: 'name',
    tableColumns: [
      {
        field: 'name',
        name: 'Name',
        sortable: true
      },
      {
        field: 'description',
        name: 'Description',
        sortable: true,
        truncateText: true
      },
      {
        field: 'created_time',
        name: 'Created time',
        sortable: true,
        render: formatUIDate
      },
      {
        field: 'modified_time',
        name: 'Modified time',
        sortable: true,
        render: formatUIDate
      }
    ]
  },
  {
    label: 'Tactics',
    id: 'tactics',
    searchBarSuggestions: [{
      type: 'q',
      label: 'id',
      description: 'Tactic ID',
      operators: ['=', '!='],
      values: () => []
    }],
    apiEndpoint: '/mitre/tactics',
    fieldName: 'name',
    tableColumns: [
      {
        field: 'name',
        name: 'Name',
        sortable: true
      },
      {
        field: 'short_name',
        name: 'Short name',
        sortable: true
      },
      {
        field: 'description',
        name: 'Description',
        sortable: true,
        truncateText: true
      },
      {
        field: 'created_time',
        name: 'Created time',
        sortable: true,
        render: formatUIDate
      },
      {
        field: 'modified_time',
        name: 'Modified time',
        sortable: true,
        render: formatUIDate
      }
    ],
    detailsProperties: [
      {
        label: 'ID',
        id: 'id'
      },
      {
        label: 'Name',
        id: 'name'
      },
      {
        label: 'id',
        id: 'id'
      },
    ]
  },
  {
    label: 'Techniques',
    id: 'techniques',
    searchBarSuggestions: [{
      type: 'q',
      label: 'id',
      description: 'Tactic ID',
      operators: ['=', '!='],
      values: () => []
    }],
    apiEndpoint: '/mitre/techniques',
    fieldName: 'name',
    tableColumns: [
      {
        field: 'name',
        name: 'Name',
        sortable: true
      },
      {
        field: 'description',
        name: 'Description',
        sortable: true,
        truncateText: true
      },
      {
        field: 'created_time',
        name: 'Created time',
        sortable: true,
        render: formatUIDate
      },
      {
        field: 'modified_time',
        name: 'Modified time',
        sortable: true,
        render: formatUIDate
      }
    ]
  }
];