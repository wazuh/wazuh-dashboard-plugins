import requests
import uuid

from cloudgateway.encryption_context import EncryptionContext
from cloudgateway.private.exceptions.registration_exceptions import RegistrationError, RegistrationTimeout

from cloudgateway.private.registration.registration_utils import (
    initial_registration_request,
    enable_routing,

)
from cloudgateway.private.util.config import SplunkConfig
from cloudgateway.private.util.constants import (
    HEADER_AUTHORIZATION,
    HEADER_SPACEBRIDGE_AUTH_ID,
)
from cloudgateway.splunk.auth import SplunkJWTCredentials
from dataclasses import dataclass
from http import HTTPStatus
from spacebridge_protocol.registration_v2_pb2 import (
    ClientResultResponse,
    RegistrarResult,
)
from spacebridge_protocol.http_pb2 import EnvironmentMetadata


REGISTRATION_V2_PATH = 'api/registration_v2'
AUTH_CODE_CONTEXT = 'CTX_AUTH'
ENCRYPTION_KEY_CONTEXT = 'CTX_CRPT'


# -------------------------------------------------- Start public API --------------------------------------------------

def start_registration(encryption_context: EncryptionContext,
                       jwt: SplunkJWTCredentials,
                       environment_metadata: EnvironmentMetadata = None,
                       config: SplunkConfig = None) -> str:
    """
    Initiates a Spacebridge registration and returns the auth code associated with the pairing.

    :param environment_metadata: environment metadata, serialized version get request
    :param encryption_context: the public and private signing / encryption keys of the initiator
    :param jwt: a token for authentication the user owning the device to be registered
    :param config: (Optional) a config for determining which Spacebridge host to use

    :raises RegistrationError: If Spacebridge fails to accept a new pairing request. For more specific debug
                               information, see the "code" attribute of the returned exception.

    :returns: the auth code for the registration
    """

    config = config or SplunkConfig()

    auth_code = str(uuid.uuid4()).upper()

    initial_registration_request(auth_code=auth_code,
                                 encryption_context=encryption_context,
                                 config=config,
                                 jwt=jwt,
                                 environment_metadata=environment_metadata)

    return auth_code


@dataclass(frozen=True)
class DeviceInfo:
    encryption_public_key: bytes
    signing_public_key: bytes
    name: str
    app_id: str

    def client_id(self, encryption_context: EncryptionContext) -> bytes:
        return encryption_context.generichash_raw(self.signing_public_key)


def complete_registration(auth_id: bytes,
                          encryption_context: EncryptionContext,
                          config: SplunkConfig = None) -> DeviceInfo:
    """
    Waits for the registration identified by "auth_id" to complete and returns a DeviceInfo for the paired device.

    :param auth_id: the auth ID derived from the auth code of the registration
    :param encryption_context: the encryption context of the initiating party
    :param config: (Optional) a config to specify which Spacebridge hostname to use

    :raises RegistrationTimeout: When Spacebridge responds to the long pull with anything other than a 200. The caller
                                 should retry this assuming the calling context still wants to wait for the
                                 registration to complete.
    :raises RegistrationError: When Spacebridge responds with an unexpected error from either the query for completion
                               API or the enable routing API. Inspect the "code" attribute of the returned exception
                               for more info.

    :returns: A DeviceInfo instance with relevant information about the newly registered client device.
    """
    config = config or SplunkConfig()
    response = requests.get(
        url=f'https://{config.get_spacebridge_server()}/{REGISTRATION_V2_PATH}/result',
        headers={
            HEADER_AUTHORIZATION: encryption_context.sign_public_key(transform=encryption_context.generichash_hex),
            HEADER_SPACEBRIDGE_AUTH_ID: auth_id.hex()
        },
        proxies=config.get_proxies()
    )
    if response.status_code == HTTPStatus.NOT_FOUND:
        raise RegistrationTimeout()
    if response.status_code != HTTPStatus.OK:
        raise RegistrationError(prefix='HTTP error while waiting to confirm registration completion',
                                code=response.status_code,
                                message=response.text)

    response_pb = ClientResultResponse()
    response_pb.ParseFromString(response.content)
    if response_pb.HasField('error'):
        raise RegistrationError(prefix='Application error from ClientResultRequest',
                                code=response_pb.error.code,
                                message=response_pb.error.message)

    registrar_result_bytes = encryption_context.sodium_client.box_seal_open(
        response_pb.registrarResult.encryptedRegistrarResult,
        encryption_context.encrypt_public_key(),
        encryption_context.encrypt_private_key()
    )
    registrar_result = RegistrarResult()
    registrar_result.ParseFromString(registrar_result_bytes)
    if registrar_result.HasField('error'):
        raise RegistrationError(prefix='Application error while confirming registration',
                                code=registrar_result.error.code,
                                message=registrar_result.error.message)

    device_info = DeviceInfo(
        encryption_public_key=registrar_result.confirmation.keyBundle.publicKeyForEncryption,
        signing_public_key=registrar_result.confirmation.keyBundle.publicKeyForSigning,
        name=registrar_result.confirmation.registrarInfo.name,
        app_id=registrar_result.confirmation.registrarInfo.typeId,
    )
    enable_routing(encryption_context, device_info.client_id(encryption_context), config)
    return device_info
