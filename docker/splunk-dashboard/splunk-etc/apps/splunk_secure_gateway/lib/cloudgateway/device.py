"""
(C) 2019 Splunk Inc. All rights reserved.
"""
import sys
from cloudgateway import py23
import base64
import collections

"""Wrapper Credentials Bundle object to store a session token and username which are returned by the
server side on registration
"""
CredentialsBundle = collections.namedtuple('CredentialsBundle',
                                           'session_token username deployment_name server_type token_type token_expires_at env_metadata')
CredentialsBundle.__new__.__defaults__ = (None,) * len(CredentialsBundle._fields)

EnvironmentMetadata = collections.namedtuple('EnvironmentMetadata', 'serialized_metadata id')


def make_device_id(encryption_context, sign_public_key):
    return encryption_context.generichash_raw(sign_public_key)


class DeviceInfo(object):
    """
    Helper class to encapsulate a client device's credentials that are returned by cloudgateway when we initiate
    the registration process
    """

    def __init__(self, encrypt_public_key, sign_public_key, device_id="", confirmation_code="", app_id="",
                 client_version="", app_name="", platform="", registration_method="", auth_method="",
                 device_management_method="", device_registered_timestamp="", tenant_id="", user_agent=""):
        self.encrypt_public_key = encrypt_public_key  # binary value
        self.sign_public_key = sign_public_key  # binary value
        self.device_id = device_id  # binary value
        self.confirmation_code = confirmation_code  # string
        self.app_id = app_id  # string
        self.client_version = client_version  # string
        self.app_name = app_name
        self.platform = platform
        self.registration_method = registration_method  # string
        self.auth_method = auth_method  # string
        self.device_management_method = device_management_method  # string
        self.device_registered_timestamp = device_registered_timestamp  # int
        self.tenant_id = tenant_id  # string
        self.user_agent = user_agent  # string

    def __repr__(self):
        return str(self.__dict__)

    def to_json(self):

        if sys.version_info < (3, 0):
            encrypt_public_key = base64.b64encode(self.encrypt_public_key)
            sign_public_key = base64.b64encode(self.sign_public_key)
            device_id = base64.b64encode(self.device_id)
        else:
            encrypt_public_key = base64.b64encode(self.encrypt_public_key).decode('ascii')
            sign_public_key = base64.b64encode(self.sign_public_key).decode('ascii')
            device_id = base64.b64encode(self.device_id).decode('ascii')

        return {
            'encrypt_public_key': encrypt_public_key,
            'sign_public_key': sign_public_key,
            'device_id': device_id,
            'conf_code': self.confirmation_code,
            'app_id': self.app_id,
            'client_version': self.client_version,
            'app_name': self.app_name,
            'registration_method': self.registration_method,
            'auth_method': self.auth_method,
            'device_management_method': self.device_management_method,
            'device_registered_timestamp': self.device_registered_timestamp,
            'tenant_id': self.tenant_id,
            'user_agent': self.user_agent
        }

    @staticmethod
    def from_json(jsn):
        return DeviceInfo(
            base64.b64decode(jsn['encrypt_public_key']),
            base64.b64decode(jsn['sign_public_key']),
            base64.b64decode(jsn['device_id']),
            jsn['conf_code'],
            jsn['app_id'],
            jsn['client_version'],
        )


class EncryptionKeys(object):
    """
    Data class to encapsulate public and private keys needed to communicate with a device over cloud gatewaay

    """

    def __init__(self, sign_public_key, sign_private_key, encrypt_public_key, encrypt_private_key):
        """

        :param sign_public_key:
        :param sign_private_key:
        :param encrypt_public_key:
        :param encrypt_private_key:
        """
        self.sign_public_key = sign_public_key
        self.sign_private_key = sign_private_key
        self.encrypt_public_key = encrypt_public_key
        self.encrypt_private_key = encrypt_private_key

    def __repr__(self):
        return str(self.__dict__)

    def to_json(self):
        if sys.version_info < (3, 0):
            encrypt_public_key = base64.b64encode(self.encrypt_public_key)
            encrypt_private_key = base64.b64encode(self.encrypt_private_key)
            sign_public_key = base64.b64encode(self.sign_public_key)
            sign_private_key = base64.b64encode(self.sign_private_key)

        else:
            encrypt_public_key = base64.b64encode(self.encrypt_public_key).decode('ascii')
            encrypt_private_key = base64.b64encode(self.encrypt_private_key).decode('ascii')
            sign_public_key = base64.b64encode(self.sign_public_key).decode('ascii')
            sign_private_key = base64.b64encode(self.sign_private_key).decode('ascii')

        return {
            'encrypt_public_key': encrypt_public_key,
            'encrypt_private_key': encrypt_private_key,
            'sign_public_key': sign_public_key,
            'sign_private_key': sign_private_key

        }

    @staticmethod
    def from_json(jsn):

        return EncryptionKeys(
            base64.b64decode(jsn['sign_public_key']),
            base64.b64decode(jsn['sign_private_key']),
            base64.b64decode(jsn['encrypt_public_key']),
            base64.b64decode(jsn['encrypt_private_key'])
        )
