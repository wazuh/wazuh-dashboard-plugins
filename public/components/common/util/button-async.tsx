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