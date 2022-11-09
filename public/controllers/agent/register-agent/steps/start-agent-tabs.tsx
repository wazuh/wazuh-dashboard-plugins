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
} from '../services/register-agent-service';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';


const StartAgentTabs = (props: any) => {
  const { selectedOS, selectedSYS, selectedVersion, wazuhVersion, onTabClick } = props;
  const appVersionMajorDotMinor = wazuhVersion.split('.').slice(0, 2).join('.');
  const language = getHighlightCodeLanguage(selectedOS);
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

  const CommandCodeBlock = () => (
    <EuiText>
      <div className='copy-codeblock-wrapper'>
        <EuiCodeBlock language={language}>
          {systemSelector(selectedOS)}
        </EuiCodeBlock>
        <EuiCopy textToCopy={systemSelector(selectedVersion) || ''}>
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

  const tabs = [
    {
      id: 'systemd',
      name: 'Systemd',
      content: (
        <Fragment>
          <EuiSpacer />
          <CommandCodeBlock />
        </Fragment>
      ),
    },
    {
      id: 'sysV',
      name: 'SysV Init',
      content: (
        <Fragment>
          <EuiSpacer />
          <CommandCodeBlock />
        </Fragment>
      ),
    },
    {
      id: 'NET',
      name: 'NET',
      content: (
        <Fragment>
          <EuiSpacer />
          <CommandCodeBlock />
        </Fragment>
      ),
    },
    {
      id: 'Wazuh-control-macos',
      name: 'Wazuh-control-macos',
      content: (
        <Fragment>
          <EuiSpacer />
          <CommandCodeBlock />
        </Fragment>
      ),
    },
    {
      id: 'Wazuh-control',
      name: 'Wazuh-control',
      content: (
        <Fragment>
          <EuiSpacer />
          <CommandCodeBlock />
        </Fragment>
      ),
    },
  ];

  return (<EuiTabbedContent tabs={tabs} onTabClick={onHandleTabClick} />);
};

export default StartAgentTabs;
