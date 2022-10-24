import React from 'react';
import { render } from '@testing-library/react';
import { InputForm } from './index';

jest.mock('../../../../../../node_modules/@elastic/eui/lib/services/accessibility', () => ({
	htmlIdGenerator: () => () => 'generated-id',
}));

describe('[component] InputForm', () => {
	const optionsEditor = {editor: {language: 'json'}};
	const optionsSelect = {select: [{text: 'Label1', value: 'value1'}, {text: 'Label2', value: 'value2'}]};
	const optionsSwitch = {switch: {values: {enabled: {label: 'Enabled', value: true}, disabled: {label: 'Disabled', value: false}}}};
	it.each`
		inputType   | value       | options
		${'editor'} | ${'{}'}     | ${optionsEditor}
		${'number'} | ${4}        | ${undefined}
		${'select'} | ${'value1'} | ${optionsSelect}
		${'switch'} | ${true}     | ${optionsSwitch}
		${'text'}   | ${'test'}   | ${undefined}
	`('Renders correctly to match the snapshot: Input: $inputType', ({ inputType, value, options }) => {
		const wrapper = render(
			<InputForm
				type={inputType}
				value={value}
				onChange={() => {}}
				options={options}
			/>
		);
		expect(wrapper.container).toMatchSnapshot();
	});
});

