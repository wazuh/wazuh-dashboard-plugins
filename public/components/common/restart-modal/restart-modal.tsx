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
import { connect, useDispatch, useSelector } from 'react-redux';
import { updateRestartStatus, updateRestartAttempt, updateSyncCheckAttempt, updateUnsynchronizedNodes } from '../../../redux/actions/appStateActions';

/**
 * Available states of the model
 * TODO the state owner must be the Restart Service, not the modal. For this,
 * TODO the restart service must be migrated to Typescript.


/**
 * The restart modal to show feedback to the user.
 * @param props component's props
 * @returns components's body
 */
export const RestartModal = (props: { useDelay?: boolean }) => {
  // Component props
  const { useDelay = false } = props;

  // Use default HEALTHCHECK_DELAY
  const [timeToHC, setCountdown] = useState(RestartHandler.HEALTHCHECK_DELAY / 1000);

  // Use default SYNC_DELAY
  const [syncDelay, setSyncDelay] = useState(RestartHandler.SYNC_DELAY / 1000);

  // Restart attempt
  const restartAttempt = useSelector(state => state.appStateReducers.restartAttempt);
  const unsynchronizedNodes = useSelector(state => state.appStateReducers.unsynchronizedNodes);
  const syncCheckAttempt = useSelector(state => state.appStateReducers.syncCheckAttempt);
  const restartStatus = useSelector(state => state.appStateReducers.restartStatus);

  const dispatch = useDispatch();

  // Load Wazuh logo
  const maxAttempts = useDelay ? RestartHandler.MAX_ATTEMPTS_RESTART + RestartHandler.MAX_ATTEMPTS_SYNC : RestartHandler.MAX_ATTEMPTS_RESTART
  const attempts = useDelay ? restartAttempt + syncCheckAttempt : restartAttempt;
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
    restartStatus === RestartHandler.RESTART_STATES.ERROR_RESTART && countdown(timeToHC, setCountdown);
  }, [restartStatus]);

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

  const updateRedux = {
      updateRestartAttempt: (restartAttempt) =>
        dispatch(updateRestartAttempt(restartAttempt)),
      updateSyncCheckAttempt: (syncCheckAttempt) =>
        dispatch(updateSyncCheckAttempt(syncCheckAttempt)),
      updateUnsynchronizedNodes: (unsynchronizedNodes) =>
        dispatch(updateUnsynchronizedNodes(unsynchronizedNodes)),
      updateRestartStatus: (restartStatus) =>
        dispatch(updateRestartStatus(restartStatus)),
    };

  const forceRestart = async () => {
    const useDelay = false;
    await RestartHandler.restartWazuh(updateRedux, useDelay);
  }

  // Build the modal depending on the restart state.
  let emptyPromptProps: Partial<EuiEmptyPromptProps>;
  switch (restartStatus) {
    default:
    case RestartHandler.RESTART_STATES.RESTARTING:
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
              value={attempts}
              max={maxAttempts}
              size="s"
            />
          </>
        ),
      };
      break;

    case RestartHandler.RESTART_STATES.ERROR_RESTART:
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
      
    case RestartHandler.RESTART_STATES.ERROR_SYNC:
      emptyPromptProps = {
        iconType: 'alert',
        iconColor: 'danger',
        title: <h2 className="wz-modal-restart-title">Synchronization failed</h2>,
        body: (
          <p>
            The nodes {unsynchronizedNodes.join(', ')} did not synchronize. Restarting Wazuh might
            set the cluster into an inconsistent state.
          </p>
        ),
        actions: (
          <EuiButton color="warning" fill onClick={forceRestart}>
            Force restart
          </EuiButton>
        ),
      };
      break;

    case RestartHandler.RESTART_STATES.SYNCING:
      emptyPromptProps = {
        title: (
          <>
            <img src={logotypeURL} className="wz-modal-restart-logo" alt=""></img>
            <h2 className="wz-modal-restart-title">Synchronizing Wazuh</h2>
          </>
        ),
        body: (
          <>
            <EuiProgress
              value={attempts}
              max={maxAttempts}
              size="s"
            />
          </>
        ),
      };
      break;
  }

  //
  return (
    <EuiOverlayMask>
      <div
        className={
          restartStatus === RestartHandler.RESTART_STATES.ERROR ? 'wz-modal-restart-error' : 'wz-modal-restart'
        }
      >
        <EuiEmptyPrompt {...emptyPromptProps} />
      </div>
    </EuiOverlayMask>
  );
};
