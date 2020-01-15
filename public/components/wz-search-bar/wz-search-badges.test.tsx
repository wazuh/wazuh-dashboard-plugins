/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';
import {
  render,
  fireEvent,
  waitForElement
} from '@testing-library/react'
import {
  WzSearchBadges,
  Props as WzSearchBadgesProps
} from "./wz-search-badges";
import { findByTestId } from '@testing-library/dom'
import '@testing-library/jest-dom/extend-expect';

function renderWzSearchBadges(props: Partial<WzSearchBadgesProps> = {}) {
  const defaultProps: WzSearchBadgesProps = {
    onChange() {return;},
    filters: []
  };
  return render( < WzSearchBadges {...defaultProps} {...props} />);
}

describe("<WzSearchBadges />", () => {
  test('should not display any badges when no have filters', async () => {
    const { findByTestId } = renderWzSearchBadges();
    const searchBadges = await findByTestId('search-badges')

    expect(searchBadges).toBeEmpty();
  });
});
