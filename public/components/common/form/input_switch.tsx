import React from 'react';
import {
	EuiSwitch,
} from '@elastic/eui';
import { IInputFormType } from './types';

export const InputFormSwitch = ({ options, value, onChange, ...rest }: IInputFormType) => {
	return (
		<EuiSwitch
			label={options.switch.values[value ? 'enabled': 'disabled'].label}
			checked={value}
			onChange={onChange}
		/>
	);
};
