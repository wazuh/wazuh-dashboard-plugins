import { ILogger } from '../../common/services/configuration';
import { Buffer } from 'buffer';
import crypto from 'crypto';

// Encrypt service based on https://stackoverflow.com/questions/6953286/how-to-encrypt-data-that-needs-to-be-decrypted-in-node-js
// algorithm: aes-256-gcm
export class Encryption {
  private algorithm: string;
  private iv: Uint8Array;
  private key: string;
  private salt: Uint8Array;
  private AUTH_TAG_BYTE_LEN: number = 16;
  private SALT_BYTE_LEN: number = 12;
  constructor(logger: ILogger, options: { key: string }) {
    if (!options.key) {
      throw new Error('key must be defined');
    }
    this.algorithm = 'aes-256-gcm';
    // This value is generated from the key
    this.iv = this.getIV(options.key);
    // This value is generated from the key
    this.salt = this.getSalt(options.key);
    this.key = this.getKeyFromKey(options.key);
  }

  /**
   * Encrypt a plain text and returns a string encoded as HEX
   * @param plainText
   * @returns
   */
  encrypt(plainText: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv, {
      authTagLength: this.AUTH_TAG_BYTE_LEN,
    });
    const buffer = Buffer.concat([
      this.iv,
      Buffer.concat([cipher.update(plainText), cipher.final()]), // encrypted message
      cipher.getAuthTag(),
    ]);
    return buffer.toString('hex');
  }

  /**
   * Decrypt a HEX string and returns the plain text
   * @param ciphertextAsHex
   * @returns
   */
  decrypt(ciphertextAsHex: string): string {
    const ciphertext = Buffer.from(ciphertextAsHex, 'hex');
    const authTag = ciphertext.slice(-this.AUTH_TAG_BYTE_LEN);
    const iv = ciphertext.slice(0, this.SALT_BYTE_LEN);
    const encryptedMessage = ciphertext.slice(
      this.SALT_BYTE_LEN,
      -this.AUTH_TAG_BYTE_LEN,
    );
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv, {
      authTagLength: this.AUTH_TAG_BYTE_LEN,
    });
    decipher.setAuthTag(authTag);
    const buffer = Buffer.concat([
      decipher.update(encryptedMessage),
      decipher.final(),
    ]);
    return buffer.toString('utf8');
  }

  private getKeyFromKey(key: string) {
    return crypto.scryptSync(key, this.salt, 32);
  }

  private getSalt(key: string): Uint8Array {
    return this.str2ArrayBuffer(key).slice(0, this.AUTH_TAG_BYTE_LEN);
  }

  private getIV(key: string): Uint8Array {
    return this.str2ArrayBuffer(key).slice(0, this.SALT_BYTE_LEN);
  }

  private str2ArrayBuffer(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return bufView;
  }
}
