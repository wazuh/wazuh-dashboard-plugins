import json
import requests

from http import HTTPStatus

from cloudgateway.encryption_context import EncryptionContext

from cloudgateway.private.util.config import SplunkConfig
from cloudgateway.private.exceptions.registration_exceptions import RegistrationError
from cloudgateway.private.exceptions.discovery import DiscoveryError
from spacebridge_protocol.discovery_pb2 import (
    GetSpacebridgeInstanceResponse,
    GetSpacebridgeInstancesResponse,
    SetHashCodeInstanceRequest,
)

from cloudgateway.private.util.constants import (
    DISCOVERY_PATH,
    HEADER_AUTHORIZATION,
)

DISCOVERY_TIMEOUT = 10

def query_discovery_compatibility(config: SplunkConfig = SplunkConfig()) -> json:
    """

    Used for querying SBD Compatibility

    """

    try:
        response = requests.get(
            url=f'https://{config.get_spacebridge_discovery_server()}/{DISCOVERY_PATH}/compatibility',
            proxies=config.get_proxies(),
            timeout=DISCOVERY_TIMEOUT
        )
    except requests.Timeout as e:
        raise RegistrationError(prefix='HTTP Timeout while querying Discovery Compatibility',
                                code=HTTPStatus.REQUEST_TIMEOUT,
                                message=str(e))
    if not response.ok:
        raise DiscoveryError(prefix='HTTP error while querying Discovery Compatibility',
                             code=response.status_code,
                             message=response.text)

    response_json = json.loads(response.content)
    return response_json


def query_discovery_instance(instance_id: str,
                             encryption_context: EncryptionContext,
                             config: SplunkConfig = SplunkConfig()) -> GetSpacebridgeInstanceResponse:
    """

    Used for specifying a single instance_id to Spacebridge Discovery

    """
    try:
        response = requests.get(
            url=f'https://{config.get_spacebridge_discovery_server()}/{DISCOVERY_PATH}/instances/{instance_id}',
            headers={
                HEADER_AUTHORIZATION: encryption_context.sign_public_key(transform=encryption_context.generichash_hex),
            },
            proxies=config.get_proxies(),
            timeout=DISCOVERY_TIMEOUT
        )
    except requests.Timeout as e:
        raise RegistrationError(prefix='HTTP Timeout while querying Discovery Compatibility',
                                code=HTTPStatus.REQUEST_TIMEOUT,
                                message=str(e))
    if response.status_code != HTTPStatus.OK:
        raise RegistrationError(prefix='HTTP error while Querying Public Discovery Instances',
                                code=response.status_code,
                                message=response.text)
    response_pb = GetSpacebridgeInstanceResponse()
    response_pb.ParseFromString(response.content)
    if response_pb.HasField('error'):
        raise RegistrationError(prefix='Application error during Querying Public Discovery Instances',
                                code=response_pb.error.code,
                                message=response_pb.error.message)

    return response_pb


def query_discovery_instances(encryption_context: EncryptionContext,
                              config: SplunkConfig = SplunkConfig()) -> GetSpacebridgeInstancesResponse:
    """

    Used for querying all public Spacebridge discovery instances, used to populate regions list

    """
    try:
        response = requests.get(
            url=f'https://{config.get_spacebridge_discovery_server()}/{DISCOVERY_PATH}/instances',
            headers={
                HEADER_AUTHORIZATION: encryption_context.sign_public_key(transform=encryption_context.generichash_hex),
            },
            proxies=config.get_proxies(),
            timeout=DISCOVERY_TIMEOUT
        )
    except requests.Timeout as e:
        raise RegistrationError(prefix='HTTP Timeout while querying Discovery Compatibility',
                                code=HTTPStatus.REQUEST_TIMEOUT,
                                message=str(e))
    if response.status_code != HTTPStatus.OK:
        raise RegistrationError(prefix='HTTP error while Querying Public Discovery Instances',
                                code=response.status_code,
                                message=response.text)
    response_pb = GetSpacebridgeInstancesResponse()
    response_pb.ParseFromString(response.content)
    if response_pb.HasField('error'):
        raise RegistrationError(prefix='Application error during Querying Public Discovery Instances',
                                code=response_pb.error.code,
                                message=response_pb.error.message)

    return response_pb


def update_hashcode_instance(hashed_auth: str,
                             instance_id: str,
                             encryption_context: EncryptionContext,
                             config: SplunkConfig = SplunkConfig()):
    request = SetHashCodeInstanceRequest(
        hashCode=hashed_auth,
        instanceId=instance_id
    )
    try:
        response = requests.put(
            url=f'https://{config.get_spacebridge_discovery_server()}/{DISCOVERY_PATH}/hashcodes/instance',
            headers={
                HEADER_AUTHORIZATION: encryption_context.sign_public_key(transform=encryption_context.generichash_hex),
            },
            data=request.SerializeToString(),
            proxies=config.get_proxies(),
            timeout=DISCOVERY_TIMEOUT
        )
    except requests.Timeout as e:
        raise RegistrationError(prefix='HTTP Timeout while querying Discovery Compatibility',
                                code=HTTPStatus.REQUEST_TIMEOUT,
                                message=str(e))

    if response.status_code != HTTPStatus.OK:
        raise RegistrationError(prefix='HTTP error while Updating Hashcode Instance',
                                code=response.status_code,
                                message=response.text)

    return response
