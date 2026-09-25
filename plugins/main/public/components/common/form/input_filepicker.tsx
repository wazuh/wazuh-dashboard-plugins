import React from 'react';
import { EuiFilePicker } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { IInputFormType } from './types';

export const InputFormFilePicker = ({
  onChange,
  options,
  setInputRef,
  key,
  ...rest
}: IInputFormType) => (
  <EuiFilePicker
    id={key}
    initialPromptText={i18n.translate(
      'wazuh.common.formFilePicker.initialPrompt',
      {
        defaultMessage: 'Select or drag the file',
      },
    )}
    onChange={fileList =>
      onChange(
        // File was added.
        fileList?.[0] ||
          // File was removed. We set the initial value, so the useForm hook will not detect any change. */
          rest.initialValue,
      )
    }
    display='default'
    fullWidth
    aria-label={i18n.translate('wazuh.common.formFilePicker.ariaLabel', {
      defaultMessage: 'Upload a file',
    })}
    accept={options.file.extensions.join(',')}
    ref={setInputRef}
  />
);
