/*
 * Wazuh app - Empty state of an endpoint's Commands section.
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiButton } from '@elastic/eui';

import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../../../kibana-services';
import NavigationService from '../../../../../../react-services/navigation-service';
import { endpointGroups } from '../../../../../../utils/applications';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { ConfigurationListEmptyPrompt } from './configuration-list-empty-prompt';

const guideLink = webDocumentationLink(
  'user-manual/capabilities/command-monitoring/configuration.html',
);

interface CommandsEmptyStateProps {
  agent?: { group?: string[] };
}

export const CommandsEmptyState = ({ agent }: CommandsEmptyStateProps) => {
  const groups = agent?.group ?? [];
  const group = groups.length === 1 ? groups[0] : undefined;
  const groupsHref = NavigationService.getInstance().getUrlForApp(
    endpointGroups.id,
    {
      path: group
        ? `#/manager/?tab=groups&group=${encodeURIComponent(group)}`
        : '#/manager/?tab=groups',
    },
  );

  return (
    <ConfigurationListEmptyPrompt
      title={i18n.translate('wazuh.configuration.commandsEmptyState.title', {
        defaultMessage: 'No commands yet',
      })}
      body={i18n.translate('wazuh.configuration.commandsEmptyState.howToAdd', {
        defaultMessage:
          'Add a command to a group this endpoint belongs to. The endpoint must also allow remote commands. The guide shows both steps.',
      })}
      guide={{
        text: i18n.translate(
          'wazuh.configuration.commandsEmptyState.guideLink',
          {
            defaultMessage: 'Command monitoring guide',
          },
        ),
        href: guideLink,
      }}
      action={
        <RedirectAppLinks application={getCore().application}>
          <EuiButton size='s' href={groupsHref}>
            {group
              ? i18n.translate(
                  'wazuh.configuration.commandsEmptyState.goToGroup',
                  {
                    defaultMessage: 'Go to group {group}',
                    values: { group },
                  },
                )
              : i18n.translate(
                  'wazuh.configuration.commandsEmptyState.goToGroups',
                  {
                    defaultMessage: 'Go to groups',
                  },
                )}
          </EuiButton>
        </RedirectAppLinks>
      }
    />
  );
};
