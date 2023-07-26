import { getPasswordForCommand } from './wazuh-password-service';

describe('Wazuh Password Service', () => {
  it('should return the password wrapped with singlequote and scaped the inner special characters', () => {
    const password = `password'with'singlequote`;
    const result = getPasswordForCommand(password, 'singlequote');
    expect(result).toBe('password\'with\'singlequote');
  });

  it('should return the password wrapped with doublequote and scaped the inner special characters', () => {
    const password = `password"with"doublequote`;
    const result = getPasswordForCommand(password, 'doublequote');
    expect(result).toBe("password\"with\"doublequote");
  });
});
