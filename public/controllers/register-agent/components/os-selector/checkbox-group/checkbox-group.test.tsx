import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { CheckboxGroupComponent } from '../../step-one/checkbox-group/checkbox-group';

describe('CheckboxGroupComponent', () => {
  const data = ['Option 1', 'Option 2', 'Option 3'];
  const cardIndex = 0;
  const selectedOption = 'option-0-0';
  const onOptionChange = jest.fn();

  test('renders checkbox items with correct labels', () => {
    render(
      <CheckboxGroupComponent
        data={data}
        cardIndex={cardIndex}
        selectedOption={selectedOption}
        onOptionChange={onOptionChange}
      />,
    );

    const checkboxItems = screen.getAllByRole('radio');
    expect(checkboxItems).toHaveLength(data.length);

    expect(checkboxItems[0]).toHaveAttribute('id', 'option-0-0');
    expect(checkboxItems[1]).toHaveAttribute('id', 'option-0-1');
    expect(checkboxItems[2]).toHaveAttribute('id', 'option-0-2');

    expect(checkboxItems[0]).toBeChecked();
    expect(checkboxItems[1]).not.toBeChecked();
    expect(checkboxItems[2]).not.toBeChecked();

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  test('calls onOptionChange when a checkbox is selected', () => {
    render(
      <CheckboxGroupComponent
        data={data}
        cardIndex={cardIndex}
        selectedOption={selectedOption}
        onOptionChange={onOptionChange}
      />,
    );

    const checkboxItems = screen.getAllByRole('radio');

    fireEvent.click(checkboxItems[1]);

    expect(onOptionChange).toHaveBeenCalledTimes(1);
    expect(onOptionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { value: `option-${cardIndex}-1` },
      }),
    );
  });
});
