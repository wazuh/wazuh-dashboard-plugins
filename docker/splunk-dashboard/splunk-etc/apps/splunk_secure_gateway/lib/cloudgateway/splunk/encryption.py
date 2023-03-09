import json
from base64 import b64encode

from cloudgateway.encryption_context import EncryptionContext
from cloudgateway.private.sodium_client import SodiumClient
from cloudgateway.private.util.constants import ENCRYPTION_KEYS, SIGN_PUBLIC_KEY, SIGN_PRIVATE_KEY, ENCRYPT_PUBLIC_KEY,\
    ENCRYPT_PRIVATE_KEY
from cloudgateway.private.util.sdk_mode import SdkMode

from cloudgateway.splunk.clients import splunk_client
from cloudgateway.device import EncryptionKeys
from splunk import RESTException


class SplunkEncryptionContext(EncryptionContext):
    """
    Context object for handling generating and fetching public and private keys. (Currently only public key is
    supported)
    """

    def __init__(self, session_key, app_name, sodium_client=None):
        """
        Pass a session token and create a KV Store Handler to be able to write and fetch public keys from KV Store.
        The session token itself is not exposed, only the handler.
        """

        self.mode = SdkMode.SPLUNK
        if sodium_client:
            self.sodium_client = sodium_client
        else:
            self.sodium_client = SodiumClient()

        self._key_cache = {}
        self.session_key = session_key
        self.app_name = app_name

        self.generate_keys()

    def set_encryption_keys(self, keys_dict):
        self._key_cache = keys_dict

    def _cache_keys(self):
        result = False
        raw_data = splunk_client.fetch_sensitive_data(self.session_key, ENCRYPTION_KEYS, self.app_name)
        try:
            self._key_cache = EncryptionKeys.from_json(json.loads(raw_data)).__dict__
        except Exception:
            self._key_cache = {}

        if SIGN_PUBLIC_KEY in self._key_cache:
            result = True

        return result

    def _create_key_bucket(self):
        try:
            splunk_client.create_sensitive_data(self.session_key, ENCRYPTION_KEYS, '{}', self.app_name)
        except RESTException as e:
            if e.statusCode != 409:
                raise e

    def generate_keys(self):
        """
        Stores the required signing and encryption keys to KV Store in the meta collection. If the
        public key already exists, then this is a no op.

        There is a synchronization issue where when you call generate keys, KV Store might not yet have been
        initialized. The way we handle this is if we get a 503 HTTP error back from KV Store, this means the store
        is not yet available, in which case we callback generate keys to run in 5 seconds.
        """

        self._create_key_bucket()

        keys_cached = self._cache_keys()

        if not keys_cached:
            [sign_pk, sign_sk] = [k for k in self.sodium_client.sign_generate_keypair()]
            [box_pk, box_sk] = [k for k in self.sodium_client.box_generate_keypair()]

            encryption_keys = EncryptionKeys(sign_pk, sign_sk, box_pk, box_sk)

            key_data = json.dumps(encryption_keys.to_json())
            splunk_client.update_sensitive_data(self.session_key, ENCRYPTION_KEYS, key_data, self.app_name)
            self._key_cache = encryption_keys.__dict__


