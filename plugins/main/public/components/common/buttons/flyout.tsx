import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  WzButtonOpenOnClick,
  WzButtonPermissionsOpenOnClick,
} from './modal-confirm';
import { WzFlyout } from '../flyouts';
import {
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiConfirmModal,
  EuiOverlayMask,
} from '@elastic/eui';

function RenderFlyout({ flyoutTitle, flyoutProps, flyoutBody, onClose }) {
  const [canClose, setCanClose] = useState(true);
  const [canNotCloseIsOpen, setCanNotCloseIsOpen] = useState(false);
  const onFlyoutClose = function () {
    if (!canClose) {
      setCanNotCloseIsOpen(true);
      return;
    }
    onClose();
  };

  return (
    <>
      <WzFlyout
        onClose={onFlyoutClose}
        flyoutProps={{
          maxWidth: '60%',
          size: 'l',
          className: 'flyout-no-overlap wz-inventory wzApp',
          'aria-labelledby': 'flyoutSmallTitle',
          ...flyoutProps,
        }}
      >
        <EuiFlyoutHeader hasBorder className='flyout-header'>
          <EuiTitle size='s'>
            <h2>{flyoutTitle}</h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody className='flyout-body'>
          {typeof flyoutBody === 'function'
            ? flyoutBody({
                onClose,
                onUpdateCanClose: setCanClose,
              })
            : flyoutBody}
        </EuiFlyoutBody>
      </WzFlyout>
      {canNotCloseIsOpen && (
        <EuiOverlayMask>
          <EuiConfirmModal
            title={i18n.translate(
              'wazuh.common.flyoutButton.unsavedChangesModal.title',
              {
                defaultMessage: 'Unsubmitted changes',
              },
            )}
            onConfirm={onClose}
            onCancel={() => setCanNotCloseIsOpen(false)}
            cancelButtonText={i18n.translate(
              'wazuh.common.flyoutButton.unsavedChangesModal.cancelButton',
              { defaultMessage: "No, don't do it" },
            )}
            confirmButtonText={i18n.translate(
              'wazuh.common.flyoutButton.unsavedChangesModal.confirmButton',
              { defaultMessage: 'Yes, do it' },
            )}
          >
            <p style={{ textAlign: 'center' }}>
              {i18n.translate(
                'wazuh.common.flyoutButton.unsavedChangesModal.body',
                {
                  defaultMessage:
                    'There are unsaved changes. Are you sure you want to proceed?',
                },
              )}
            </p>
          </EuiConfirmModal>
        </EuiOverlayMask>
      )}
    </>
  );
}

export const WzButtonOpenFlyout: React.FunctionComponent<any> = ({
  flyoutTitle,
  flyoutProps = {},
  flyoutBody = null,
  buttonProps = {},
  ...rest
}) => (
  <WzButtonOpenOnClick
    {...rest}
    {...buttonProps}
    render={({ close: onClose }) => (
      <RenderFlyout
        flyoutTitle={flyoutTitle}
        flyoutProps={flyoutProps}
        flyoutBody={flyoutBody}
        onClose={onClose}
      />
    )}
  />
);

export const WzButtonPermissionsOpenFlyout: React.FunctionComponent<any> = ({
  flyoutTitle,
  flyoutProps = {},
  flyoutBody = null,
  buttonProps = {},
  ...rest
}) => (
  <WzButtonPermissionsOpenOnClick
    {...rest}
    {...buttonProps}
    render={({ close: onClose }) => (
      <RenderFlyout
        flyoutTitle={flyoutTitle}
        flyoutProps={flyoutProps}
        flyoutBody={flyoutBody}
        onClose={onClose}
      />
    )}
  />
);
