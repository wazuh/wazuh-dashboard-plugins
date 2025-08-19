import React from 'react';
import { render } from 'enzyme';
import { ColumnWithStatusIcon } from './column-with-status-icon';

describe('ColumnWithStatusIcon component', () => {
  test('Renders status indicator with the its color and the label', () => {
    const wrapper = render(
      <ColumnWithStatusIcon color='success' text='Active' />,
    );

    expect(wrapper).toMatchSnapshot();
    expect(wrapper.find('span').attr('color')).toContain('success');
    expect(wrapper[1].children[0].data).toEqual('Active');
  });
});
