import { Encryption } from './encryption';

const noop = () => undefined;
const mockLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

describe('Encryption service', () => {
  it('ensure the Encryption throws an error when the key is not defined', () => {
    expect(() => new Encryption(mockLogger, {})).toThrow('key must be defined');
  });

  it('ensure the Encryption is created', () => {
    expect(
      () => new Encryption(mockLogger, { key: 'customPassword' }),
    ).not.toThrow('');
  });
});

describe('Encryption service usage', () => {
  it.each`
    encryptionKey   | text                                                             | encryptedTextAsHex
    ${'key123'}     | ${'custom text'}                                                 | ${'6b657931323300000000000069fb9170a1c96951031e53b321126b7bde3718119ac3eebcc8a1f2'}
    ${'custom key'} | ${'custom text'}                                                 | ${'637573746f6d206b65790000c89f1347f06f5b321bbd75450d6148d45492f0298f99232adbc22c'}
    ${'custom key'} | ${"[{id: 'default',username:'wazuh-wui',password:'wazuh-wui'}]"} | ${'637573746f6d206b65790000f0910957a5225c221ba3603bf588054a4b535e33cd9d7bb2cd3da87b2a070d9569b929c40998a5e967da1d7138cbff28272c22c95592ce4bf7303fd5d839aa13da076994ae4facab185b4c'}
  `('encrypt and decrypt', ({ text, encryptionKey, encryptedTextAsHex }) => {
    const encryption = new Encryption(mockLogger, {
      key: encryptionKey,
    });
    const cypherText = encryption.encrypt(text);
    expect(cypherText).toBe(encryptedTextAsHex);
    const decypherText = encryption.decrypt(cypherText);
    expect(decypherText).toBe(text);
  });
});
