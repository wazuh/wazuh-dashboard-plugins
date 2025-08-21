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
import { TopNavMenuItem } from '../../../../console/public/application/components';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { topNavItems } from './top-nav-items';

interface Props {
  onClickExport: () => void;
  onClickHistory?: () => void;
  onClickSettings?: () => void;
  onClickHelp?: () => void;
  onClickImport?: () => void;
  useUpdatedUX?: boolean;
}

export function getTopNavConfig({
  onClickHistory,
  onClickSettings,
  onClickHelp,
  onClickExport,
  onClickImport,
  useUpdatedUX,
}: Props): TopNavMenuItem[] {
  const topNavItemsOut: TopNavMenuItem[] = [];

  if (onClickHistory) {
    topNavItemsOut.push(topNavItems.historyItem(onClickHistory));
  }

  const addHelpItem = () => {
    if (onClickHelp) {
      topNavItemsOut.push(topNavItems.helpItem(onClickHelp));
    }
  };

  const addSettingsItem = () => {
    if (onClickSettings) {
      topNavItemsOut.push(topNavItems.settingsItem(onClickSettings));
    }
  };

  if (useUpdatedUX) {
    addHelpItem();
    addSettingsItem();
  } else {
    addSettingsItem();
    addHelpItem();
  }

  topNavItemsOut.push(topNavItems.exportItem(onClickExport));

  if (onClickImport) {
    topNavItemsOut.push(topNavItems.importItem(onClickImport));
  }

  topNavItemsOut.push(
    topNavItems.apiReferenceItem(() =>
      window.open(
        webDocumentationLink('user-manual/api/reference.html'),
        '_blank',
      ),
    ),
  );

  return topNavItemsOut;
}
