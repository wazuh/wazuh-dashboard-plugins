/*
 * Wazuh app - React component for button that opens a modal
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';

import {
  EuiOverlayMask,
  EuiConfirmModal
} from '@elastic/eui';

import { withButtonOpenOnClick } from '../hocs';
import { WzButton } from './button';

export const WzButtonOpenOnClick = withButtonOpenOnClick(WzButton);

interface WzButtonModalConfirmProps{
  onConfirm: (ev) => void
  onCancel?: (ev) => void
  modalTitle: string
  modalConfirmText?: string
  modalCancelText?: string
  modalProps: any
  [key: string]: any
};

export const WzButtonModalConfirm: React.FunctionComponent<WzButtonModalConfirmProps> = ({onConfirm, onCancel, modalTitle, modalConfirmText = 'Confirm', modalCancelText = 'Cancel', modalProps = {}, ...rest }) => {
  return (
    <WzButtonOpenOnClick
      {...rest}
      render={({close}) => {
        const onModalConfirm = () => {
          close();
          onConfirm && onConfirm();
        };
        const onModalCancel = () => {
          close();
          onCancel && onCancel();
        };
        return (
          <EuiOverlayMask onClick={close}>
            <EuiConfirmModal
              title={modalTitle}
              onCancel={onModalCancel}
              onConfirm={onModalConfirm}
              cancelButtonText={modalCancelText}
              confirmButtonText={modalConfirmText}
              defaultFocusedButton={modalProps.defaultFocusedButton || "confirm"}
              {...modalProps}
              >
            </EuiConfirmModal>
          </EuiOverlayMask>
        )
      }}
    />
  )
};

