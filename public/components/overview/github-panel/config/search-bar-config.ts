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

const title1 = i18n.translate('components.addModule.guide.title1', {
  defaultMessage: 'Actor',
});
const title2 = i18n.translate('components.addModule.guide.title2', {
  defaultMessage: 'Organization',
});
const title3 = i18n.translate('components.addModule.guide.title3', {
  defaultMessage: 'Repository',
});
const title4 = i18n.translate('components.addModule.guide.title4', {
  defaultMessage: 'Action',
});
export const filtersValues = [
  {
    type: 'multiSelect',
    key: 'data.github.actor',
    placeholder: title1,
  },
  {
    type: 'multiSelect',
    key: 'data.github.org',
    placeholder: title2,
  },
  {
    type: 'multiSelect',
    key: 'data.github.repo',
    placeholder: title3,
  },
  {
    type: 'multiSelect',
    key: 'data.github.action',
    placeholder: title4,
  },
];
