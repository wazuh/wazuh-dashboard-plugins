import React from 'react';
import {
	EuiSwitch,
} from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormSwitch = ({ field, value, onChange }: IInputFormType) => {
	return (
		<EuiSwitch
			label={field.options.switch.values[value ? 'enabled': 'disabled'].label}
			checked={value}
			onChange={onChange}
		/>
	);
};
