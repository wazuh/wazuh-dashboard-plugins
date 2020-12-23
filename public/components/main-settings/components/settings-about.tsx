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
  EuiPageBody,
  EuiText,
  EuiButtonIcon,
  EuiColor,
  EuiSwitch,
  EuiSpacer
} from '@elastic/eui';
import { TabDescription } from '../../../../server/reporting/tab-description';
import { kibana } from '../../../../package.json';
import moment from "moment";
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
      setIsLoading(false);
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

    <EuiPageBody>
      <EuiSpacer size="s" />
      <EuiCallOut size="m">
        <EuiSpacer size="s" />
        <EuiFlexGroup>
          <EuiText style={{ marginLeft: 20 }}>
            App version: {appData === undefined && isLoading ? <EuiLoadingSpinner /> : <strong>{appData.version}</strong>}
          </EuiText >
          <EuiText style={{ marginLeft: 300 }}>
            App revision: {appData === undefined && isLoading ? <EuiLoadingSpinner /> : <strong>{appData.revision}</strong>}
          </EuiText>
          <EuiText style={{ marginLeft: 300 }}>
            Install date: {appData === undefined && isLoading ? <EuiLoadingSpinner /> : <strong>{moment(appData.installationDate).format(" MMM Do, YYYY H:mm")}</strong>}
          </EuiText>
        </EuiFlexGroup>
      </EuiCallOut>
      <EuiSpacer></EuiSpacer>
      <EuiFlexGroup direction="row" gutterSize="l">
        <EuiFlexItem>
          <EuiPanel >
            <EuiFlexGroup gutterSize="l" direction="row">
              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize="l" direction="row">
                  <EuiFlexItem>
                    <EuiTitle size="m">
                      <h2>Welcome to the Wazuh app for Kibana {kibana.version}</h2>
                    </EuiTitle>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer>
            </EuiSpacer>
            <EuiText size="m">
              <p>
                Wazuh Kibana plugin provides management and monitoring capabilities, giving users control
                over the Wazuh infrastructure. Using this plugin you can monitor your agents status and
                configuration, query and visualize your alert data and monitor manager rules and
                configuration.
                  </p>
            </EuiText>

          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel paddingSize="l">
            <EuiFlexGroup gutterSize="l" direction="row">
              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize="l" direction="row">
                  <EuiFlexItem>
                    <EuiTitle size="m">
                      <h2>Community</h2>
                    </EuiTitle>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="m"></EuiSpacer>
            <EuiText size="m">
              <p>
                Enjoy your Wazuh experience and please don't hesitate to give us your feedback.
                  </p>
            </EuiText>
            <EuiSpacer size="l"></EuiSpacer>
            <EuiFlexGroup justifyContent="center">
              <EuiButtonIcon iconType='logoSlack' iconSize='xxl' href='https://wazuh.com/community/join-us-on-slack/' target='_blank' aria-label='Wazuh Slack' style={{ marginLeft: 16 }}>
              </EuiButtonIcon>
              <EuiText size="m"><p>      </p></EuiText>
              <EuiButtonIcon iconType='logoGmail' iconSize='xxl' href='https://groups.google.com/forum/#!forum/wazuh' target='_blank' aria-label='Wazuh forum' style={{ marginLeft: 16 }}>
              </EuiButtonIcon>
              <EuiButtonIcon iconType='logoGithub' iconSize='xxl' href='https://github.com/wazuh/wazuh-kibana-app' target='_blank' aria-label='Wazuh app Github' style={{ marginLeft: 16 }}>
              </EuiButtonIcon>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPageBody>

  )

}
