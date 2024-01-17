import React from 'react';
import {
  WzButtonOpenOnClick,
  WzButtonPermissionsOpenOnClick,
} from './modal-confirm';
import { WzFlyout } from '../flyouts';
import { EuiFlyoutHeader, EuiFlyoutBody, EuiTitle } from '@elastic/eui';

function renderFlyout({ flyoutTitle, flyoutProps, flyoutBody, onClose }) {
  return (
    <WzFlyout
      onClose={onClose}
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
          ? flyoutBody({ onClose })
          : flyoutBody}
      </EuiFlyoutBody>
    </WzFlyout>
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
    render={({ close: onClose }) =>
      renderFlyout({ flyoutTitle, flyoutProps, flyoutBody, onClose })
    }
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
    render={({ close: onClose }) =>
      renderFlyout({ flyoutTitle, flyoutProps, flyoutBody, onClose })
    }
  />
);
