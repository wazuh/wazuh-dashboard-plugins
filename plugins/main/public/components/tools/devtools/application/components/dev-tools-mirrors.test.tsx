import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DevToolsMirrors from './dev-tools-mirrors';
import { DEV_TOOLS_BUTTONS, EDITOR_MIRRORS } from '../../constants';

describe('DevToolsMirrors', () => {
  it('renders left/right columns and textareas', () => {
    const { container } = render(<DevToolsMirrors onSendRequestButton={() => {}} />);

    expect(container.querySelector(`#${EDITOR_MIRRORS.LEFT_COLUMN_ID}`)).toBeTruthy();
    expect(container.querySelector(`#${EDITOR_MIRRORS.RIGHT_COLUMN_ID}`)).toBeTruthy();

    expect(container.querySelector(`#${EDITOR_MIRRORS.INPUT_ID}`)).toBeTruthy();
    expect(container.querySelector(`#${EDITOR_MIRRORS.OUTPUT_ID}`)).toBeTruthy();
  });

  it('invokes onSendRequestButton when clicking play icon', () => {
    const onSend = jest.fn();
    const { container } = render(<DevToolsMirrors onSendRequestButton={onSend} />);
    const play = container.querySelector(`#${DEV_TOOLS_BUTTONS.PLAY_BUTTON_ID}`);
    expect(play).toBeTruthy();
    fireEvent.click(play!);
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});

