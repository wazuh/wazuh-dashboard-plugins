import React from 'react';
import { EuiProgress, EuiText, EuiSpacer } from '@elastic/eui';

export const LoadingServerUserLogging = ({
  useLoadingLogo,
}: {
  useLoadingLogo: () => string;
}) => {
  const imageSrc = useLoadingLogo();
  return (
    <div className='withServerUserLogged'>
      <img src={imageSrc} className='withServerUserLogged-logo' alt=''></img>
      <EuiSpacer size='s' />
      <EuiText className='subdued-color'>Loading ...</EuiText>
      <EuiSpacer size='s' />
      <EuiProgress
        className='withServerUserLogged-loader'
        size='xs'
        color='primary'
      />
    </div>
  );
};
