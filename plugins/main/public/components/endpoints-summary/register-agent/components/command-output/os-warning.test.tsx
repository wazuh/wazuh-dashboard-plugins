import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import OsCommandWarning from './os-warning';

describe('OsCommandWarning', () => {
  it('asks for a PowerShell terminal opened as Administrator on Windows', () => {
    render(<OsCommandWarning os='WINDOWS' />);

    expect(
      screen.getByText(
        'Run these commands in a Windows PowerShell terminal opened as Administrator.',
      ),
    ).toBeInTheDocument();
  });
});
