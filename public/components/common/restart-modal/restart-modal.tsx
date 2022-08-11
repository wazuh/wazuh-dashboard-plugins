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
import { useDispatch, useSelector } from 'react-redux';
import {
  updateRestartStatus,
  updateRestartAttempt,
  updateSyncCheckAttempt,
  updateUnsynchronizedNodes,
} from '../../../redux/actions/appStateActions';

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

  // Restart polling counter
  const restartAttempt = useSelector((state) => state.appStateReducers.restartAttempt);

  // Cluster nodes that did not synced
  const unsyncedNodes = useSelector((state) => state.appStateReducers.unsynchronizedNodes);

  // Sync polling counter
  const syncPollingAttempt = useSelector((state) => state.appStateReducers.syncCheckAttempt);

  // Current status of the restarting process
  const restartStatus = useSelector((state) => state.appStateReducers.restartStatus);

  // Max attempts = MAX_SYNC_POLLING_ATTEMPTS + MAX_RESTART_POLLING_ATTEMPTS
  const maxAttempts = useDelay
    ? RestartHandler.MAX_RESTART_POLLING_ATTEMPTS + RestartHandler.MAX_SYNC_POLLING_ATTEMPTS
    : RestartHandler.MAX_RESTART_POLLING_ATTEMPTS;

  // Current attempt
  const attempts = useDelay ? restartAttempt + syncPollingAttempt : restartAttempt;

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
    restartStatus === RestartHandler.RESTART_STATES.RESTART_ERROR &&
      countdown(timeToHC, setCountdown);
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

  // TODO review if importing these functions in wz-restart work.
  const updateRedux = {
    updateRestartAttempt: (restartAttempt) => useDispatch(updateRestartAttempt(restartAttempt)),
    updateSyncCheckAttempt: (syncCheckAttempt) =>
      useDispatch(updateSyncCheckAttempt(syncCheckAttempt)),
    updateUnsynchronizedNodes: (unsynchronizedNodes) =>
      useDispatch(updateUnsynchronizedNodes(unsynchronizedNodes)),
    updateRestartStatus: (restartStatus) => useDispatch(updateRestartStatus(restartStatus)),
  };

  const forceRestart = async () => {
    await RestartHandler.restartWazuh(updateRedux);
  };

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
            <EuiProgress value={attempts} max={maxAttempts} size="s" />
          </>
        ),
      };
      break;

    case RestartHandler.RESTART_STATES.RESTART_ERROR:
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
            The nodes {unsyncedNodes.join(', ')} did not synchronize. Restarting Wazuh might set the
            cluster into an inconsistent state.
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
            <EuiProgress value={attempts} max={maxAttempts} size="s" />
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
          restartStatus === RestartHandler.RESTART_STATES.ERROR
            ? 'wz-modal-restart-error'
            : 'wz-modal-restart'
        }
      >
        <EuiEmptyPrompt {...emptyPromptProps} />
      </div>
    </EuiOverlayMask>
  );
};
