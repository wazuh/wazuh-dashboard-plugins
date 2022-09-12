import React from 'react';
import {
	EuiSelect,
} from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormSelect = ({ field, value, onChange }: IInputFormType) => {
	return (
		<EuiSelect
			options={field.options.choices}
			value={value}
			onChange={onChange}
		/>
	)
};