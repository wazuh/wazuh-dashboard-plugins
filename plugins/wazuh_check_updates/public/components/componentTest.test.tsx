import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColorCircle from './componentTest';

describe('FRONT CUSTOM PLUGIN - State tests', () => {
  describe('ColorCircle', () => {
    test('renders color circle state component with correct background color', () => {
      const color = '#6092C0';
      const { container } = render(<ColorCircle color={color} />);

      const colorCircle = container.firstChild;
      expect(colorCircle).toHaveStyle(`background-color: ${color}`);
    });
  });

  // describe('FormState', () => {
  //     test('submits form with correct data', async () => {
  //         const onAddState = jest.fn();
  //         const stateAttributtes = {
  //             name: 'TO DO',
  //             order: 1,
  //             color: '',
  //             isFinalState: true
  //         }

  //         await act(async () => {
  //             const { container } = render(<FormState onAddState={onAddState} />);

  //             fireEvent.change(screen.getByTestId('nameStateField'), { target: { value: stateAttributtes.name } });
  //             fireEvent.change(screen.getByTestId('orderStateField'), { target: { value: stateAttributtes.order } });
  //             fireEvent.change(screen.getByTestId('colorStateFieldPickerButton'), { target: { color: stateAttributtes.color } });
  //             fireEvent.click(screen.getByTestId('finalStateStateField'));
  //             fireEvent.click(screen.getByTestId('createStateButton'));

  //         })
  //         expect(onAddState).toHaveBeenCalledWith(stateAttributtes);
  //     });
  // });

  // describe('StateList', () => {
  //     test('renders table with correct data', async () => {
  //         const states = [
  //             {
  //                 id: 1,
  //                 name: 'TO DO',
  //                 order: 1,
  //                 color: '',
  //                 isFinalState: false,
  //                 createdAt: '2023-05-01',
  //             },
  //             {
  //                 id: 2,
  //                 name: 'COMPLETED',
  //                 order: 2,
  //                 color: '',
  //                 isFinalState: true,
  //                 createdAt: '2023-05-01',
  //             },
  //         ];
  //         const onUpdateState = jest.fn();
  //         const onDeleteState = jest.fn();

  //         await act(async () => {
  //             const { container } = render(
  //                 <StateList states={states} onUpdateState={onUpdateState} onDeleteState={onDeleteState} />
  //             );

  //             expect(screen.getByText(states[0].name)).toBeInTheDocument();
  //             expect(screen.getByText(states[1].name)).toBeInTheDocument();
  //             expect(container.getElementsByClassName('euiTableRow')).toHaveLength(states.length);

  //             await fireEvent.click(screen.getByTestId(`button-enable-update-state-${states[0].id}`));
  //             expect(screen.getByTestId('nameStateField')).toBeInTheDocument();
  //             fireEvent.change(screen.getByTestId('nameStateField'), { target: { value: 'Updated State' } });
  //             fireEvent.change(screen.getByTestId('orderStateField'), { target: { value: 3 } });
  //             await fireEvent.click(screen.getByTestId(`button-apply-update-state-${states[0].id}`));

  //             expect(onUpdateState).toHaveBeenCalledWith(1, {
  //                 name: 'Updated State',
  //                 order: '3',
  //                 color: '',
  //                 isFinalState: false,
  //             });

  //             fireEvent.click(screen.getByTestId(`button-delete-state-${states[0].id}`));

  //             expect(onDeleteState).toHaveBeenCalledWith(states[0].id);
  //         })
  //     });
  // });
});
