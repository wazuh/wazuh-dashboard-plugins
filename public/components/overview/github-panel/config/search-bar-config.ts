/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */
import { i18n } from '@kbn/i18n';

const place1 = i18n.translate(
  'wazuh.components.overview.githubPanel.config.place1',
  {
    defaultMessage: 'Actor',
  },
);
const place2 = i18n.translate(
  'wazuh.components.overview.githubPanel.config.place2',
  {
    defaultMessage: 'Organization',
  },
);
const place3 = i18n.translate(
  'wazuh.components.overview.githubPanel.config.place3',
  {
    defaultMessage: 'Repository',
  },
);
const place4 = i18n.translate(
  'wazuh.components.overview.githubPanel.config.place4',
  {
    defaultMessage: 'Action',
  },
);
export const filtersValues = [
  {
    type: 'multiSelect',
    key: 'data.github.actor',
    placeholder: place1,
  },
  {
    type: 'multiSelect',
    key: 'data.github.org',
    placeholder: place2,
  },
  {
    type: 'multiSelect',
    key: 'data.github.repo',
    placeholder: place3,
  },
  {
    type: 'multiSelect',
    key: 'data.github.action',
    placeholder: place4,
  },
];
