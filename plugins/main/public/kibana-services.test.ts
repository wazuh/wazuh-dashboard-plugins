import { isWazuhPreRelease, setWazuhBuildInfo } from './kibana-services';

const setStage = (stage: string) =>
  setWazuhBuildInfo({
    version: '5.0.0',
    revision: '01',
    stage,
    isProduction: false,
  });

describe('isWazuhPreRelease()', () => {
  afterEach(() => {
    // Reset to default empty stage after each test
    setWazuhBuildInfo({
      version: '',
      revision: '01',
      stage: '',
      isProduction: false,
    });
  });

  describe('pre-release stages → true', () => {
    it.each([
      ['alpha'],
      ['alpha1'],
      ['ALPHA'],
      ['Alpha2'],
      ['beta'],
      ['beta2'],
      ['BETA'],
      ['Beta3'],
    ])('stage "%s" should return true', stage => {
      setStage(stage);
      expect(isWazuhPreRelease()).toBe(true);
    });
  });

  describe('production / unknown stages → false', () => {
    it.each([['rc'], ['rc1'], ['RC'], [''], ['stable'], ['unknown']])(
      'stage "%s" should return false',
      stage => {
        setStage(stage);
        expect(isWazuhPreRelease()).toBe(false);
      },
    );
  });

  describe('isProduction flag takes precedence → false', () => {
    it.each([['alpha'], ['beta2'], ['rc'], ['']])(
      'stage "%s" with isProduction=true should return false',
      stage => {
        setWazuhBuildInfo({
          version: '5.0.0',
          revision: '01',
          stage,
          isProduction: true,
        });
        expect(isWazuhPreRelease()).toBe(false);
      },
    );
  });
});
