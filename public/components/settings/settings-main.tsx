import React from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { updateSelectedSettingsSection } from '../../redux/actions/appStateActions';
import {
  EuiTab,
  EuiTabs
} from '@elastic/eui';
import { withReduxProvider } from '../common/hocs';

export function MainSettings() {
  let settingsTab = useSelector(state => state.appStateReducers.selected_settings_section);
  const dispatch = useDispatch();


  const tabs = [
    {
      id: 'api',
      name: 'API'
    },
    {
      id: 'modules',
      name: 'Modules',
    },
    {
      id: 'sampledata',
      name: 'Sample data',
    },
    {
      id: 'configuration',
      name: 'Configuration',
    },
    {
      id: 'logs',
      name: 'Logs',
    },
    {
      id: 'about',
      name: 'About'
    },
  ];
  const settingTabs = tabs.map((tab, index) => (
    <EuiTab
      // {...(tab.href && { href: tab.href, target: '_blank' })}
      onClick={() => dispatch(updateSelectedSettingsSection(tab.id))}
      isSelected={tab.id === settingsTab}
      // disabled={tab.disabled}
      key={index}>
      {tab.name}
    </EuiTab>
  ));
const [_,queryParam] = window.location.hash.split('?')
const queryUrlParams = new URLSearchParams(queryParam)

console.log("LOCATION",queryUrlParams.get("tab"),window.location.href,"OTRO",settingsTab)
    return  <EuiTabs>{settingTabs}</EuiTabs>

}
export const MainSettingsWithReduxProvider = withReduxProvider(MainSettings)
