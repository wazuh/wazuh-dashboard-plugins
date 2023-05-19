import {
    URLPackageFinder,
    NotOptionFoundException,
} from './url-package-finder';
import { defaultPackageDefinitions } from '../definitions';
const packageFinder = new URLPackageFinder(defaultPackageDefinitions, '4.4.2');

describe('URL Package Finder', () => {
    describe('findPackageUrl', () => {
        it('should return the correct URL for a valid package name and version', () => {
            const expectedUrl =
                'https://packages.wazuh.com/4.x/yum/wazuh-agent-4.4.2-1.x86_64.rpm';
            const url = packageFinder.getURLPackage('linux', 'amd64', 'rpm');
            expect(url).toEqual(expectedUrl);
        });

        it('should throw a NotOptionFoundException for an invalid os name', () => {
            expect(() => {
                packageFinder.getURLPackage('wrong-os', 'amd64', 'rpm');
            }).toThrowError(NotOptionFoundException);
        });

        it('should throw a NotOptionFoundException for an invalid architecture', () => {
            expect(() => {
                packageFinder.getURLPackage('linux', 'wrong-arch', 'rpm');
            }).toThrowError(NotOptionFoundException);
        });

        it('should throw a NotOptionFoundException for a package that is not available for the current platform', () => {
            expect(() => {
                packageFinder.getURLPackage('linux', 'amd64', 'wrong-extension');
            }).toThrowError(NotOptionFoundException);
        });
    });
});
