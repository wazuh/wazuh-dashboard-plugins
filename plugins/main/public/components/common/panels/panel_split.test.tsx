  
/*
 * Wazuh app - PanelSplit Component - Test
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { shallow } from 'enzyme';
import { PanelSplit } from './panel_split';

describe({i18n.translate('wazuh.common.panelsplitcontainer', { defaultMessage: 'PanelSplit container' })}, () => {
  test('should render the component', () => {
    const component = shallow(<PanelSplit side={<div>{i18n.translate('wazuh.common.sidepanel', { defaultMessage: 'Side panel' })}</div>} content={<div>{i18n.translate('wazuh.common.contentpanel', { defaultMessage: 'Content panel' })}</div>}/>);

    expect(component).toMatchSnapshot();
  });
});
