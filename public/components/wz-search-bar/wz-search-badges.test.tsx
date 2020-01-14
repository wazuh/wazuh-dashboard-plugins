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
