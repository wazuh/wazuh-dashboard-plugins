import '@testing-library/jest-dom';
import React from 'react';
import { configure, fireEvent, render, screen } from '@testing-library/react';
import { SeverityFilter } from './severity-filter';

configure({ testIdAttribute: 'data-test-subj' });

const openOptions = () =>
  fireEvent.click(screen.getByTestId('comboBoxToggleListButton'));

describe('SeverityFilter', () => {
  it('lists the four severity bands', () => {
    render(<SeverityFilter selected={[]} onChange={jest.fn()} />);
    openOptions();
    ['low', 'medium', 'high', 'critical'].forEach(severity =>
      expect(
        screen.getByTestId(`ctiExplorerSeverityFilter-${severity}`),
      ).toBeInTheDocument(),
    );
  });

  it('adds a band, keeping the bands in their order', () => {
    const onChange = jest.fn();
    render(<SeverityFilter selected={['critical']} onChange={onChange} />);
    openOptions();
    fireEvent.click(screen.getByTestId('ctiExplorerSeverityFilter-low'));
    expect(onChange).toHaveBeenCalledWith(['low', 'critical']);
  });

  it('shows the selected bands', () => {
    render(
      <SeverityFilter selected={['medium', 'high']} onChange={jest.fn()} />,
    );
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('explains how the severities match the scores', async () => {
    render(<SeverityFilter selected={[]} onChange={jest.fn()} />);
    fireEvent.mouseOver(screen.getByTestId('ctiExplorerSeverityFilterHelp'));
    expect(
      await screen.findByText(
        /at least one of its scores is in a selected range/,
      ),
    ).toBeInTheDocument();
  });
});
