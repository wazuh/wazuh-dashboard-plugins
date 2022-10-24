import React from 'react';
import { EuiSwitch } from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormSwitch = ({ options, value, onChange }: IInputFormType) => {
	const checked = Object.entries(options.switch.values)
		.find(([, { value: statusValue }]) => value === statusValue)[0];

	return (
		<EuiSwitch
			label={options.switch.values[value ? 'enabled': 'disabled'].label}
			checked={checked === 'enabled'}
			onChange={onChange}
		/>
	);
};
