import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiGlobalToastList,
  EuiHealth,
  EuiIconTip,
  EuiLoadingSpinner,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { useAvailableUpdates } from '../hooks';
import { formatUIDate, getCurrentAvailableUpdate } from '../utils';
import { Update } from '../../common/types';
import { Toast } from '@elastic/eui/src/components/toast/global_toast_list';

export interface UpToDateStatusProps {
  setCurrentUpdate: (currentUpdate?: Update) => void;
}

let toastId = 0;

export const UpToDateStatus = ({ setCurrentUpdate }: UpToDateStatusProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToastHandler = (error: any) => {
    const toast = {
      id: `${toastId++}`,
      title: (
        <FormattedMessage
          id={`wazuhCheckUpdates.upToDateStatus.onClickButtonError`}
          defaultMessage="Error trying to get updates"
        />
      ),
      color: 'danger',
      iconType: 'alert',
      text: error.body.message,
    } as Toast;
    setToasts(toasts.concat(toast));
  };

  const removeToast = (removedToast: Toast) => {
    setToasts(toasts.filter((toast) => toast.id !== removedToast.id));
  };

  const { availableUpdates, isLoading, refreshAvailableUpdates, error } = useAvailableUpdates();

  const handleOnClick = async () => {
    const response = await refreshAvailableUpdates(true, true);
    if (response instanceof Error) {
      addToastHandler(response);
    }
  };

  useEffect(() => {
    setCurrentUpdate(getCurrentAvailableUpdate(availableUpdates));
  }, [availableUpdates]);

  const currentUpdate = getCurrentAvailableUpdate(availableUpdates);

  const isUpToDate = !currentUpdate;

  const getI18nMessageId = () => {
    if (error) {
      return 'getAvailableUpdatesError';
    }
    if (isUpToDate) {
      return 'upToDate';
    }
    return 'availableUpdates';
  };

  const getDefaultMessage = () => {
    if (error) {
      return 'Error trying to get available updates';
    }
    if (isUpToDate) {
      return 'Up to date';
    }
    return 'Available updates';
  };

  const getColor = () => {
    if (error) {
      return 'danger';
    }
    if (isUpToDate) {
      return 'success';
    }
    return 'warning';
  };

  return (
    <I18nProvider>
      <EuiFlexGroup alignItems="center" gutterSize="m">
        <EuiFlexItem grow={false} style={{ maxWidth: 'max-content', minWidth: '150px' }}>
          {!isLoading ? (
            <EuiFlexGroup gutterSize="none" wrap={false}>
              <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
                <EuiHealth color={getColor()}>
                  <FormattedMessage
                    id={`wazuhCheckUpdates.upToDateStatus.${getI18nMessageId()}`}
                    defaultMessage={getDefaultMessage()}
                  />
                </EuiHealth>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
                <EuiIconTip
                  type="iInCircle"
                  color="subdued"
                  title={
                    <FormattedMessage
                      id={`wazuhCheckUpdates.upToDateStatus.lastCheck`}
                      defaultMessage="Last check"
                    />
                  }
                  content={
                    availableUpdates?.last_check
                      ? formatUIDate(new Date(availableUpdates.last_check))
                      : '-'
                  }
                  iconProps={{
                    className: 'eui-alignTop',
                  }}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : (
            <EuiLoadingSpinner size="m" />
          )}
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
          <EuiButton isLoading={isLoading} onClick={handleOnClick} size="s" iconType="refresh">
            <FormattedMessage
              id="wazuhCheckUpdates.upToDateStatus.buttonText"
              defaultMessage="Check updates"
            />
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiGlobalToastList toasts={toasts} dismissToast={removeToast} toastLifeTimeMs={6000} />
    </I18nProvider>
  );
};
