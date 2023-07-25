/*
 * Wazuh app - Component to truncate an array of components horizontally
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useRef } from 'react';
import { EuiPopover, EuiButtonEmpty, EuiFlexGroup } from '@elastic/eui';

interface TruncateHorizontalComponentsProps{
  components: any[]
  labelButtonHideComponents: (count: number) => string
  renderButton?: any
  buttonProps?: any
  renderHideComponents?: any
  componentsWidthPercentage: number
};

export const TruncateHorizontalComponents: React.FunctionComponent<TruncateHorizontalComponentsProps> = ({components, labelButtonHideComponents, renderButton, buttonProps, renderHideComponents, componentsWidthPercentage = 1 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef();
  const {componentsShow, componentsHide} = groupShowOrHideComponents(components, containerRef, componentsWidthPercentage);
  
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const buttonPopover = renderButton
    ? renderButton({ open, componentsHide})
    : <EuiButtonEmpty {...buttonProps} onClick={() => setIsOpen(!isOpen)}>{labelButtonHideComponents(componentsHide.length)}</EuiButtonEmpty>;

  return (
    <div ref={containerRef} style={{display: 'block'}}>
      {componentsShow}
      {componentsHide.length ?
        <EuiPopover
          button={buttonPopover}
          isOpen={isOpen}
          closePopover={close}>
            {renderHideComponents && renderHideComponents({ close, componentsHide }) || (
              <EuiFlexGroup>
              {componentsHide}
              </EuiFlexGroup>
            )}
          
        </EuiPopover>
        : null
      }
    </div>
  )
};

/**
 * 
 * @param components Children components
 * @param containerRef Container reference
 * @param componentsWidthPercentage Percentage which components take
 */
const groupShowOrHideComponents = (components, containerRef, componentsWidthPercentage) => {
  if(!containerRef.current || !containerRef.current.offsetWidth) return {componentsShow: components, componentsHide: []};
  return components.reduce((accum, child, key) => {
    const childs = ((containerRef || {}).current || {}).childNodes;
    const currentChild = !!childs && childs[key];
    accum.width += ((currentChild || {}).offsetWidth || 0) ;
    if (currentChild && accum.width <= (containerRef.current.offsetWidth * componentsWidthPercentage)) {
      accum.componentsShow.push(child);
    } else {
      accum.componentsHide.push(child);
    }
    return accum
  }, { componentsShow: [], componentsHide: [], width: 0 });
} 