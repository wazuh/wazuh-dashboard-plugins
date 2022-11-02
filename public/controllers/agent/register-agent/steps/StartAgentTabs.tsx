import React, { Fragment, useState } from 'react';
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
} from '../register-agent-service';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';

const StartAgentTabs = (props: any) => {
  const { selectedOS, selectedSYS, wazuhVersion, onTabClick } = props;
  const appVersionMajorDotMinor = wazuhVersion.split('.').slice(0, 2).join('.');
  const language = getHighlightCodeLanguage(selectedOS);
  const urlCheckConnectionDocumentation = webDocumentationLink(
    'user-manual/agents/agent-connection.html',
    appVersionMajorDotMinor,
  );

  const onHandleTabClick = (tabSelected: any) => {
    setSeletectTab(tabSelected);
    onTabClick(tabSelected);
  }

  const textAndLinkToCheckConnectionDocumentation = (
    <p>
      To verify the connection with the Wazuh server, please follow this{' '}
      <a href={urlCheckConnectionDocumentation} target='_blank'>
        document.
      </a>
    </p>
  );
  
  const tabs = [
    {
      id: 'systemd',
      name: 'Systemd',
      content: (
        <Fragment>
          <EuiSpacer />
          <EuiText>
            <div className="copy-codeblock-wrapper">
              <EuiCodeBlock language={language}>
                {systemSelector(selectedOS, selectedSYS)}
              </EuiCodeBlock>
              <EuiCopy textToCopy={systemSelector(selectedOS, selectedSYS)}>
                {(copy) => (
                  <div className="copy-overlay" onClick={copy}>
                    <p><EuiIcon type="copy" /> Copy command</p>
                  </div>
                )}
              </EuiCopy>
            </div>
            <EuiSpacer size='s'/>
            {textAndLinkToCheckConnectionDocumentation}
          </EuiText>
        </Fragment>
      ),
    },
    {
      id: 'sysV',
      name: 'SysV Init',
      content: (
        <Fragment>
          <EuiSpacer />
          <EuiText>
            <div className="copy-codeblock-wrapper">
              <EuiCodeBlock language={language}>
                {systemSelector(selectedOS, selectedSYS)}
              </EuiCodeBlock>
              <EuiCopy textToCopy={systemSelector(selectedOS, selectedSYS)}>
                {(copy) => (
                  <div className="copy-overlay" onClick={copy}>
                    <p><EuiIcon type="copy" /> Copy command</p>
                  </div>
                )}
              </EuiCopy>
            </div>
            <EuiSpacer size='s'/>
            {textAndLinkToCheckConnectionDocumentation}
          </EuiText>
        </Fragment>
      ),
    },
  ];


  const [seletecTab, setSeletectTab] = useState(tabs.filter((tab) => tab.id === selectedSYS)[0]);

 
  return (
    <EuiTabbedContent
      tabs={tabs}
      selectedTab={seletecTab}
      onTabClick={onHandleTabClick}
    />
  );
};

export default StartAgentTabs;
