import {
  EuiCallOut,
  EuiCodeBlock,
  EuiCopy,
  EuiFieldText,
  EuiFlexGroup,
  EuiIcon,
  EuiText,
} from '@elastic/eui';
import React, { Fragment, useEffect, useState } from 'react';
import {
  AgentGroup,
  InstallEnrollAgent,
  ServerAddress,
  StartAgentTabs,
  WazuhPassword,
} from '.';
import { PermissionsAdvice, StepButtonGroup } from '../components';
import { buttonsConfig, iButton, VersionBtn } from '../config';
import { getGroups, systemSelector } from '../services/register-agent-service';

export interface iButtonContent {
  buttons: iButton[];
  title: string;
  defaultValue: any;
  onChange: (value: string) => void;
  afterContent?: () => JSX.Element;
}

/**
 *
 * @param searchFieldname
 * @param searchValue
 * @param buttonsConfig
 */
const filterButtonsConfig = (
  searchFieldname: keyof iButton,
  searchValue: string,
  buttonsConfig: iButton[],
) => {
  return buttonsConfig.filter(
    (button: iButton) =>
      button[searchFieldname as keyof iButton] === searchValue,
  );
};

/**
 * Return the children component from config selected
 */
export const renderGroupBtnsContent = ({
  buttons,
  afterContent,
  title,
  defaultValue,
  onChange,
}: iButtonContent) => {
  return (
    <>
      <StepButtonGroup
        buttons={buttons}
        legend={title}
        defaultValue={defaultValue}
        onChange={onChange}
      />
      {afterContent && afterContent}
    </>
  );
};

/**
 *
 * @param title
 * @param state
 * @param onChange
 */
const getStepContent = (
  title: string,
  state: any,
  onChange: (field: string, value: string) => void,
) => {};

/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
export const getOSStepContent = (
  title: string,
  state: any,
  onChange: (field: string, value: string) => void,
) => {
  const buttons = buttonsConfig.map(button => ({
    id: button.id,
    label: button.label,
  }));

  const handleOnchange = (value: string) => {
    onChange('os', value);
  };

  return renderGroupBtnsContent({
    title,
    buttons,
    defaultValue: state.os,
    onChange: handleOnchange,
  });
};

/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
export const getVersionStepContent = (
  title: string,
  state: any,
  onChange: (field: string, value: string) => void,
) => {
  const { os, version } = state;
  if (!os) {
    // hide step
    return false;
  }

  const handleOnchange = (value: string) => {
    onChange('version', value);
  };

  const buttons = buttonsConfig.find(button => button.id === os)?.versionsBtns;
  if (!buttons) {
    console.error('No buttons found for OS', os);
    return false;
  }

  const versionBtn = buttons?.filter(
    button => button.id === version,
  ) as VersionBtn[];

  if (versionBtn?.length && versionBtn[0].afterContent) {
    return renderGroupBtnsContent({
      title,
      buttons,
      afterContent: versionBtn[0].afterContent,
      defaultValue: state.version,
      onChange: handleOnchange,
    });
  } else {
    return renderGroupBtnsContent({
      title,
      buttons,
      defaultValue: state.version,
      onChange: handleOnchange,
    });
  }
};

/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
export const getArchitectureStepContent = (
  title: string,
  state: any,
  onChange: (field: string, value: string) => void,
) => {
  const { os, version } = state;

  if (!version) {
    // hide step
    return false;
  }

  const handleOnchange = (value: string) => {
    onChange('architecture', value);
  };

  const buttons = buttonsConfig.find(button => button.id === os)
    ?.architectureBtns;
  return renderGroupBtnsContent({
    title,
    buttons,
    defaultValue: state.architecture,
    onChange: handleOnchange,
  });
};

export const getServerAddressStepContent = (
  title: string,
  state: any,
  onChange: (field: string, value: string) => void,
) => {
  return (
    <Fragment>
      <ServerAddress
        defaultValue={state.serverAddress || ''}
        onChange={value => onChange('serverAddress', value)}
      />
    </Fragment>
  );
};

export const getWazuhPasswordStepContent = (
  title: string,
  state: any,
  onChange: (field: string, value: string) => void,
) => {
  return (
    <Fragment>
      <WazuhPassword
        defaultValue={state.wazuhPassword}
        onChange={(value: string) => onChange('wazuhPassword', value)}
      />
    </Fragment>
  );
};

export const getAgentNameAndGroupsStepContent = (
  title: string,
  state: any,
  onChange: (field: string, value: string) => void,
) => {
  const agentName = (
    <EuiFieldText
      placeholder='Name agent'
      value={state.agentName || ''}
      onChange={event => onChange('agentName', event.target.value)}
    />
  );

  const [groups, setGroups] = useState([]);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    const groups = await getGroups();
    setGroups(groups);
  };

  return (
    <Fragment>
      {agentName}
      <AgentGroup
        options={groups}
        onChange={(value: any) => onChange('agentGroup', value)}
      />
    </Fragment>
  );
};

export interface iStep {
  title: string;
  children: (
    title: string,
    state: any,
    onChange: (key: string, value: string) => void,
  ) => any;
}

export const getInstallEnrollStepContent = (
  title: string,
  state: any,
  onChange: (field: string, value: string) => void,
) => {
  const {
    gotErrorRegistrationServiceInfo,
    missingOSSelection,
    language,
    Commandtext,
  } = state;

  return gotErrorRegistrationServiceInfo ? (
    <PermissionsAdvice />
  ) : missingOSSelection.length ? (
    <EuiCallOut
      color='warning'
      title={`Please select the ${missingOSSelection.join(', ')}.`}
      iconType='iInCircle'
    />
  ) : (
    <InstallEnrollAgent
      language={language}
      commandText={Commandtext}
      {...state}
      onSetShowPassword={() => {}}
    />
  );
};

export const startStepContent = (
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

/**
 *
 * @param OSSelected
 * @param OSVersionSelected
 * @param OSArchSelected
 */
export const getDeployAgentSteps = (
  stepsBtnsDefinitions: iStep[],
  state: any,
  onChangeState: (key: string, value: string) => void,
) => {
  return stepsBtnsDefinitions
    .map((step: iStep) => {
      const { title, children } = step;
      const stepContent =
        typeof children === 'function'
          ? children(title, state, onChangeState)
          : children;

      return !stepContent
        ? false
        : {
            title,
            children: stepContent,
          };
    })
    .filter(step => step);
};
