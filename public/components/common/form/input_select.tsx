import React from 'react';
import { EuiSelect } from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormSelect = ({ options, value, onChange }: IInputFormType) => {
	return (
		<EuiSelect
			options={options.select}
			value={value}
			onChange={onChange}
		/>
	)
};
