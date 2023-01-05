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

describe('package.json stage', () => {
  it('should have a stage', () => {
    expect(packageValue.stage).toBeDefined();
  });
  it('the state should be one of the defined.', () => {
    const stateDefined = [
      'pre-alpha',
      'alpha',
      'beta',
      'release-candidate',
      'stable',
    ];

    const stage = packageValue.stage;

    expect(stateDefined).toContain(stage);
  });
});
