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
import { EuiButton, EuiButtonEmpty, EuiButtonIcon, EuiLink } from '@elastic/eui';

export const WzButtonAsync = ({buttonType = 'default', disableWhileLoading, onClick, onChange, onClickStart, onClickEnd, onClickSuccess, onClickError, children, loadingLabel, ...rest}) => {
  const [isLoading, setIsLoading] = useState(false);
  const Button = buttonType === 'default' ? EuiButton
    : buttonType === 'empty' ? EuiButtonEmpty 
    : buttonType === 'icon' ? EuiButtonIcon 
    : buttonType === 'link' ? EuiLink 
    : buttonType;

  const disabled = Boolean((disableWhileLoading && isLoading) || rest.isDisabled || rest.disabled);
  const disabledProp = buttonType !== 'link' ? { isDisabled: disabled } : { disabled };

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
  return <Button {...rest} onClick={executeOnClick} isLoading={isLoading} {...disabledProp}>{isLoading && loadingLabel ? loadingLabel : children}</Button>
}