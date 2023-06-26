/*
 * Wazuh app - Component to group some components within another
 *
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
import { EuiPopover, EuiButtonEmpty, EuiFlexGroup } from '@elastic/eui';
import { useParentWidth } from './hooks';
import { divideChildren } from './lib'
import './grouping-components.scss'


interface IGroupingComponents {
  children: React.FunctionComponent[]
  buttonLabel(count): string
  width?: number
  direction?: 'horizontal' | 'vertical'
}

const Direction: {[key: string]: 'row' | 'column'} = {
  horizontal: 'row',
  vertical: 'column',
}

export const GroupingComponents: React.FunctionComponent<IGroupingComponents> = ({children, buttonLabel, width = 0.5, direction = 'vertical'}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {parentWidth, ref} = useParentWidth();
  const childrenObj = divideChildren(children, ref, parentWidth, width)
  const label = buttonLabel(childrenObj.hide.length) 
  return (
    <div ref={ref} style={{display: 'flex'}}>
      {childrenObj.show}
      {!!childrenObj.hide.length &&
        <EuiPopover
          button={<EuiButtonEmpty onClick={(e) => setIsOpen(!isOpen)}>{label}</EuiButtonEmpty>}
          isOpen={isOpen}
          hasArrow={false}
          closePopover={() => setIsOpen(false)}>
          <EuiFlexGroup direction={Direction[direction]}>
            {childrenObj.hide}
          </EuiFlexGroup>
        </EuiPopover>
      }
    </div>
  )
}
