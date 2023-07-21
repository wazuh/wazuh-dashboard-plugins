import packageValue from '../package.json';

const isNaN = (currentValue: string) => Number.isNaN(Number(currentValue));

describe('package.json version', () => {
  it('should have a version', () => {
    expect(packageValue.version).toBeDefined();
  });
  it("Wazuh's revision should be to follow the major.minor.patch.pattern.", () => {
    const versionSplit = packageValue.version.split('.');

    const versionIsNaN = versionSplit.every(isNaN);

    expect(versionSplit.length).toBe(3);
    expect(versionIsNaN).toBeFalsy();
  });
});

describe('package.json revison', () => {
  it('should have a revison', () => {
    expect(packageValue.revision).toBeDefined();
  });
  it('the revision should be a 2 digit number.', () => {
    const revision = packageValue.revision;

    const revisionIsNaN = isNaN(revision);

    expect(revision.length).toBe(2);
    expect(revisionIsNaN).toBeFalsy();
  });
});
