import { getPasswordWithScapedSpecialCharacters } from './wazuh-password-service';

describe('Wazuh Password Service', () => {
  it('should return the password scaped the inner special characters', () => {
    const password = "password'with'special'characters";
    const passwordScaped = getPasswordWithScapedSpecialCharacters(password);
    expect(passwordScaped).toEqual("password\'with\'special\'characters");
  });

});
