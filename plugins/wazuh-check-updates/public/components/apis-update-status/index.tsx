import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiGlobalToastList,
  EuiHealth,
  EuiIconTip,
  EuiInMemoryTable,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { useAvailableUpdates } from '../../hooks';
import { formatUIDate, getCurrentAvailableUpdate } from '../../utils';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';
import { DismissNotificationCheck } from '../dismiss-notification-check';
import { apisUpdateStatusColumns } from './columns';

let toastId = 0;

export const APIsUpdateStatus = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToastHandler = (error: any) => {
    const toast = {
      id: `${toastId++}`,
      title: (
        <FormattedMessage
          id={`wazuhCheckUpdates.apisUpdateStatus.onClickButtonError`}
          defaultMessage="Error trying to get updates"
        />
      ),
      color: 'danger',
      iconType: 'alert',
      text: error?.body?.message,
    } as Toast;
    setToasts(toasts.concat(toast));
  };

  const removeToast = (removedToast: Toast) => {
    setToasts(toasts.filter((toast) => toast.id !== removedToast.id));
  };

  // const { availableUpdates, isLoading, refreshAvailableUpdates, error } = useAvailableUpdates();

  const handleOnClick = async () => {
    // const response = await refreshAvailableUpdates(true, true);
    // if (response instanceof Error) {
    //   addToastHandler(response);
    // }
  };

  // useEffect(() => {
  //   setCurrentUpdate(getCurrentAvailableUpdate(availableUpdates));
  // }, [availableUpdates]);

  const availableUpdates = {
    mayor: [],
    minor: [
      {
        description:
          '## Manager\r\n\r\n### Added\r\n\r\n- Added support for Arch Linux OS in Vulnerability Detector...',
        published_date: '2022-05-05T16:06:52Z',
        semver: {
          mayor: 4,
          minor: 3,
          patch: 0,
        },
        tag: 'v4.3.0',
        title: 'Wazuh v4.3.0',
      },
      {
        description:
          '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
        published_date: '2022-05-18T10:12:43Z',
        semver: {
          mayor: 4,
          minor: 3,
          patch: 1,
        },
        tag: 'v4.3.1',
        title: 'Wazuh v4.3.1',
      },
      {
        description:
          '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
        published_date: '2022-06-20T13:20:11Z',
        semver: {
          mayor: 4,
          minor: 3,
          patch: 2,
        },
        tag: 'v4.3.2',
        title: 'Wazuh v4.3.2',
      },
    ],
    patch: [],
    last_check: '2023-09-28 12:32',
  };

  const items = [
    { apiId: 'imposter', version: '3.7.2', upToDate: false, availableUpdates },
    { apiId: 'manager', version: '4.8.0', upToDate: true, availableUpdates },
    { apiId: 'api', version: '4.3.5', upToDate: false, availableUpdates },
  ];

  const isLoading = false;

  return (
    <I18nProvider>
      <EuiFlexGroup justifyContent="spaceBetween" gutterSize="m" alignItems="center">
        <EuiFlexItem>
          <EuiTitle>
            <h2>
              <FormattedMessage
                id={`wazuhCheckUpdates.apisUpdateStatus.tableTitle`}
                defaultMessage="Wazuh APIs version"
              />
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <DismissNotificationCheck />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton isLoading={isLoading} onClick={handleOnClick} size="s" iconType="refresh">
            <FormattedMessage
              id="wazuhCheckUpdates.apisUpdateStatus.buttonText"
              defaultMessage="Check updates"
            />
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="l" />
      <EuiInMemoryTable
        // itemId="tablaId"
        items={items}
        columns={apisUpdateStatusColumns}
        responsive
        loading={isLoading}
      />
      <EuiGlobalToastList toasts={toasts} dismissToast={removeToast} toastLifeTimeMs={6000} />
    </I18nProvider>
  );
};
