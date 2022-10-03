import React from 'react';
import {
	EuiFieldNumber,
} from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormNumber = ({ options, value, onChange }: IInputFormType) => {
	return (
		<EuiFieldNumber
			fullWidth
			value={value}
			onChange={onChange}
			{...(options?.number || {})}
		/>
	);
};
