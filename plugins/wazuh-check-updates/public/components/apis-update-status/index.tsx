import {
  EuiButton,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiGlobalToastList,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { useAvailableUpdates } from '../../hooks';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';
import { DismissNotificationCheck } from '../dismiss-notification-check';
import { ApisUpdateTable } from './table';
import { formatUIDate } from '../../utils';
import { ApiAvailableUpdates } from '../../../common/types';

export interface ApisUpdateStatusProps {
  setApisAvailableUpdates: (apisAvailableUpdates: ApiAvailableUpdates[]) => void;
}

export const ApisUpdateStatus = ({ setApisAvailableUpdates }: ApisUpdateStatusProps) => {
  const [toastId, setToastId] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToastHandler = (error: any) => {
    const newToastId = toastId + 1;
    setToastId(newToastId);
    const toast = {
      id: `${newToastId}`,
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

  const {
    apisAvailableUpdates,
    isLoading,
    refreshAvailableUpdates,
    lastCheck,
  } = useAvailableUpdates();

  useEffect(() => {
    setApisAvailableUpdates(apisAvailableUpdates);
  }, [apisAvailableUpdates]);

  const handleOnClick = async () => {
    const response = await refreshAvailableUpdates(true, true);
    if (response instanceof Error) {
      addToastHandler(response);
    }
  };

  return (
    <I18nProvider>
      <>
        <EuiTitle>
          <h2>
            <FormattedMessage
              id={`wazuhCheckUpdates.apisUpdateStatus.tableTitle`}
              defaultMessage="Wazuh APIs version"
            />
          </h2>
        </EuiTitle>
        <EuiSpacer size="l" />
        <EuiFlexGroup justifyContent="spaceBetween" gutterSize="m" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiButton isLoading={isLoading} onClick={handleOnClick} size="s" iconType="refresh">
              <FormattedMessage
                id="wazuhCheckUpdates.apisUpdateStatus.buttonText"
                defaultMessage="Check updates"
              />
            </EuiButton>
          </EuiFlexItem>
          {lastCheck ? (
            <EuiFlexItem>
              <EuiDescriptionList
                compressed
                listItems={[
                  {
                    title: (
                      <FormattedMessage
                        id={`wazuhCheckUpdates.apisUpdateStatus.lastCheck`}
                        defaultMessage="Last check"
                      />
                    ),
                    description: formatUIDate(new Date(lastCheck)),
                  },
                ]}
              />
            </EuiFlexItem>
          ) : null}
          <EuiFlexItem grow={false}>
            <DismissNotificationCheck />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <ApisUpdateTable apisAvailableUpdates={apisAvailableUpdates} isLoading={isLoading} />
        <EuiGlobalToastList toasts={toasts} dismissToast={removeToast} toastLifeTimeMs={6000} />
      </>
    </I18nProvider>
  );
};
