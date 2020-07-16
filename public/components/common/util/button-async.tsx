import React, { useState } from 'react';
import { EuiButton } from '@elastic/eui';

export const WzButtonAsync = ({button, disableWhileLoading, onClick, onClickStart, onClickEnd, onClickSuccess, onClickError, children, ...buttonProps}) => {
  const [isLoading, setIsLoading] = useState(false);
  const Button = button || EuiButton;
  const executeOnClick = onClick ? async () => {
    setIsLoading(true);
    try{
      onClickStart && onClickStart(true);
      await onClick();
      onClickSuccess && onClickSuccess(true);
    }catch(error){
      onClickError && onClickError();
    }
    setIsLoading(false);
    onClickEnd && onClickEnd(false);
  } : undefined;
  return <Button {...buttonProps} onClick={executeOnClick} isLoading={isLoading} isDisabled={disableWhileLoading && isLoading}>{children}</Button>
}