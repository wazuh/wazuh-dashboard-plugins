import React from 'react';
import { EuiPage, EuiPageBody, EuiSpacer, EuiProgress } from '@elastic/eui';
import { SettingsAboutAppInfo } from './appInfo';
import { SettingsAboutGeneralInfo } from './generalInfo';
import {
  PLUGIN_APP_NAME,
  UI_LOGGER_LEVELS,
} from '../../../../common/constants';
import { useAsyncActionRunOnStart } from '../../common/hooks';
import { GenericRequest } from '../../../react-services';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';

async function fetchAboutData() {
  try {
    const data = await GenericRequest.request('GET', '/api/setup');
    const response = data.data.data;
    return response['app-version'] as string;
  } catch (error) {
    const options = {
      context: `${SettingsAbout.name}.getAppInfo`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      error: {
        error: error,
        message: error.message || error,
        title: error.name || error,
      },
    };
    getErrorOrchestrator().handleError(options);
    throw error;
  }
}

export const SettingsAbout: React.FC = () => {
  const { data, running, error } = useAsyncActionRunOnStart(fetchAboutData);

  let headerAbout;
  if (error) {
    headerAbout = null;
  } else if (running) {
    headerAbout = (
      <>
        <EuiProgress size='xs' color='primary' />
        <EuiSpacer size='l' />
      </>
    );
  } else {
    headerAbout = (
      <>
        {data && <SettingsAboutAppInfo appInfo={data} />}
        <EuiSpacer size='l' />
      </>
    );
  }

  return (
    <EuiPage paddingSize='m'>
      <EuiPageBody>
        {headerAbout}
        <SettingsAboutGeneralInfo pluginAppName={PLUGIN_APP_NAME} />
      </EuiPageBody>
    </EuiPage>
  );
};
