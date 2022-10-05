import {
	formatLabelValuePair,
	formatSettingValueToFile
} from "./settings";

describe('[settings] Methods', () => {

	describe('formatLabelValuePair: Format the label-value pairs used to display the allowed values', () => {
		it.each`
		label            | value         | expected
		${'TestLabel'}   | ${true}       | ${'true (TestLabel)'}
		${'true'}        | ${true}       | ${'true'}
		`(`label: $label | value: $value | expected: $expected`, ({ label, expected, value }) => {
			expect(formatLabelValuePair(label, value)).toBe(expected);
		});
	});

	describe('formatSettingValueToFile: Format setting values to save in the configuration file', () => {
		it.each`
		input                 | expected
		${'test'}             | ${'\"test\"'}
		${'test space'}       | ${'\"test space\"'}
		${'test\nnew line'}   | ${'\"test\\nnew line\"'}
		${''}                 | ${'\"\"'}
		${1}                  | ${1}
		${true}               | ${true}
		${false}              | ${false}
		${['test1']}          | ${'[\"test1\"]'}
		${['test1', 'test2']} | ${'[\"test1\",\"test2\"]'}
		`(`input: $input | expected: $expected`, ({ input, expected }) => {
			expect(formatSettingValueToFile(input)).toBe(expected);
		});
	});
});
