import React, { useEffect, useState } from 'react';
import {
  EuiEmptyPrompt,
  EuiEmptyPromptProps,
  EuiOverlayMask,
  EuiProgress,
  EuiText,
} from '@elastic/eui';
import { getHttp } from '../../../kibana-services';
import { WazuhConfig } from '../../../react-services/wazuh-config';
import { getAssetURL, getThemeAssetURL } from '../../../utils/assets';

export const RestartModal = (props) => {
  const [isMounted, setIsMounted] = useState(true)
  const states = {error: "error", restarting: "restarting"};
  const [currentState, setCurrentState] = useState(states.restarting);
  const { isRestarting, isCluster } = props;
  const time = isCluster ? 80 : 70;
  const [timeRestarting, setTimeRestarting] = useState(time);
  const wazuhConfig = new WazuhConfig();
  const clusterOrManager = isCluster ? 'cluster' : 'manager';

  const logotypeURL = getHttp().basePath.prepend(
    wazuhConfig.getConfig()['customization.logo.app']
      ? getAssetURL(wazuhConfig.getConfig()['customization.logo.app'])
      : getThemeAssetURL('logo.svg')
  );

  useEffect(() => {
    setIsMounted(true);
    countDown(timeRestarting);
    return () => {
      setIsMounted(false);
    }
  }, []);

  useEffect(() => {
    isRestarting ? setCurrentState(states.restarting) : setCurrentState(states.error); 
  }, [isRestarting])
  

  const countDown = (time) => {
    let countDown = time;
    const interval = setInterval(() => {
      countDown--;
      setTimeRestarting(countDown);
      if (countDown === 0 || isMounted === false) {
        clearInterval(interval);
      }
    }, 1000);
  };

  let emptyPromptProps: Partial<EuiEmptyPromptProps>;
  switch (currentState) {
    case states.restarting:
      emptyPromptProps = {
        title: (
          <>
            <img src={logotypeURL} className="navBarLogo " alt=""></img>
            <h2 className="wz-margin-16">Restarting Wazuh</h2>
          </>
        ),
        body: (
          <>
            <EuiProgress
              label={`${timeRestarting} seconds left to restart ${clusterOrManager}`}
              value={timeRestarting}
              max={isCluster ? 80 : 70}
              size="xs"
            />
          </>
        ),
      };
      break;
    case states.error:
      emptyPromptProps = {
        color: 'danger',
        iconType: 'alert',
        title: <h2>Unable to connect to Wazuh</h2>,
        body: (
          <p>
            There was an error restarting Wazuh. The Healthcheck will run in a few seconds. Click{' '}
            <a href="#/health-check">here</a> if you are not redirected automatically.
          </p>
        ),
      };
    default:
      emptyPromptProps = {
        color: 'danger',
        iconType: 'alert',
        title: <h2>Unable to connect to Wazuh</h2>,
        body: (
          <p>
            There was an error restarting Wazuh. The Healthcheck will run in a few seconds. Click{' '}
            <a href="#/health-check">here</a> if you are not redirected automatically.
          </p>
        ),
      };
  }

  return (
    <EuiOverlayMask>
      <div className="wz-modal-restart">
        <EuiEmptyPrompt {...emptyPromptProps} />
      </div>
    </EuiOverlayMask>
  );
};
