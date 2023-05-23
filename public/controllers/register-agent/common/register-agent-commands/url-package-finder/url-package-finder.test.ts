import {
    URLPackageFinder,
} from './url-package-finder';
import { defaultPackageDefinitions } from '../definitions';
import { NoOSOptionFoundException, NoOptionFoundException } from '../exceptions';
const packageFinder = new URLPackageFinder(defaultPackageDefinitions, '4.4.2');

describe('URL Package Finder', () => {
    describe('find package url', () => {
        it('should return the correct URL for a valid package name and version', () => {
            const expectedUrl =
                'https://packages.wazuh.com/4.x/yum/wazuh-agent-4.4.2-1.x86_64.rpm';
            const url = packageFinder.getURLPackage('linux', 'amd64', 'rpm', 'yum');
            expect(url).toEqual(expectedUrl);
        });

        it('should throw a NotOptionFoundException for an invalid os name', () => {
            expect(() => {
                packageFinder.getURLPackage('wrong-os', 'amd64', 'rpm', 'yum');
            }).toThrowError(NoOSOptionFoundException);
        });

        it('should throw a NotOptionFoundException for an invalid architecture', () => {
            expect(() => {
                packageFinder.getURLPackage('linux', 'wrong-arch', 'rpm', 'yum');
            }).toThrowError(NoOptionFoundException);
        });

        it('should throw a NotOptionFoundException for a package that is not available for the current platform', () => {
            expect(() => {
                packageFinder.getURLPackage('linux', 'amd64', 'wrong-extension', 'yum');
            }).toThrowError(NoOptionFoundException);
        });

        it('should throw NotOptionFoundException for a package manager that is not found in definitions', () => {
            expect(() => {
                packageFinder.getURLPackage('linux', 'amd64', 'rpm', 'wrong-pm');
            }).toThrowError(NoOptionFoundException);
        })
    });
});
