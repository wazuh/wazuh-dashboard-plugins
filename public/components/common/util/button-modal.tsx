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