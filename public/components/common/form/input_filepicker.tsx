import React from 'react';
import {
	EuiFilePicker,
} from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormFilePicker = ({onChange, options, setInputRef, key} : IInputFormType) => (
  <EuiFilePicker
    id={key}
    initialPromptText="Select or drag the file"
    onChange={(fileList) => {console.log({fileList});onChange(fileList?.[0])}} //TODO: it requires fix when remove the file of the file picker
    display='large'
    fullWidth
    aria-label='Upload a file'
    accept={options.file.extensions.join(',')}
    ref={setInputRef}
  />
);
