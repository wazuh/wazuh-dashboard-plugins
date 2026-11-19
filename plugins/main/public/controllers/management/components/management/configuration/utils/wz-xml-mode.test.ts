import ace from 'brace';
import WazuhXmlMode from './wz-xml-mode';

describe('WazuhXmlMode', () => {
  it('uses the wazuh-xml mode id', () => {
    expect(new WazuhXmlMode().$id).toBe('ace/mode/wazuh-xml');
  });

  it('defines the snippets module of the mode', () => {
    const snippets = ace.acequire('ace/snippets/wazuh-xml');

    expect(snippets).toBeDefined();
    expect(snippets.scope).toBe('wazuh-xml');
    expect(snippets.snippetText).toBeUndefined();
  });

  it('loads the snippets of the mode without requesting a script', () => {
    const net = ace.acequire('ace/lib/net');
    const loadScript = jest
      .spyOn(net, 'loadScript')
      .mockImplementation(() => {});
    const onLoad = jest.fn();
    const snippetsModuleId = new WazuhXmlMode().$id.replace('mode', 'snippets');

    ace.acequire('ace/config').loadModule(snippetsModuleId, onLoad);

    expect(loadScript).not.toHaveBeenCalled();
    expect(onLoad).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'wazuh-xml' }),
    );
    loadScript.mockRestore();
  });
});
