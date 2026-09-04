jest.mock('brace', () => {
  const acequire = name => {
    if (name === 'ace/lib/oop') {
      return {
        inherits: (Ctor, Base) => {
          Ctor.prototype = Object.create(Base.prototype);
          Ctor.prototype.constructor = Ctor;
        },
      };
    }
    if (name === 'ace/mode/xml') {
      function XmlMode() {}
      XmlMode.prototype.createWorker = function () {
        return {
          call: jest.fn(),
        };
      };
      return { Mode: XmlMode };
    }
    return {};
  };
  return { acequire };
});
jest.mock('brace/mode/xml', () => ({}), { virtual: true });

import WazuhXmlMode from './wz-xml-mode';

const fakeSession = value => ({
  getValue: () => value,
});

describe('WazuhXmlMode', () => {
  it('normalizes escaped query brackets on worker creation', () => {
    const mode = new WazuhXmlMode();
    const session = fakeSession('<query>\\<QueryList\\></query>');
    const worker = mode.createWorker(session);

    expect(worker.call).toHaveBeenCalledWith('setValue', [
      '<query>\\<QueryList></query>',
    ]);
  });

  it('re-normalizes on $sendDeltaQueue', () => {
    const mode = new WazuhXmlMode();
    const session = fakeSession('<query>\\<QueryList\\></query>');
    const worker = mode.createWorker(session);
    worker.call.mockClear();

    worker.$sendDeltaQueue();

    expect(worker.deltaQueue).toBeNull();
    expect(worker.call).toHaveBeenCalledWith('setValue', [
      '<query>\\<QueryList></query>',
    ]);
  });
});
