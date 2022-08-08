import React, { useEffect, useState } from 'react';
import {
  EuiEmptyPrompt,
  EuiEmptyPromptProps,
  EuiOverlayMask,
  EuiProgress,
} from '@elastic/eui';
import { getHttp } from '../../../kibana-services';
import { WazuhConfig } from '../../../react-services/wazuh-config';
import { getAssetURL, getThemeAssetURL } from '../../../utils/assets';
import store from '../../../redux/store';

export const RestartModal = (props) => {
  const { isRestarting: restarting } = props;
  const wazuhConfig = new WazuhConfig();
  const states = {error: "error", restarting: "restarting", delay: "delay"};
  const maxAttempts = 30
  const [currentState, setCurrentState] = useState(states.restarting);
  const [restartWazuhTries, setRestartWazuhTries] = useState(store.getState().appStateReducers.restartWazuhTries)
  const [isRestarting, setisRestarting] = useState(restarting)

  const logotypeURL = getHttp().basePath.prepend(
    wazuhConfig.getConfig()['customization.logo.app']
      ? getAssetURL(wazuhConfig.getConfig()['customization.logo.app'])
      : getThemeAssetURL('logo.svg')
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRestartWazuhTries(store.getState().appStateReducers.restartWazuhTries)
      if(!isRestarting){
        setRestartWazuhTries(0)
        clearInterval(interval)
      } 
    }, 1000);
    return () => {
      clearInterval(interval)
    }
  }, [isRestarting]);

  useEffect(() => {
    restartWazuhTries === maxAttempts && setisRestarting(false)
    isRestarting && restartWazuhTries !== 0
      ? setCurrentState(states.restarting)
      : isRestarting && restartWazuhTries === 0
      ? setCurrentState(states.delay)
      : setCurrentState(states.error);
  }, [restartWazuhTries]);

  let emptyPromptProps: Partial<EuiEmptyPromptProps>;
  switch (currentState) {
    case states.restarting:
      emptyPromptProps = {
        title: (
          <>
            <img src={logotypeURL} className="navBarLogo" alt=""></img>
            <h2 className="wz-modal-restart-title">Restarting Wazuh</h2>
          </>
        ),
        body: (
          <>
            <EuiProgress
              label={`Attempt ${restartWazuhTries}/30`}
              value={restartWazuhTries}
              max={30}
              size="xs"
            />
          </>
        ),
      };
      break;
    case states.error:
      emptyPromptProps = {
        iconType: 'alert',
        iconColor: 'danger',
        title: <h2 className="wz-modal-restart-title">Unable to connect to Wazuh.</h2>,
        body: (
          <p>
            There was an error restarting Wazuh. The Healthcheck will run in a few seconds. Click{' '}
            <a href="#/health-check">here</a> if you are not redirected automatically.
          </p>
        ),
      };
      break;
    case states.delay:
      emptyPromptProps = {
        title: (
          <>
            <img src={logotypeURL} className="navBarLogo" alt=""></img>
            <h2 className="wz-modal-restart-title">Restarting Wazuh</h2>
          </>
        ),
        body: (
          <p>
            Synchronizing Wazuh. Please wait...
          </p>
        )
      };
      break;
    default:
      emptyPromptProps = {
        iconType: 'alert',
        iconColor: 'danger',
        title: <h2 className="wz-modal-restart-title">Unable to connect to Wazuh.</h2>,
        body: (
          <p className="margin-16">
            There was an error restarting Wazuh. The Healthcheck will run in a few seconds. Click{' '}
            <a href="#/health-check">here</a> if you are not redirected automatically.
          </p>
        ),
      };
  }

  return (
    <EuiOverlayMask>
      <div className={currentState === states.error ? 'wz-modal-restart-error' : 'wz-modal-restart' }>
        <EuiEmptyPrompt {...emptyPromptProps} />
      </div>
    </EuiOverlayMask>
  );
};