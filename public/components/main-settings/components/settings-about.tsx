import React, { Component } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiDescriptionList,
  EuiTitle,
  EuiBadge,
  EuiBetaBadge,
  EuiCallOut,
  EuiLoadingSpinner,
  EuiText,
  EuiColor,
  EuiSwitch,
  EuiSpacer
} from '@elastic/eui';
import { TabDescription } from '../../../../server/reporting/tab-description';
import AppState from '../../../react-services/app-state';
import GenericRequest from '../../../react-services/generic-request';
import SavedObject from '../../../react-services/saved-objects';
import ErrorHandler from '../../../react-services/error-handler';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { useEffect, useState } from 'react';
import store from '../../../redux/store';
import { updateSelectedSettingsSection } from '../../../redux/actions/appStateActions';
import { withUserAuthorizationPrompt } from '../../common/hocs/withUserAuthorization';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../../util/constants';


function getCurrentAPIIndex() {
  if (this.apiEntries.length) {
    const idx = this.apiEntries
      .map(entry => entry.id)
      .indexOf(this.currentDefault);
    this.currentApiEntryIndex = idx;
  }
}

async function getSettings() {
  try {
    const patternList = await SavedObject.getListOfWazuhValidIndexPatterns();

    this.indexPatterns = patternList;

    if (!this.indexPatterns.length) {
      this.wzMisc.setBlankScr('Sorry but no valid index patterns were found');
      return;
    }

    await this.getHosts();

    // Set the addingApi flag based on if there is any API entry
    this.addingApi = !this.apiEntries.length;
    const currentApi = AppState.getCurrentAPI();

    if (currentApi) {
      const { id } = JSON.parse(currentApi);
      this.currentDefault = id;
    }

    this.apiTableProps.currentDefault = this.currentDefault;
    getCurrentAPIIndex();

    if (!this.currentApiEntryIndex && this.currentApiEntryIndex !== 0) {
      return;
    }
    const extensions = await AppState.getExtensions(this.currentDefault);
    if (currentApi && !extensions) {
      const { id, extensions } = this.apiEntries[this.currentApiEntryIndex];
      const apiExtensions = extensions || {};
      AppState.setExtensions(id, apiExtensions);
    }

  } catch (error) {
    ErrorHandler.handle('Error getting API entries', 'Settings');
  }
  // Every time that the API entries are required in the settings the registry will be checked in order to remove orphan host entries
  await GenericRequest.request('POST', '/hosts/remove-orphan-entries', {
    entries: this.apiEntries
  });
  return;
}

export const AboutSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [appData, setAppData] = useState();

  useEffect(() => {
    GenericRequest.request('GET', '/api/setup').then((data) => {
      const response = data.data.data;
      const appInfo = {
        version: response['app-version'],
        installationDate: response['installationDate'],
        revision: response['revision']
      };
      console.log({ appInfo })
      setAppData(appInfo);
      setIsLoading(false);      // Como si continuaras el bloque try
    }).catch((error) => {
      setIsLoading(false);
      AppState.removeNavigation();
      ErrorHandler.handle(
        error,
        'Settings'
      )
    })
  }, [])
  console.log("App data", { appData })
  return (
    <EuiPage>
      <EuiCallOut >
        <EuiFlexGroup>
          App version: {appData === undefined && isLoading ? <EuiLoadingSpinner /> : <strong>{appData.version}</strong>}
          <EuiFlexItem></EuiFlexItem>
          App revision: {appData === undefined && isLoading ? <EuiLoadingSpinner /> : <strong>{appData.installationDate}</strong>}
          <EuiFlexItem></EuiFlexItem>
          Install date: {appData === undefined && isLoading ? <EuiLoadingSpinner /> : <strong>{appData.revision}</strong>}
          </EuiFlexGroup>
      </EuiCallOut>
    </EuiPage>
  )

}
