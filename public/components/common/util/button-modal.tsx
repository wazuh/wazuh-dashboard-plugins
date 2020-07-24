/*
 * Wazuh app - React component for all management section.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, {Fragment} from 'react';
import { EuiOverlayMask, EuiModal, EuiConfirmModal } from '@elastic/eui';

export const WzButtonModal = ({button, isOpen, children, onClose, ...rest}) => {
  return (<Fragment>
    {button}
    {isOpen && (
      <EuiOverlayMask onClick={(e) => { e.target.className === 'euiOverlayMask' && onClose() }}>
        <EuiModal
          onClose={onClose}
          {...rest}
        >
          {children}
        </EuiModal>
      </EuiOverlayMask>
    )}
  </Fragment>)
}

export const WzButtonConfirmModal = ({button, closeModal, isOpen, children, ...rest}) => {
  return (<Fragment>
    {button}
    {isOpen && (
      <EuiOverlayMask onClick={(e) => { e.target.className === 'euiOverlayMask' && closeModal() }}>
        <EuiConfirmModal
          {...rest}
        >
          {children}
        </EuiConfirmModal>
      </EuiOverlayMask>
    )}
  </Fragment>)
}