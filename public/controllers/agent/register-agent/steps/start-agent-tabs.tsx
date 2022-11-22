import React, { Fragment } from 'react';
import {
  EuiCodeBlock,
  EuiCopy,
  EuiIcon,
  EuiText,
  EuiSpacer,
  EuiTabbedContent,
} from '@elastic/eui';
import {
  getHighlightCodeLanguage,
  systemSelector,
  systemSelectorNet,
  systemSelectorWazuhControl,
  systemSelectorWazuhControlMacos,
} from '../services/register-agent-service';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';
import { OSVersion, OSSystems } from '../types';

interface Props {
  os: OSSystems;
  version: OSVersion;
  wazuhVersion: string;
  onTabClick: (tab: { label: string; id: string }) => void;
}

const StartAgentTabs = (props: Props) => {
  const { os, version, wazuhVersion, onTabClick } = props;
  const appVersionMajorDotMinor = wazuhVersion.split('.').slice(0, 2).join('.');
  const language = getHighlightCodeLanguage(os);
  const urlCheckConnectionDocumentation = webDocumentationLink(
    'user-manual/agents/agent-connection.html',
    appVersionMajorDotMinor,
  );

  const onHandleTabClick = (tabSelected: any) => {
    onTabClick(tabSelected);
  };

  const textAndLinkToCheckConnectionDocumentation = (
    <p>
      To verify the connection with the Wazuh server, please follow this{' '}
      <a href={urlCheckConnectionDocumentation} target='_blank'>
        document.
      </a>
    </p>
  );

  const CommandCodeBlock = ({
    commandText,
  }: {
    commandText: string | undefined;
  }) => {
    return (
      <EuiText>
        <div className='copy-codeblock-wrapper'>
          <EuiCodeBlock language={language}>{commandText}</EuiCodeBlock>
          <EuiCopy textToCopy={commandText || ''}>
            {copy => (
              <div className='copy-overlay' onClick={copy}>
                <p>
                  <EuiIcon type='copy' /> Copy command
                </p>
              </div>
            )}
          </EuiCopy>
        </div>
        <EuiSpacer size='s' />
        {textAndLinkToCheckConnectionDocumentation}
      </EuiText>
    );
  };

  const tabs = [
    {
      id: 'systemd',
      name: 'Systemd',
      content: (
        <Fragment>
          <EuiSpacer />
          <CommandCodeBlock commandText={systemSelector(version)} />
        </Fragment>
      ),
    },
    {
      id: 'sysV',
      name: 'SysV Init',
      content: (
        <Fragment>
          <EuiSpacer />
          <CommandCodeBlock commandText={systemSelector(version)} />
        </Fragment>
      ),
    },
    {
      id: 'NET',
      name: 'NET',
      content: (
        <Fragment>
          <EuiSpacer />
          <CommandCodeBlock commandText={systemSelectorNet(version)} />
        </Fragment>
      ),
    },
    {
      id: 'Wazuh-control-macos',
      name: 'Wazuh-control-macos',
      content: (
        <Fragment>
          <EuiSpacer />
          <CommandCodeBlock
            commandText={systemSelectorWazuhControlMacos(version)}
          />
        </Fragment>
      ),
    },
    {
      id: 'Wazuh-control',
      name: 'Wazuh-control',
      content: (
        <Fragment>
          <EuiSpacer />
          <CommandCodeBlock
            commandText={systemSelectorWazuhControl(version)}
          />
        </Fragment>
      ),
    },
  ];

  /**
   * Get code tabs depending on OS Version
   * @param version 
   */
  const getCurrentTab = (version: OSVersion) => {
    if (
      [
        'amazonlinux2022',
        'redhat7',
        'centos7',
        'suse11',
        'suse12',
        'oraclelinux5',
        'amazonlinux2',
        '22',
        'debian8',
        'debian10',
        'busterorgreater',
        'ubuntu15',
        'ubuntu16',
        'leap15',
      ].includes(version)
    ) {
      return tabs.filter(tab => tab.id === 'systemd');
    }
    if (['windowsxp', 'windows8'].includes(version)) {
      return tabs.filter(tab => tab.id === 'NET');
    }

    if (
      [
        'sierra',
        'highSierra',
        'mojave',
        'catalina',
        'bigSur',
        'monterrey',
      ].includes(version)
    ) {
      return tabs.filter(tab => tab.id === 'Wazuh-control-macos');
    }
    if (['solaris10', 'solaris11', '6.1 TL9', '11.31'].includes(version)) {
      return tabs.filter(tab => tab.id === 'Wazuh-control');
    }
    return tabs.filter(tab => tab.id === 'sysV');
  };

  return (
    <EuiTabbedContent
      tabs={getCurrentTab(version)}
      onTabClick={onHandleTabClick}
    />
  );
};

export default StartAgentTabs;
