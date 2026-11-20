import React from 'react';
import { render } from 'enzyme';
import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ColumnWithStatusIcon } from './column-with-status-icon';

describe('ColumnWithStatusIcon component', () => {
  test('Renders status indicator with the its color and the label', () => {
    const wrapper = render(
      <ColumnWithStatusIcon color='success' text='Active' />,
    );

    expect(wrapper).toMatchSnapshot();
    expect(wrapper.find('[data-euiicon-type="dot"]').attr('color')).toEqual(
      'success',
    );
    expect(wrapper.find('.hide-agent-status').text()).toEqual('Active');
  });

  test('Shows the tooltip when hovering the text of the status', async () => {
    rtlRender(
      <ColumnWithStatusIcon
        color='success'
        text='active'
        tooltip={<p>Last keep alive</p>}
      />,
    );

    fireEvent.mouseOver(screen.getByText('active'));
    expect(await screen.findByText('Last keep alive')).toBeInTheDocument();
  });
});
