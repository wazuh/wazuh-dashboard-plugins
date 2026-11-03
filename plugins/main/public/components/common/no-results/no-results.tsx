/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { ModuleEmptyState, getCurrentAppId } from './module-empty-state';
import { getModuleEmptyStateTexts } from './module-empty-state-texts';

interface Props {
  message?: string;
  /** Set it to `false` in flyouts: the prompt then never offers to unpin the agent. */
  allowUnpinAgent?: boolean;
}

/**
 * Empty state of the tabs without a module-specific component: the text of the current module
 * when it has one, otherwise the title for a search that matches nothing and what to try. Modules
 * with their own situations use `ModuleEmptyState`.
 */
export const DiscoverNoResults = ({ message, allowUnpinAgent }: Props) => {
  const moduleTexts = message
    ? undefined
    : getModuleEmptyStateTexts(getCurrentAppId());

  return (
    <ModuleEmptyState
      testSubj='Discover'
      dataTestSubj='discoverNoResults'
      allowUnpinAgent={allowUnpinAgent}
      title={
        message ??
        moduleTexts?.title ??
        i18n.translate('wazuh.common.noResults.title', {
          defaultMessage: 'No results match your search criteria',
        })
      }
    >
      <p>
        {moduleTexts?.description ??
          i18n.translate('wazuh.common.noResults.hint', {
            defaultMessage: 'Try widening the time range or removing filters.',
          })}
      </p>
    </ModuleEmptyState>
  );
};
