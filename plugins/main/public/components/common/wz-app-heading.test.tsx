import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WzAppHeading } from './wz-app-heading';
import { getWzCurrentAppID } from '../../kibana-services';
import { overview, threatHunting } from '../../utils/applications';

jest.mock('../../kibana-services', () => ({
  getWzCurrentAppID: jest.fn(),
}));

const mockAppId = (id: string) =>
  (getWzCurrentAppID as jest.Mock).mockReturnValue(id);

describe('WzAppHeading', () => {
  it('renders the current app title as a level 1 heading', () => {
    mockAppId(threatHunting.id);
    render(<WzAppHeading />);
    expect(
      screen.getByRole('heading', { level: 1, name: threatHunting.title }),
    ).toBeInTheDocument();
  });

  it('renders nothing on Overview, which shows its own h1', () => {
    mockAppId(overview.id);
    const { container } = render(<WzAppHeading />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an unknown app', () => {
    mockAppId('unknown');
    const { container } = render(<WzAppHeading />);
    expect(container).toBeEmptyDOMElement();
  });
});
