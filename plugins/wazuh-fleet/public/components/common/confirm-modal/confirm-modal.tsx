import React from 'react';
import { EuiConfirmModal } from '@elastic/eui';

interface ConfirmModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  buttonColor?: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isVisible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  buttonColor = 'danger',
  isLoading = false,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <EuiConfirmModal
      title={title}
      onCancel={onCancel}
      onConfirm={onConfirm}
      cancelButtonText={cancelButtonText}
      confirmButtonText={confirmButtonText}
      buttonColor={buttonColor}
      isLoading={isLoading}
      defaultFocusedButton='confirm'
    >
      <p>{message}</p>
    </EuiConfirmModal>
  );
};
