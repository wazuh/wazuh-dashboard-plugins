import {formatBytes } from "./file-size";

describe('formatBytes', () => {
	it.each`
		bytes | decimals | expected
		${1024} | ${2} | ${'1 KB'}
		${1023} | ${2} | ${'1023 Bytes'}
        ${1500} | ${2} | ${'1.46 KB'}
        ${1500} | ${1} | ${'1.5 KB'}
        ${1500} | ${3} | ${'1.465 KB'}
        ${1048576} | ${2} | ${'1 MB'}
        ${1048577} | ${2} | ${'1 MB'}
        ${1475487} | ${2} | ${'1.41 MB'}
        ${1475487} | ${1} | ${'1.4 MB'}
        ${1475487} | ${3} | ${'1.407 MB'}
        ${1073741824} | ${2} | ${'1 GB'}
		`(`bytes: $bytes | decimals: $decimals | expected: $expected`, ({ bytes, decimals, expected }) => {
			expect(formatBytes(bytes, decimals)).toBe(expected);
		});
});
