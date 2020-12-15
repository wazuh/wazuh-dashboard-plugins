/*
 * Wazuh app - React component for building the Overview welcome screen - Test
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { shallow } from 'enzyme';
import { OverviewWelcome } from './overview-welcome';

describe('Overview welcome component', () => {
  test('should render a Overview welcome screen', () => {
    const extensions = {
      audit: true,
      pci: true,
      gdpr: true,
      hipaa: true,
      nist: true,
      tsc: true,
      oscap: true,
      ciscat: true,
      aws: true,
      gcp: true,
      virustotal: true,
      osquery: true,
      docker: true,
    };
    const component = shallow(<OverviewWelcome extensions={extensions} />);

    expect(component).toMatchSnapshot();
  });

  test('should render a Overview welcome screen with any extension', () => {
    const extensions = {
      audit: false,
      pci: false,
      gdpr: false,
      hipaa: false,
      nist: false,
      tsc: false,
      oscap: false,
      ciscat: false,
      aws: false,
      gcp: false,
      virustotal: false,
      osquery: false,
      docker: false,
    };
    const component = shallow(<OverviewWelcome extensions={extensions} />);

    expect(component).toMatchSnapshot();
  });
});
