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

/**
 * Available states of the model
 * TODO the state owner must be the Restart Service, not the modal. For this,
 * TODO the restart service must be migrated to Typescript.
 */
enum RESTART_STATES {
  ERROR = 'error',
  RESTARTING = 'restarting',
  SYNCING = 'syncing',
}

/**
 * The restart modal to show feedback to the user.
 * @param props component's props
 * @returns components's body
 */
export const RestartModal = (props: { isRestarting: boolean; useDelay?: boolean }) => {
  // Component props
  const { isRestarting: isRestartingProp, useDelay = false } = props;

  // Modal's restart state
  const [currentState, setCurrentState] = useState(RESTART_STATES.RESTARTING);

  // Restart attempt
  const [restartAttempt, setRestartAttempt] = useState(
    store.getState().appStateReducers.restartAttempt
  );

  // TODO
  const [isRestarting, setRestart] = useState(isRestartingProp);

  // Use default HEALTHCHECK_DELAY
  const [timeToHC, setCountdown] = useState(RestartHandler.HEALTHCHECK_DELAY / 1000);

  // Use default SYNC_DELAY
  const [syncDelay, setSyncDelay] = useState(RestartHandler.SYNC_DELAY / 1000);

  // Load Wazuh logo
  const wzConfig = new WazuhConfig().getConfig();
  const logotypeURL = getHttp().basePath.prepend(
    wzConfig['customization.logo.sidebar']
      ? getAssetURL(wzConfig['customization.logo.sidebar'])
      : getThemeAssetURL('icon.svg')
  );

  // Apply SYNC_DELAY if useDelay prop is enabled.
  useEffect(() => {
    if (useDelay) {
      countdown(syncDelay, setSyncDelay);
    }
  }, []);

  // Apply HEALTHCHECK_DELAY when the restart has failed
  useEffect(() => {
    const intervalAttempts = setInterval(() => {
      setRestartAttempt(store.getState().appStateReducers.restartAttempt);
      if (!isRestarting) {
        setRestartAttempt(0);
        clearInterval(intervalAttempts);
      }
    }, 1000);
    !isRestarting && countdown(timeToHC, setCountdown);
    return () => {
      clearInterval(intervalAttempts);
    };
  }, [isRestarting]);

  // TODO
  useEffect(() => {
    restartAttempt === RestartHandler.MAX_ATTEMPTS && setRestart(false);
    isRestarting && restartAttempt === 0 && useDelay
      ? setCurrentState(RESTART_STATES.SYNCING)
      : isRestarting
      ? setCurrentState(RESTART_STATES.RESTARTING)
      : setCurrentState(RESTART_STATES.ERROR);
  }, [restartAttempt]);

  // TODO
  const countdown = (time: number, setState) => {
    let countDown = time;

    const interval = setInterval(() => {
      setState(countDown);
      if (countDown === 0 && setState === setCountdown) {
        clearInterval(interval);
        RestartHandler.goToHealthcheck();
      } else if (countDown === 0) {
        clearInterval(interval);
      }

      countDown--;
    }, 1000 /* 1 second */);
  };

  // Build the modal depending on the restart state.
  let emptyPromptProps: Partial<EuiEmptyPromptProps>;
  switch (currentState) {
    default:
    case RESTART_STATES.RESTARTING:
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
              label={`Attempt ${restartAttempt}/${RestartHandler.MAX_ATTEMPTS}`}
              value={restartAttempt}
              max={RestartHandler.MAX_ATTEMPTS}
              size="s"
            />
          </>
        ),
      };
      break;

    case RESTART_STATES.ERROR:
      emptyPromptProps = {
        iconType: 'alert',
        iconColor: 'danger',
        title: <h2 className="wz-modal-restart-title">Unable to connect to Wazuh.</h2>,
        body: <p>There was an error restarting Wazuh. The Healthcheck will run automatically.</p>,
        actions: (
          <EuiButton color="primary" fill href="#/health-check">
            Go to Healthcheck ({timeToHC} s)
          </EuiButton>
        ),
      };
      break;

    case RESTART_STATES.SYNCING:
      emptyPromptProps = {
        title: (
          <>
            <img src={logotypeURL} className="wz-modal-restart-logo" alt=""></img>
            <h2 className="wz-modal-restart-title">Restarting Wazuh</h2>
          </>
        ),
        body: <p>Synchronizing cluster. Please wait {syncDelay} seconds.</p>,
      };
      break;
  }

  //
  return (
    <EuiOverlayMask>
      <div
        className={
          currentState === RESTART_STATES.ERROR ? 'wz-modal-restart-error' : 'wz-modal-restart'
        }
      >
        <EuiEmptyPrompt {...emptyPromptProps} />
      </div>
    </EuiOverlayMask>
  );
};
