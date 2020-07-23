import React, { useState } from 'react';
import { EuiButton } from '@elastic/eui';

export const WzButtonAsync = ({button, disableWhileLoading, onClick, onChange, onClickStart, onClickEnd, onClickSuccess, onClickError, children, ...buttonProps}) => {
  const [isLoading, setIsLoading] = useState(false);
  const Button = button || EuiButton;
  
  useState(() => {
    onChange && onChange(isLoading);
  }, [isLoading]);

  const executeOnClick = onClick ? async () => {
    setIsLoading(true);
    try{
      onClickStart && onClickStart();
      await onClick();
      onClickSuccess && onClickSuccess();
    }catch(error){
      onClickError && onClickError(error);
    }
    setIsLoading(false);
    onClickEnd && onClickEnd();
  } : undefined;
  return <Button {...buttonProps} onClick={executeOnClick} isLoading={isLoading} isDisabled={disableWhileLoading && isLoading}>{children}</Button>
}