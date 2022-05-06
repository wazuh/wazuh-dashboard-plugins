/*
 * Wazuh app - React component building the configuration component.
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
import React, { } from 'react';
import { Category } from './components';
import { ISetting } from '../../configuration';
import { EuiFlexGroup } from '@elastic/eui';

interface ICategoriesProps {
  config: ISetting[],
  updatedConfig: {[field:string]: string | number | boolean | []}
  setUpdatedConfig({}): void 
}

export const Categories:React.FunctionComponent<ICategoriesProps> = ({ config, updatedConfig, setUpdatedConfig }) => {
  const categories: {[category:string]: ISetting[]} = config.reduce((acc, conf) => {
    if (!conf.category) return acc;
    return {
      ...acc,
      [conf.category]: [
        ...(acc[conf.category] || []),
        conf,
      ]
    }
  }, {})
  return (
    <EuiFlexGroup direction='column'>
      {Object.keys(categories).map((category, idx) => ( 
        <Category 
          key={idx}
          name={category}
          items={categories[category]}
          updatedConfig={updatedConfig} 
          setUpdatedConfig={setUpdatedConfig} />))}
    </EuiFlexGroup>
  );
}
