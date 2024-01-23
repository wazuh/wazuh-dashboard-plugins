import { Encryptation } from './encryptation';

const noop = () => undefined;
const mockLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

describe('Encryptation service', () => {
  it('ensure the Encryptation throws an error when the password is not defined', () => {
    expect(() => new Encryptation(mockLogger, {})).toThrow(
      'password must be defined',
    );
  });

  it('ensure the Encryptation is created', () => {
    expect(
      () => new Encryptation(mockLogger, { password: 'customPassword' }),
    ).not.toThrow('');
  });
});

describe('Encryptation service usage', () => {
  it.each`
    encryptationPassword | text                                                             | encryptedTextAsHex
    ${'pass123'}         | ${'custom text'}                                                 | ${'706173733132330000000000ef4496193cb510f07a8395ad895cf7292cccabbe3e91bdf8795893'}
    ${'custom password'} | ${'custom text'}                                                 | ${'637573746f6d207061737377a8c71e9dc549af7cabba89959a6de263f908f09a9265ec3043bb63'}
    ${'custom password'} | ${"[{id: 'default',username:'wazuh-wui',password:'wazuh-wui'}]"} | ${'637573746f6d20706173737790c9048d9004a86caba49c522906edd835c614c64616bc26bf38c105509d239bab60ca95e3afc738db7b632f80d94b8166559fef5d94ad337b5d7aa067324001b1b6621486a5e620c2adbd'}
  `(
    'encrypt and decrypt',
    ({ text, encryptationPassword, encryptedTextAsHex }) => {
      const encryptation = new Encryptation(mockLogger, {
        password: encryptationPassword,
      });
      const cypherText = encryptation.encrypt(text);
      expect(cypherText).toBe(encryptedTextAsHex);
      console.log({ encryptedTextAsHex });
      const decypherText = encryptation.decrypt(cypherText);
      expect(decypherText).toBe(text);
    },
  );
});
