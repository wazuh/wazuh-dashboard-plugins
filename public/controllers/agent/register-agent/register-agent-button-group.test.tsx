import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import RegisterAgentButtonGroup from './register-agent-button-group';

describe('RegisterAgentButtonGroup', () => {
  it('should render correctly', () => {
    const buttonsOpts = [{ id: 'test', label: 'test' }];
    const wrapper = render(
      <RegisterAgentButtonGroup
        legend='Test legend'
        idSelected=''
        options={buttonsOpts}
        onChange={() => {}}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('should render the label text', () => {
    const buttonsOpts = [{ id: 'test', label: 'test' }];
    const { getByText } = render(
      <RegisterAgentButtonGroup
        legend='Test legend'
        idSelected=''
        options={buttonsOpts}
        onChange={() => {}}
      />,
    );
    expect(getByText('Test legend')).toBeInTheDocument();
  });

  it('should auto select button when the group have only one button in options list', () => {
    const mockedOnChange = jest.fn();
    const buttonsOpts = [{ id: 'test', label: 'test' }];
    render(
      <RegisterAgentButtonGroup
        legend='Test legend'
        idSelected=''
        options={buttonsOpts}
        onChange={mockedOnChange}
      />,
    );
    expect(mockedOnChange).toBeCalledWith(buttonsOpts[0].id);
  });

  it('should auto select button when the group have an option with the default property in true', () => {
    const mockedOnChange = jest.fn();
    const buttonsOpts = [
      { id: 'test', label: 'test' },
      { id: 'auto-selected', label: 'test2', default: true },
    ];
    render(
      <RegisterAgentButtonGroup
        legend='Test legend'
        idSelected=''
        options={buttonsOpts}
        onChange={mockedOnChange}
      />,
    );
    expect(mockedOnChange).toBeCalledWith(buttonsOpts[1].id);
  });

  it('should auto select the first button when the group have more than one option with the default property in true', () => {
    const mockedOnChange = jest.fn();
    const buttonsOpts = [
      { id: 'test', label: 'test' },
      { id: 'auto-selected', label: 'test2', default: true },
      { id: 'auto-selected2', label: 'test3', default: true },
    ];
    render(
      <RegisterAgentButtonGroup
        legend='Test legend'
        idSelected=''
        options={buttonsOpts}
        onChange={mockedOnChange}
      />,
    );
    expect(mockedOnChange).toBeCalledWith(buttonsOpts[1].id);
  });

  it('should render the correct number of buttons defined in the options received', () => {
    const mockedOnChange = jest.fn();
    const buttonsOpts = [
      { id: 'test', label: 'test' },
      { id: 'test2', label: 'test2' },
      { id: 'test3', label: 'test3' },
    ];
    const { getByText, getByRole } = render(
      <RegisterAgentButtonGroup
        legend='Test legend'
        idSelected=''
        options={buttonsOpts}
        onChange={mockedOnChange}
      />,
    );

    buttonsOpts.forEach((button) => {
      expect(getByText(button.label)).toBeInTheDocument();
    })
  });

});
