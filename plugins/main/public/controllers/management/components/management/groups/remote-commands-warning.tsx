import React from 'react';
import { EuiCallOut, EuiCode, EuiLink, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DOCS_PATHS } from '../../../../../../common/services/docs-paths';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';

/**
 * Height, in pixels, that the warning and its spacer take from the editor, so the page doesn't
 * scroll. It covers the text wrapped to two lines.
 */
export const REMOTE_COMMANDS_WARNING_HEIGHT = 64;

/**
 * Agents ignore the commands of the centralized configuration unless remote commands are enabled
 * in their local internal options. The dashboard can't know the setting of each agent, so the
 * warning is always shown, whatever the content of the file.
 */
export const RemoteCommandsWarning = () => (
  <>
    <EuiCallOut
      size='s'
      color='warning'
      iconType='alert'
      data-test-subj='wzGroupsEditorRemoteCommandsWarning'
      title={
        <FormattedMessage
          id='wazuh.endpointGroups.editor.remoteCommandsWarning.text'
          defaultMessage="Agents ignore commands from this file unless remote commands are enabled in each agent's {localInternalOptions} file: {wodleSetting} for {wodleBlock} blocks, and {logcollectorSetting} for {localfileBlock} blocks with the {command} or {fullCommand} log format. {learnMore}"
          values={{
            localInternalOptions: (
              <EuiCode>local_internal_options.conf</EuiCode>
            ),
            wodleSetting: <EuiCode>wazuh_command.remote_commands=1</EuiCode>,
            wodleBlock: <EuiCode>{'<wodle name="command">'}</EuiCode>,
            logcollectorSetting: (
              <EuiCode>logcollector.remote_commands=1</EuiCode>
            ),
            localfileBlock: <EuiCode>{'<localfile>'}</EuiCode>,
            command: <EuiCode>command</EuiCode>,
            fullCommand: <EuiCode>full_command</EuiCode>,
            learnMore: (
              <EuiLink
                href={webDocumentationLink(
                  DOCS_PATHS.commandMonitoringRemoteCommands,
                )}
                target='_blank'
                rel='noopener noreferrer'
                external
              >
                {i18n.translate(
                  'wazuh.endpointGroups.editor.remoteCommandsWarning.docsLink',
                  { defaultMessage: 'Learn more' },
                )}
              </EuiLink>
            ),
          }}
        />
      }
    />
    <EuiSpacer size='s' />
  </>
);
