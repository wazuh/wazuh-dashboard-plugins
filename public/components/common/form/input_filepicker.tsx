import React from 'react';
import {
	EuiFilePicker,
} from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormFilePicker = ({field, onChange} : IInputFormType) => (
  <EuiFilePicker
    id={field.key}
    initialPromptText="Select or drag the file"
    onChange={(fileList) => onChange(fileList?.[0])} //TODO: it requires fix when remove the file of the file picker
    display='large'
    fullWidth
    aria-label='Upload a file'
    accept={field.options.file.extensions.join(',')}
  />
);
