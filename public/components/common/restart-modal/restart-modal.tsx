import React, { useEffect, useState } from 'react';
import {
  EuiButton,
  EuiEmptyPrompt,
  EuiEmptyPromptProps,
  EuiOverlayMask,
  EuiProgress,
} from '@elastic/eui';
import { getHttp } from '../../../kibana-services';
import { WazuhConfig } from '../../../react-services/wazuh-config';
import { RestartHandler } from '../../../react-services/wz-restart';
import { getAssetURL, getThemeAssetURL } from '../../../utils/assets';
import store from '../../../redux/store';

export const RestartModal = (props) => {
  const { isRestarting: restarting, needDelay } = props;
  const wazuhConfig = new WazuhConfig();
  const states = { error: 'error', restarting: 'restarting', delay: 'delay' };
  const maxAttempts = 30;
  const delayToHealtcheck = 5
  const delayToRestart = 20
  const [currentState, setCurrentState] = useState(states.restarting);
  const [restartWazuhTries, setRestartWazuhTries] = useState(
    store.getState().appStateReducers.restartWazuhTries
  );
  const [isRestarting, setisRestarting] = useState(restarting);
  const [timeoutGoToHealthcheck, setTimeoutGoToHealthcheck] = useState(delayToHealtcheck);
  const [timeoutDelay, setTimeoutDelay] = useState(delayToRestart)

  const logotypeURL = getHttp().basePath.prepend(
    wazuhConfig.getConfig()['customization.logo.sidebar']
      ? getAssetURL(wazuhConfig.getConfig()['customization.logo.sidebar'])
      : getThemeAssetURL('icon.svg')
  );

  useEffect(() => {
    if(needDelay){
      intervalCommon(timeoutDelay, setTimeoutDelay)
    }
  } , []);
  
  useEffect(() => {
    const intervalAttempts = setInterval(() => {
      setRestartWazuhTries(store.getState().appStateReducers.restartWazuhTries);
      if (!isRestarting) {
        setRestartWazuhTries(0);
        clearInterval(intervalAttempts);
      }
    }, 1000);
    !isRestarting && intervalCommon(delayToHealtcheck, setTimeoutGoToHealthcheck);
    return () => {
      clearInterval(intervalAttempts);
    };
  }, [isRestarting]);

  useEffect(() => {
    restartWazuhTries === maxAttempts && setisRestarting(false);
    isRestarting && restartWazuhTries === 0 && needDelay
      ? setCurrentState(states.delay)
      : isRestarting
      ? setCurrentState(states.restarting)
      : setCurrentState(states.error);
  }, [restartWazuhTries]);

  const intervalCommon = (time, setState) => {
    let countDown = time;
    const interval = setInterval(() => {
      setState( countDown );
      if (countDown === 0 && setState === setTimeoutGoToHealthcheck) {
        clearInterval(interval);
        RestartHandler.goToHealthcheck()  
      } else if (countDown === 0) {
        clearInterval(interval);
      }

      countDown--;
    }, 1000);
  }

  let emptyPromptProps: Partial<EuiEmptyPromptProps>;
  switch (currentState) {
    case states.restarting:
      emptyPromptProps = {
        title: (
          <>
            <img src={logotypeURL} className="wz-modal-restart-logo" alt=""></img>
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
        body: <p>There was an error restarting Wazuh. The Healthcheck will run automatically.</p>,
        actions: (
          <EuiButton color="primary" fill href="#/health-check">
            Go to healthcheck ({timeoutGoToHealthcheck} s)
          </EuiButton>
        ),
      };
      break;
    case states.delay:
      emptyPromptProps = {
        title: (
          <>
            <img src={logotypeURL} className="wz-modal-restart-logo" alt=""></img>
            <h2 className="wz-modal-restart-title">Restarting Wazuh</h2>
          </>
        ),
        body: <p>Synchronizing Wazuh. Please wait {timeoutDelay} seconds.</p>,
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
      <div
        className={currentState === states.error ? 'wz-modal-restart-error' : 'wz-modal-restart'}
      >
        <EuiEmptyPrompt {...emptyPromptProps} />
      </div>
    </EuiOverlayMask>
  );
};
