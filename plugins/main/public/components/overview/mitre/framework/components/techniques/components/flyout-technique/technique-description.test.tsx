import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TechniqueDescription } from './technique-description';

// jsdom does no layout, so the heights are set by hand
const mockHeights = (scrollHeight: number, clientHeight: number) => {
  jest
    .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
    .mockReturnValue(scrollHeight);
  jest
    .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
    .mockReturnValue(clientHeight);
};

const getContent = () =>
  document.querySelector<HTMLElement>(
    '[data-test-subj="technique-description"]',
  )!;

describe('TechniqueDescription', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shows a short description in full, without a toggle', () => {
    mockHeights(100, 100);
    render(<TechniqueDescription id='desc' markdown='Short text.' />);

    expect(screen.getByText('Short text.')).toBeTruthy();
    expect(screen.queryByText('Show full description')).toBeNull();
    expect(getContent().style.maxHeight).toBe('10.5em');
  });

  it('collapses a long description and toggles it', () => {
    mockHeights(600, 147);
    render(<TechniqueDescription id='desc' markdown='Long text.' />);
    const content = getContent();

    const button = screen.getByText('Show full description').closest('button')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('desc');
    expect(content.style.maxHeight).toBe('10.5em');

    fireEvent.click(button);
    expect(content.style.maxHeight).toBe('');
    expect(screen.getByText('Show less')).toBeTruthy();

    fireEvent.click(screen.getByText('Show less'));
    expect(content.style.maxHeight).toBe('10.5em');
  });

  it('expands when a hidden link gets the keyboard focus', () => {
    mockHeights(600, 147);
    render(
      <TechniqueDescription
        id='desc'
        markdown='Long text with [a link](https://example.com).'
      />,
    );

    fireEvent.focus(screen.getByText('a link'));

    expect(getContent().style.maxHeight).toBe('');
  });
});
