import { validateManagerXML } from './xml-manager';

describe('validateManagerXML', () => {
  it('rejects an unescaped ampersand', () => {
    const xml = '<wazuh_config><global>A & B</global></wazuh_config>';
    expect(validateManagerXML(xml)).toBeTruthy();
  });

  it('rejects two document roots', () => {
    const xml =
      '<wazuh_config><global/></wazuh_config><wazuh_config><global/></wazuh_config>';
    expect(validateManagerXML(xml)).toBeTruthy();
  });

  it('rejects legacy <! !> comments', () => {
    const xml =
      '<wazuh_config><! this is a legacy comment !><global/></wazuh_config>';
    expect(validateManagerXML(xml)).toBeTruthy();
  });

  it('accepts a valid single-root manager XML document', () => {
    const xml =
      '<wazuh_config><global><agents_disconnection_time>15m</agents_disconnection_time></global></wazuh_config>';
    expect(validateManagerXML(xml)).toBeFalsy();
  });

  it('does not repair the input the way the legacy validateXML does', () => {
    // No <file> wrapper is added: an unescaped '&' inside a fragment that
    // validateXML would tolerate (by wrapping/repairing) is reported here.
    const xml = '<global>A & B</global>';
    expect(validateManagerXML(xml)).toBeTruthy();
  });
});

describe('validateManagerXML error position', () => {
  it('reports the line and column the parser stopped at', () => {
    const xml =
      '<wazuh_config>\n  <global>\n    <a>x & y</a>\n  </global>\n</wazuh_config>';
    expect(validateManagerXML(xml)).toMatch(/line \d+, column \d+/);
  });

  it('names a position rather than a bare failure', () => {
    expect(validateManagerXML('<a>\n  <b>unclosed\n</a>')).not.toBe(
      'Error validating XML',
    );
  });
});
