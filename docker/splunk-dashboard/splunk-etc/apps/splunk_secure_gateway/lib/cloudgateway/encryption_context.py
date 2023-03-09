"""
(C) 2019 Splunk Inc. All rights reserved.
"""

import sys
from cloudgateway import py23
import base64
from cloudgateway.private.util.constants import SIGN_PUBLIC_KEY, SIGN_PRIVATE_KEY, ENCRYPT_PUBLIC_KEY, \
        ENCRYPT_PRIVATE_KEY
from cloudgateway.private.util.sdk_mode import SdkMode
from base64 import b64encode, b64decode
from cloudgateway.private.encryption.encryption_handler import encrypt_session_token
from cloudgateway.private.sodium_client import SodiumClient
from cloudgateway.device import EncryptionKeys


def generate_keys():
    """
    Generates the public and private keys necessary for encryption and signing.
    """
    sodium_client = SodiumClient()

    [sign_pk, sign_sk] = sodium_client.sign_generate_keypair()
    [box_pk, box_sk] = sodium_client.box_generate_keypair()

    return EncryptionKeys(sign_pk, sign_sk, box_pk, box_sk)


class EncryptionContext(object):
    """Base class for encryption which provides utilities such as  
    getters for the public and private keys for encryption and signing. Does not offer
    any out of the box mechanism for persisting keys. Sub classes such as
    SplunkEncryptionContext can provide specific implementations for persistence
    depending on the persistence mechanism. 
    """

    def __init__(self, encryption_keys, sodium_client=None):
        """
        Args:
            encryption_keys ([EncryptionKeys]): User must generate encryption keys using the
            generate_keys method and provide keys in the context. It's up the user to 
            persist the keys themselves between sessions. 
            sodium_client ([type], optional): [description]. Defaults to None.
        """

        self.mode = SdkMode.STANDALONE
        if sodium_client:
            self.sodium_client = sodium_client
        else:
            self.sodium_client = SodiumClient()

        self._key_cache = encryption_keys.__dict__

    def get_encryption_keys(self):
        """Getter for encryption keys

        Returns:
            [EncryptionKeys]: Wrapper object. Also the same object that the constructor expects. 
            The user should persist this object and load it into the constructor on future sessions. 
        """
        return EncryptionKeys(self._key_cache[SIGN_PUBLIC_KEY],
                              self._key_cache[SIGN_PRIVATE_KEY],
                              self._key_cache[ENCRYPT_PUBLIC_KEY],
                              self._key_cache[ENCRYPT_PRIVATE_KEY])

    def __noop(input):
        return input

    def generichash_hex(self, input):
        raw = self.generichash_raw(input)
        if sys.version_info < (3, 0):
            return raw.encode('hex')
        else:
            return raw.hex()

    def generichash_raw(self, input):
        return self.sodium_client.hash_generic(input)

    def sign_public_key(self, transform=__noop):
        """
        :param transform: a function to transform the public key into another representation, default noop
        :return: Signing public key from KV Store. Requires key to have been generated.  This is the splApp's
        :raises splunk.RESTException: The key cache hasn't been initialized
        "identity" key.
        """

        key = self._key_cache[SIGN_PUBLIC_KEY]
        return transform(key)

    def sign_private_key(self):
        """
        Fetch signing private key from KV Store. Requires key to have been generated
        """

        key = self._key_cache[SIGN_PRIVATE_KEY]
        return key

    def encrypt_public_key(self):
        """
        Fetch encryption public key from KV Store. Requires key to have been generated
        """

        key = self._key_cache[ENCRYPT_PUBLIC_KEY]
        return key

    def encrypt_private_key(self):
        """
        Fetch encryption public key from KV Store. Requires key to have been generated
        """

        key = self._key_cache[ENCRYPT_PRIVATE_KEY]
        return key

    def secure_session_token(self, session_token):
        """
        :param session_token: string representing session token
        :return: base64 encoded encrypted session token
        """
        public_key = self.encrypt_public_key()
        private_key = self.encrypt_private_key()

        ciphertext = encrypt_session_token(self.sodium_client, session_token, public_key, private_key)
        return base64.b64encode(ciphertext)

