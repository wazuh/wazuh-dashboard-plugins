import React from 'react';
import {
	EuiButton,
	EuiFlexGroup,
	EuiFlexItem,
} from '@elastic/eui';
import { PLUGIN_PLATFORM_NAME } from '../../../../../../../common/constants';
import { getToasts } from '../../../../../../kibana-services';

export const toastRequiresReloadingBrowserTab = () => {
	getToasts().add({
	  color: 'success',
	  title: 'Reload the page to apply the changes',
	  text: <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
		<EuiFlexItem grow={false}>
		  <EuiButton onClick={() => window.location.reload()} size="s">Reload page</EuiButton>
		</EuiFlexItem>
	  </EuiFlexGroup>
	});
};
  
export const toastRequiresRunningHealthcheck = () => {
	const toast = getToasts().add({
	  color: 'warning',
	  title: 'Run a health check to apply the changes.',
	  toastLifeTimeMs: 5000,
	  text:
		<EuiFlexGroup alignItems="center" gutterSize="s">
		  <EuiFlexItem grow={false} >
			<EuiButton onClick={() => {
			  getToasts().remove(toast);
			  window.location.href = '#/health-check';
			}} size="s">Execute health check</EuiButton>
		  </EuiFlexItem>
		</EuiFlexGroup>
	});
};
  
export const toastRequiresRestartingPluginPlatform = () => {
	getToasts().add({
	  color: 'warning',
	  title: `Restart ${PLUGIN_PLATFORM_NAME} to apply the changes`,
	});
};
  
export const toastSuccessUpdateConfiguration = () => {
	getToasts().add({
	  color: 'success',
	  title: 'The configuration has been successfully updated',
	});
};