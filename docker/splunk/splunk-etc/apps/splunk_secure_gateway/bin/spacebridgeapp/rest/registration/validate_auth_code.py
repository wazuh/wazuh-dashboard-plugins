"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for the first part of  Spacebridge registration process: validating an auth code
"""

import sys
import json
from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))
from spacebridgeapp.util import py23
from base64 import b64decode
from cloudgateway.splunk.encryption import SplunkEncryptionContext
from cloudgateway.private.sodium_client import SodiumClient
from cloudgateway.registration import authenticate_code
from cloudgateway.registration_auth_v2 import authenticate_code_v2
from cloudgateway.discovery import update_hashcode_instance, query_discovery_instances
from cloudgateway.private.registration.registration_utils import derive_auth_params
from cloudgateway.private.exceptions.registration_exceptions import RegistrationError, RegistrationTimeout

from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, UNCONFIRMED_DEVICES_COLLECTION_NAME, \
    ENFORCE_MDM, MDM_SIGN_PUBLIC_KEY, REGISTRATION_V1, REGISTRATION_V2, AUTH_CODE, QUERY, \
    DEVICE_NAME, DEVICE_TYPE, APP_NAME, APP_ID, PLATFORM, REGISTRATION_VERSION, SESSION, USER, \
    SYSTEM_AUTHTOKEN, FALSE, TRUE, DEVICE_MANAGEMENT_METHOD
from spacebridgeapp.rest.registration.util import validate_registration_via_webhook
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as KvStore
from spacebridgeapp.rest.util.helper import extract_parameter
from spacebridgeapp.rest.util import errors as Errors
from spacebridgeapp.rest.devices.user_devices import get_devices_for_user
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.util.app_info import resolve_app_name, APP_ID_TO_META_MAP, get_app_platform
from spacebridgeapp.rest.registration.registration_webhook import validate_user
from spacebridgeapp.rest.services.splunk_service import get_deployment_info
from spacebridge_protocol.discovery_pb2 import SpacebridgeInstancesResponse

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_registration_query")

class ValidateAuthCodeHandler(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling REST Registration endpoint. Subclasses the spacebridge_app
    BaseRestHandler. This multiple inheritance is an unfortunate neccesity based on the way
    Splunk searches for PersistentServerConnectionApplications
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    def get(self, request):
        auth_code = extract_parameter(request[QUERY], AUTH_CODE, QUERY)
        try:
            device_name = extract_parameter(request[QUERY], DEVICE_NAME, QUERY)
        except:
            device_name = ""
        user = request[SESSION][USER]
        system_authtoken = request[SYSTEM_AUTHTOKEN]

        sodium_client = SodiumClient(LOGGER.getChild('sodium_client'))
        encryption_context = SplunkEncryptionContext(system_authtoken, SPACEBRIDGE_APP_NAME, sodium_client)
        kvstore_access_object = KvStore(UNCONFIRMED_DEVICES_COLLECTION_NAME, system_authtoken, owner=user)
        return handle_query(auth_code, device_name, user, system_authtoken, encryption_context, kvstore_access_object)


def handle_query(auth_code, device_name, user, system_authtoken, encryption_context,
                 kvstore_access_object):
    """
    Handler for the initial AuthenticationQueryRequest call. This function:
        1. Makes the AuthenticationQueryRequest request to the server
        2. Checks if app_type has been disabled
        3. Stores a temporary record in the kvstore

    :param auth_code: User-entered authorization code to be returned to Spacebridge
    :param device_name: Name of the new device
    :return: Confirmation code to be displayed to user, and id of temporary kvstore record to be returned later
    """

    validate_registration_via_webhook(user)
    deployment_info = get_deployment_info(system_authtoken)

    enforce_mdm = str(deployment_info.get(ENFORCE_MDM, FALSE)).lower() == TRUE
    mdm_signing_public_key = deployment_info.get(MDM_SIGN_PUBLIC_KEY, "")

    if enforce_mdm and not mdm_signing_public_key:
        raise Errors.SpacebridgeRestError(message="MDM bundle must be generated before registration can proceed",
                                          status=HTTPStatus.UNAUTHORIZED)

    # only use mdm_signing_public_key if mdm sign public key exists
    mdm_signing_public_key = b64decode(mdm_signing_public_key) if mdm_signing_public_key else ""

    LOGGER.info(f"Authenticating code with enforce_mdm={mdm_signing_public_key}")

    _, auth_id, _ = derive_auth_params(encryption_context, auth_code)
    hashed_auth = encryption_context.generichash_raw(auth_id)
    instance_id = ""
    spacebridge_server = config.get_spacebridge_server()

    # Handle discovery query separately in case customer is using private spacebridge in an air-gapped environment
    try:
        get_instances_response = query_discovery_instances(encryption_context, config=config)
        instances_response = SpacebridgeInstancesResponse()
        instances_response.ParseFromString(get_instances_response.instances)
        instances = instances_response.instances
    # Broad exception clause as we can't be certain what error an air-gapped system firewall returns
    except Exception as e:
        LOGGER.error(f"Error when querying Discovery for list of instances. Error={e}")
        # Provide empty instances in the event of a Discovery failure, as we still want to proceed registration for PSBs
        instances = {}

    # Attempt v2 registration else default back to v1 if North America only
    try:
        # A private spacebridge_server will result in an empty instance_id
        for instance in instances:
            if instance.httpDomain == spacebridge_server:
                instance_id = instance.instanceId

        # Only communicate with discovery if using a public spacebridge_server
        if instance_id:
            # Spacebridge Discovery check against hashed auth code
            LOGGER.debug("Updating auth_code = %s in Spacebridge Discovery", hashed_auth.hex())
            update_hashcode_instance(hashed_auth=hashed_auth,
                                     instance_id=instance_id,
                                     encryption_context=encryption_context,
                                     config=config)

        LOGGER.debug("Spacebridge Discovery Successful, spacebridge_server = %s using Registration v2",
                     config.get_spacebridge_server())
        # Run v2 registration flow
        client_device_info = authenticate_code_v2(auth_code,
                                                  encryption_context,
                                                  resolve_app_name,
                                                  config=config,
                                                  mdm_signing_public_key=mdm_signing_public_key,
                                                  enforce_mdm=enforce_mdm)
        registration_version = REGISTRATION_V2
    except (RegistrationError, RegistrationTimeout) as registration_err:
        # Only North America public spacebridge_servers can fall-back to RegV1
        if instance_id and config.get_spacebridge_server() != config.DEFAULT_SPACEBRIDGE_SERVER:
            LOGGER.warn("Auth_code = %s had a Registration_V2 error. Spacebridge_server = %s does not fall-back.",
                        hashed_auth.hex(), config.get_spacebridge_server())
            raise RegistrationError(prefix="RegistrationV2 Error", code=HTTPStatus.NOT_FOUND,
                                    message="Auth Code not recognized.")

        LOGGER.warn("Auth_code = %s failed Registration_V2 with error = %s. Spacebridge_server falling-back to RegV1.",
                    hashed_auth.hex(), registration_err)

        # Makes the AuthenticationQueryRequest request to the server
        client_device_info = authenticate_code(auth_code, encryption_context, resolve_app_name, config=config,
                                               mdm_signing_public_key=mdm_signing_public_key, enforce_mdm=enforce_mdm)
        registration_version = REGISTRATION_V1

    LOGGER.debug("Successfully validated auth_code using registration_version = %s", registration_version)
    app_name = client_device_info.app_name
    app_id = client_device_info.app_id

    platform = client_device_info.platform
    device_management_method = client_device_info.device_management_method

    # if platform not set and we know platform based on app id, use that.
    if not platform and app_id in APP_ID_TO_META_MAP:
        platform = get_app_platform(app_id)

    LOGGER.info("client_device_info={}".format(client_device_info))

    user_devices = get_devices_for_user(user, system_authtoken)
    LOGGER.info("user_devices=%s" % user_devices)

    # Stores a temporary record in the kvstore
    kvstore_payload = client_device_info.to_json()
    kvstore_payload[DEVICE_NAME] = device_name
    kvstore_payload[DEVICE_TYPE] = app_name
    kvstore_payload[APP_NAME] = app_name
    kvstore_payload[APP_ID] = app_id
    kvstore_payload[PLATFORM] = platform
    kvstore_payload[REGISTRATION_VERSION] = registration_version
    kvstore_payload[DEVICE_MANAGEMENT_METHOD] = device_management_method

    _, content = kvstore_access_object.insert_single_item(kvstore_payload)

    return {
        'payload': {
            'temp_key': json.loads(content)['_key'],
            'conf_code': client_device_info.confirmation_code
        },
        'status': HTTPStatus.OK,
    }
