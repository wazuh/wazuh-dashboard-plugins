import { EuiSteps } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { getDeployAgentSteps, iStep } from './deploy-agent-steps'

interface MainStepsProps {
    defaultState: any,
    stepConfig: iStep[];
}

const StepsMain = (props: MainStepsProps) => {
  const { defaultState, stepConfig } = props;

  const [stepsState, setStepState] = useState({...defaultState} || {
    os: '',
    version: '',
    architecture: '',
  });

  const [config, setConfig] = useState([]);

  const handleOnChangeState = (field: string, value: string) => {
    if(field === 'os'){
        setStepState({...stepsState, os: value, version: '', architecture: ''});
    }
    if(field === 'version'){
        setStepState({...stepsState, version: value, architecture: ''});
    }
    if(field === 'architecture'){
        setStepState({...stepsState, architecture: value});
    }
  }

  useEffect(() => {
    const config = getDeployAgentSteps(stepConfig, stepsState, handleOnChangeState)
    setConfig(config);
  }, [])

  useEffect(() => {
    const config = getDeployAgentSteps(stepConfig, stepsState, handleOnChangeState)
    console.log('on change state', stepsState, config);
    setConfig(config);
  }, [stepsState])
    
  return (
    <>
    { JSON.stringify(stepsState) }
        <EuiSteps steps={config} />
    </>
  )
}

export default StepsMain;
