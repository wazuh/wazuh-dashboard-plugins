import { EuiSteps } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import {
  checkMissingOSSelection,
  getAuthInfo,
  getHighlightCodeLanguage,
} from '../services/register-agent-service';
import { getDeployAgentSteps, iStep } from './deploy-agent-steps';

interface MainStepsProps {
  defaultState?: any;
  stepConfig: iStep[];
  wazuhVersion: string;
  currentConfiguration: any;
}

const StepsMain = (props: MainStepsProps) => {
  const { defaultState, stepConfig, wazuhVersion, currentConfiguration } = props;

  const [stepsState, setStepState] = useState(
    defaultState || {
      os: '',
      version: '',
      architecture: '',
      agentGroup: [],
      serverAddress: '',
      gotErrorRegistrationServiceInfo: false,
      missingOSSelection: [],
      agentName: '',
      wazuhVersion
    },
  );

  const handleOnChangeState = (field: string, value: string) => {
    if (field === 'os') {
      setStepState( (prevState: any) => ({ ...prevState, os: value, version: '', architecture: '' }));
    }
    if (field === 'version') {
      setStepState( (prevState: any) => ({ ...prevState, version: value, architecture: '' }));
    }
    if (field === 'architecture') {
      setStepState( (prevState: any) => ({ ...prevState, architecture: value }));
    }
    setStepState( (prevState: any) => ({ ...prevState, [field]: value }));
  };

  useEffect(() => {
    initialize();
    updateStepsState();
  }, []);

  useEffect(() => {
    updateStepsState();
  }, [stepsState.os, stepsState.version, stepsState.architecture]);

  const config = getDeployAgentSteps(
    stepConfig,
    stepsState,
    handleOnChangeState,
  );

  const initialize = async () => {
    let authInfo = await getAuthInfo();
    if (!authInfo || authInfo?.error) {
      setStepState((prevState: any) => ({ ...prevState, gotErrorRegistrationServiceInfo: true }));
    }
    const needsPassword = (authInfo.auth || {}).use_password === 'yes';
    if (needsPassword) {
      let wazuhPassword =
        //this.configuration['enrollment.password'] ||
        false || authInfo['authd.pass'] || '';
      if (wazuhPassword) {
        let hidePasswordInput = true;
        setStepState((prevState: any) => ({ ...prevState, hidePasswordInput }));
      }
    }

  };

  /***
   * Update state depending of the os, version and architecture selected
   */
  const updateStepsState = () => {
    const missingOSSelection = checkMissingOSSelection(
      stepsState.os,
      stepsState.version,
      stepsState.architecture,
    );

    if (missingOSSelection.length === 0) {
      const language = getHighlightCodeLanguage(stepsState.os);
      setStepState((prevState: any) => ({ 
        ...prevState,
        language,
        missingOSSelection
      }));
    }else{
      setStepState((prevState: any) => ({ ...prevState, missingOSSelection }));
    }
    
    
  }

  return (
    <>
      <EuiSteps steps={config} />
    </>
  );
};

export default StepsMain;
