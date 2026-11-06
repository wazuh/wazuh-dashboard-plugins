import React from 'react';
import { render } from '@testing-library/react';
import WzCodeEditor from './code-editor';

const mockCodeEditorProps = jest.fn();
jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiCodeEditor: (props: object) => {
    mockCodeEditorProps(props);
    return null;
  },
}));

describe('WzCodeEditor', () => {
  it('forwards the annotations and does not start the editor worker', () => {
    const annotations = [{ row: 5, column: 0, type: 'error', text: 'Bad XML' }];
    render(
      <WzCodeEditor
        mode='xml'
        value='<ossec_config>'
        onChange={jest.fn()}
        annotations={annotations}
      />,
    );

    const props = mockCodeEditorProps.mock.lastCall[0];
    expect(props.setOptions.useWorker).toBe(false);
    expect(props.annotations).toBe(annotations);
  });
});
