import { EuiCodeBlock, EuiCopy, EuiFlexGroup, EuiIcon, EuiText } from "@elastic/eui";
import React, { useEffect, useState } from "react";
import { PermissionsAdvice } from "../../components";
import { systemSelector } from "../../services";
import StartAgentTabs from "./start-agent-tabs";

export const getStartStepContent = (
    title: string,
    state: any,
    onChange: (field: string, value: string) => void,
  ) => {
    const { gotErrorRegistrationServiceInfo, language, os, version } = state;
    const [restartAgentCommand, setRestartAgentCommand] = useState('');
    const [showTabs, setShowTabs] = useState(false);
  
    useEffect(() => {
      initialize();
    });
  
    const initialize = () => {
      if (os && version) {
        const restartAgentCommand = {
          rpm: systemSelector(version),
          cent: systemSelector(version),
          deb: systemSelector(version),
          ubu: systemSelector(version),
          oraclelinux: systemSelector(version),
          macos: 'sudo /Library/Ossec/bin/wazuh-control start',
          win: 'NET START WazuhSvc',
        };
  
        const agentCommand =
          os && restartAgentCommand[os as keyof typeof restartAgentCommand];
        setRestartAgentCommand(agentCommand);
      }
    };
  
    const isTabCodeBlock = () => {
      if (['rpm','cent','suse','fedora','oraclelinux','amazonlinux','deb','raspbian','ubu','win','macos','open','sol','aix','hp'].includes(os)) {
        return true;
      }else{
        return false;
      }
    }
  
    const CommandBlockCode = () => {
      return (
        isTabCodeBlock() ? <StartAgentTabs {...state} onTabClick={() => {}} /> : (
        <EuiFlexGroup direction='column'>
            <EuiText>
              <div className='copy-codeblock-wrapper'>
                <EuiCodeBlock language={language}>
                  {restartAgentCommand}
                </EuiCodeBlock>
                <EuiCopy textToCopy={restartAgentCommand}>
                  {copy => (
                    <div className='copy-overlay' onClick={copy}>
                      <p>
                        <EuiIcon type='copy' /> Copy command
                      </p>
                    </div>
                  )}
                </EuiCopy>
              </div>
            </EuiText>
          </EuiFlexGroup>) 
      )
    }
  
    return (
      <>
        {gotErrorRegistrationServiceInfo ? (
          <PermissionsAdvice />
        ) : CommandBlockCode() }
      </>
    );
  };