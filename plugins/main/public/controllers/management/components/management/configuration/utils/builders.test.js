import { wodleBuilder } from './builders';

describe('wodleBuilder', () => {
  describe('manager configuration', () => {
    const currentConfig = {
      'wmodules-wmodules': {
        wmodules: [
          { syscollector: { disabled: 'no' } },
          { 'vulnerability-detection': { enabled: 'yes' } },
        ],
      },
    };

    it('resolves a wodle from the wmodules list', () => {
      expect(wodleBuilder(currentConfig, 'syscollector')).toEqual({
        syscollector: { disabled: 'no' },
      });
    });

    it('resolves several wodles at once', () => {
      expect(
        wodleBuilder(currentConfig, [
          'syscollector',
          'vulnerability-detection',
        ]),
      ).toEqual({
        syscollector: { disabled: 'no' },
        'vulnerability-detection': { enabled: 'yes' },
      });
    });

    it('leaves a wodle that is not defined undefined', () => {
      expect(wodleBuilder(currentConfig, 'sca')).toEqual({ sca: undefined });
    });

    it('leaves the wodle undefined when the section failed', () => {
      expect(
        wodleBuilder({ 'wmodules-wmodules': 'Error fetching' }, 'syscollector'),
      ).toEqual({ syscollector: undefined });
    });
  });

  describe('agent reported configuration', () => {
    const currentConfig = {
      syscollector: { disabled: 'no' },
      sca: { enabled: 'yes' },
    };

    it('resolves a wodle from its own module key', () => {
      expect(wodleBuilder(currentConfig, 'syscollector')).toEqual({
        syscollector: { disabled: 'no' },
      });
    });

    it('resolves several wodles at once', () => {
      expect(wodleBuilder(currentConfig, ['syscollector', 'sca'])).toEqual({
        syscollector: { disabled: 'no' },
        sca: { enabled: 'yes' },
      });
    });

    it('leaves a module the agent did not report undefined', () => {
      expect(wodleBuilder(currentConfig, 'vulnerability-detection')).toEqual({
        'vulnerability-detection': undefined,
      });
    });

    it('leaves the wodle undefined when the agent has never reported', () => {
      expect(wodleBuilder({}, 'syscollector')).toEqual({
        syscollector: undefined,
      });
    });
  });
});
