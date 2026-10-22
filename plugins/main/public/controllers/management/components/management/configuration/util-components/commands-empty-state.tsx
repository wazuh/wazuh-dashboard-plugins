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
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiButton,
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';

import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../../../kibana-services';
import NavigationService from '../../../../../../react-services/navigation-service';
import { endpointGroups } from '../../../../../../utils/applications';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const guideLink = webDocumentationLink(
  'user-manual/capabilities/command-monitoring/configuration.html',
);

interface CommandsEmptyStateProps {
  agent?: { group?: string[] };
}

// Group commands run only on endpoints that accept remote commands, so the hint names the setting.
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
    <EuiText size='s'>
      <p>
        {i18n.translate('wazuh.configuration.commandsEmptyState.title', {
          defaultMessage: 'No commands yet.',
        })}
      </p>
      <p>
        <FormattedMessage
          id='wazuh.configuration.commandsEmptyState.howToAdd'
          defaultMessage="Add a {block} block to the {groupFile} of a group this endpoint belongs to. The endpoint must have {setting} in its {internalOptionsFile}. You can also add it to the endpoint's {localFile}."
          values={{
            block: <EuiCode>{'<wodle name="command">'}</EuiCode>,
            groupFile: <EuiCode>agent.conf</EuiCode>,
            setting: <EuiCode>wazuh_command.remote_commands=1</EuiCode>,
            internalOptionsFile: <EuiCode>local_internal_options.conf</EuiCode>,
            localFile: <EuiCode>ossec.conf</EuiCode>,
          }}
        />
      </p>
      <EuiSpacer size='s' />
      <EuiFlexGroup gutterSize='m' alignItems='center' responsive={false}>
        <EuiFlexItem grow={false}>
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
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiLink href={guideLink} target='_blank' external>
            {i18n.translate(
              'wazuh.configuration.commandsEmptyState.guideLink',
              {
                defaultMessage: 'Command monitoring guide',
              },
            )}
          </EuiLink>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiText>
  );
};
