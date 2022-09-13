import React from 'react';
import {
	EuiFieldNumber,
} from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormNumber = ({ field, value, onChange }: IInputFormType) => {
	return (
		<EuiFieldNumber
			fullWidth
			value={value}
			onChange={onChange}
			{...(field?.options?.number || {})}
		/>
	);
};
