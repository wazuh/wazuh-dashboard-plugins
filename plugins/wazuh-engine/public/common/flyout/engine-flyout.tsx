import React from 'react';
import './styles.scss';
import { EuiFlyout } from '@elastic/eui';
export const EngineFlyout = ({ onClose, children }) => {
  return (
    <EuiFlyout
      size='l'
      onClose={onClose}
      className='wz-inventory wzApp wz-decoders-flyout'
    >
      {children}
    </EuiFlyout>
  );
};
