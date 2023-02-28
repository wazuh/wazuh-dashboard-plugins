/*
 * Wazuh app - React HOC to add open modal/flyout logic to other component
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState } from 'react';


export const withButtonOpenOnClick = WrappedComponent => ({render, onClick, onClose, ...rest} : {render?:any, [x:string]: any}) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = ev => {
    typeof onClick === 'function' && onClick(ev);
    setIsOpen(true);
  };
  const close = ev => {
    typeof onClose === 'function' && onClose(ev);
    setIsOpen(false)
  };

  return (
    <>
      <WrappedComponent {...rest} onClick={open}/>
      {isOpen && (
        render({open, close})
      )}
    </>
  )
}
