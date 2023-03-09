"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""
import asyncio
import json
from base64 import urlsafe_b64encode, b64encode, b64decode
from http import HTTPStatus

from spacebridgeapp.rest.clients.async_client_factory import AsyncClientFactory
from spacebridgeapp.util import py23
from cloudgateway.splunk.auth import SimpleUserCredentials
from cloudgateway.splunk.asyncio.auth import AioSplunkJWTMDMCredentials
from cloudgateway.device import EnvironmentMetadata

# TODO SDK needs to support python 3 MDM based registration
from cloudgateway.mdm import CloudgatewayMdmRegistrationError, \
    ServerRegistrationContext
from cloudgateway.private.asyncio.clients.aio_client import AioHttpClient
from cloudgateway.asyncio.mdm_handler import handle_mdm_authentication_request
from spacebridgeapp.util import constants
from spacebridgeapp.versioning import app_version
from spacebridgeapp.util.app_info import get_app_platform, resolve_app_name
from spacebridgeapp.util.time_utils import get_current_date
from spacebridgeapp.util.config import secure_gateway_config as config
from spacebridgeapp.logging import setup_logging
from splapp_protocol.request_pb2 import VersionGetResponse
from spacebridgeapp.versioning import app_version, minimum_build
from spacebridgeapp.request.generic_request_processor import fetch_registered_apps
from spacebridgeapp.data.telemetry_data import InstallationEnvironment
from spacebridgeapp.request.version_request_processor import async_get_meta_info
from spacebridgeapp.rest.registration.registration_webhook import aio_validate_user

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_spacebridge_request_processor.log",
                       "spacebridge_request_processor")


async def _find_owner(auth_header, device_id, all_users, async_kvstore_client):
    """

    :param auth_header: A system auth header
    :param device_id: a url safe base64 encoded device id (same encoding as register device _key)
    :param all_users:  an array of strings indicating all the users to include in the device search
    :param async_kvstore_client:
    :return: the id of the user if a matching device is found, False otherwise
    """
    LOGGER.info("All users=%s" % all_users)

    for user in all_users:
        response = await async_kvstore_client.async_kvstore_get_request(
            constants.REGISTERED_DEVICES_COLLECTION_NAME, auth_header=auth_header, owner=user, key_id=device_id)

        if response.code == HTTPStatus.OK:
            return user

    return False


async def unregister_device(auth_header, unregister_event, async_splunk_client, async_kvstore_client):
    """
    :param auth_header: A system auth header
    :param unregister_event: A protobuf spacebridge unregister event
    :param async_splunk_client:
    :param async_kvstore_client:
    :return: True if the device was found and deleted, False otherwise
    """
    event_device_id = py23.urlsafe_b64encode_to_str(unregister_event.deviceId)

    (http_code, all_users) = await async_splunk_client.async_get_all_users(auth_header)

    user = None

    if http_code == HTTPStatus.OK:
        user = await _find_owner(auth_header, event_device_id, all_users, async_kvstore_client)
    else:
        LOGGER.warn("Failed to list all users, status=%s" % http_code)

    found = False

    if user:
        await async_kvstore_client.async_kvstore_delete_request(constants.REGISTERED_DEVICES_COLLECTION_NAME,
                                                                auth_header=auth_header,
                                                                key_id=event_device_id,
                                                                owner=user)
        await async_kvstore_client.async_kvstore_delete_request(constants.DEVICE_PUBLIC_KEYS_COLLECTION_NAME,
                                                                auth_header=auth_header,
                                                                key_id=event_device_id,
                                                                owner=constants.NOBODY)
        devices = await async_kvstore_client.async_kvstore_get_request(constants.REGISTERED_DEVICES_COLLECTION_NAME,
                                                                       auth_header=auth_header,
                                                                       owner=user)
        devices_json = await devices.json()
        if len(devices_json) <= 0:
            LOGGER.info("User={} has no remaining registered devices, removing user from registered users".format(user))
            await async_kvstore_client.async_kvstore_delete_request(constants.REGISTERED_USERS_COLLECTION_NAME,
                                                                    auth_header=auth_header,
                                                                    key_id=user)
        found = True

    return found


async def mdm_authentication_request(auth_header, mdm_auth_request, async_client_factory, encryption_context,
                                     request_id):
    """

    :type async_client_factory: AsyncClientFactory
    """
    LOGGER.info("starting mdm_authentication_request, request_id={}".format(request_id))
    try:
        mdm_registration_ctx = CloudgatewayMdmRegistrationContext(auth_header, async_client_factory)

        result = await handle_mdm_authentication_request(mdm_auth_request, encryption_context, mdm_registration_ctx,
                                                         LOGGER, config, request_id)
        LOGGER.info("completed mdm_authentication_request, request_id={}".format(request_id))
        return result
    except Exception as e:
        LOGGER.exception("Unexpected exception occured during mdm_authentication_request={}, request_id={}"
                         .format(e, request_id))


class CloudgatewayMdmRegistrationContext(ServerRegistrationContext):
    """
    Base class for Cloudgateway MDM registration.
    """
    # pycharm type annotations
    async_kvstore_client = None  # type: AsyncKvStoreClient
    async_splunk_client = None  # type: AsyncSplunkClient

    def __init__(self, system_auth_header, async_client_factory: AsyncClientFactory):
        """
        :param async_splunk_client (AsyncSplunkClient)
        :param async_kvstore_client:(AsyncKvStoreClient)
        :param system_auth_header: (AuthHeader)
        """
        self.async_splunk_client = async_client_factory.splunk_client()
        self.async_kvstore_client = async_client_factory.kvstore_client()
        self.async_spacebridge_client = async_client_factory.spacebridge_client()
        self.async_telemetry_client = async_client_factory.telemetry_client()
        self.async_client = async_client_factory.async_client()
        self.system_auth_header = system_auth_header

    async def validate_username_password(self, username, password):
        """
        Validate username and password against splunk
        :param username (String)
        :param password (String)
        :return (Boolean)
        :raises (CloudgatewayMdmRegistrationError)
        """
        response = await self.async_splunk_client.async_get_splunk_cookie(username, password)
        if response.code == HTTPStatus.OK:
            return True

        message = await response.text()
        LOGGER.info("valid_session_token=false with message={}, status_code={}".format(message, response.code))

        raise CloudgatewayMdmRegistrationError(CloudgatewayMdmRegistrationError.ErrorType.INVALID_CREDENTIALS_ERROR,
                                               "Failed to authenticate session token with error={}, status_code={}"
                                               .format(message, response.code))

    async def validate(self, username, password, device_info):
        """
        Validates whether the supplied username and password are correct against splunk and also validates whether
        app that the user is trying to register is enabled.
        :param username:
        :param password:
        :param device_info:
        :return (boolean)
        :raises CloudgatewayMdmRegistrationError
        """

        registration_webhook_url = config.get_registration_webhook_url()

        if registration_webhook_url:
            LOGGER.debug('Attempting to validate user via registration webhook')
            await aio_validate_user(registration_webhook_url,
                                    username,
                                    config.get_webhook_verify_ssl(),
                                    self.async_client)
            LOGGER.debug('Successfully validated that user via registration webhook')

        LOGGER.debug("validating username and password")
        await self.validate_username_password(username, password)
        LOGGER.debug("completed mdm validation")
        return True

    async def create_session_token(self, username, password):  # pylint: disable=no-self-use
        """
        Create a session token given a username and password.
        :param username (string)
        :param password (string)
        :return (string): session token string
        """
        try:
            user_auth = AioSplunkJWTMDMCredentials(username)
            await user_auth.load_jwt_token(self.system_auth_header)
            LOGGER.info("Successfully fetched jwt token")
        except Exception as e:
            LOGGER.info("Failed to fetch jwt token with message={}. Using basic session token instead.".format(e))
            user_auth = SimpleUserCredentials(username, password)
        return user_auth.get_credentials().encode('utf-8')

    async def get_server_version(self):  # pylint: disable=no-self-use
        """
        :return (string) splapp version
        """
        return str(app_version())

    async def get_deployment_name(self):
        """
        Get deployment name
        :return:
        """

        meta_info = await async_get_meta_info(self.system_auth_header, self.async_kvstore_client)
        deployment_name = meta_info[constants.DEPLOYMENT_INFO][constants.DEPLOYMENT_FRIENDLY_NAME]

        return deployment_name

    def build_device_name(self, device_info, username):  # pylint: disable=no-self-use
        """
        Device name that will be displayed in the UI.
        :param device_info (DeviceInfo)
        :param username (string)
        :return (string) device name
        """
        return "{}-{}-{}".format(username, get_app_platform(device_info.app_id), get_current_date())

    async def get_mdm_signing_key(self):
        """
        Get the MDM signing key
        """
        LOGGER.info("Fetching mdm signing key")
        r = await self.async_splunk_client.async_get_deployment_info(self.system_auth_header)

        if r.code == HTTPStatus.OK:
            jsn = await r.json()
            mdm_signing_key = jsn[constants.MDM_SIGN_PUBLIC_KEY]
            LOGGER.info("successfully fetched mdm public key={}".format(mdm_signing_key))

            return b64decode(mdm_signing_key)

        LOGGER.error("Could not fetch mdm signing key with response={}".format(r.code))
        return ""

    async def persist_device_info(self, device_info, username):
        """
        Write device info to KV Store collections

        :param device_info (DeviceInfo)
        :param username (String)
        :return None
        """
        url_safe_device_id = py23.urlsafe_b64encode_to_str(device_info.device_id)
        device_id = py23.b64encode_to_str(device_info.device_id)
        platform = device_info.platform

        # Insert into public keys table
        device_public_keys_payload = {
            '_key': url_safe_device_id,
            'encrypt_public_key': py23.b64encode_to_str(device_info.encrypt_public_key),
            'sign_public_key': py23.b64encode_to_str(device_info.sign_public_key)
        }

        registration_payload = {
            '_key': url_safe_device_id,
            'app_id': device_info.app_id,
            'device_type': resolve_app_name(device_info.app_id),
            'device_name': self.build_device_name(device_info, username),
            'user': username,
            'device_id': device_id,
            'platform': platform,
            'registration_method': device_info.registration_method,
            'auth_method': device_info.auth_method,
            'device_management_method': device_info.device_management_method,
            'device_registered_timestamp': device_info.device_registered_timestamp
        }

        keys_resp = await self.async_kvstore_client.async_kvstore_post_request(
            constants.DEVICE_PUBLIC_KEYS_COLLECTION_NAME,
            json.dumps(device_public_keys_payload),
            self.system_auth_header)

        keys_resp_code = keys_resp.code
        keys_resp_text = await keys_resp.text()

        allowed_results = (HTTPStatus.CREATED, HTTPStatus.OK, HTTPStatus.CONFLICT)

        if keys_resp_code not in allowed_results:
            raise CloudgatewayMdmRegistrationError(CloudgatewayMdmRegistrationError.ErrorType.UNKNOWN_ERROR,
                                                   keys_resp_text)

        devices_resp = await self.async_kvstore_client.async_kvstore_post_request(
            constants.REGISTERED_DEVICES_COLLECTION_NAME,
            json.dumps(registration_payload),
            self.system_auth_header,
            owner=username)

        devices_resp_code = devices_resp.code
        devices_resp_text = await devices_resp.text()

        if devices_resp_code not in allowed_results:
            raise CloudgatewayMdmRegistrationError(CloudgatewayMdmRegistrationError.ErrorType.UNKNOWN_ERROR,
                                                   devices_resp_text)

        # If this call fails it's not a big deal, it's just an optimization. Modular input which runs every day
        # will pick up this user as having a registered device in any case.

        r = await self.async_kvstore_client.async_kvstore_post_request(constants.REGISTERED_USERS_COLLECTION_NAME,
                                                                       json.dumps({"_key": username}),
                                                                       self.system_auth_header)

        LOGGER.info("Received response_code={} back on add user to registered users collection".format(r.code))

    async def get_server_type(self):  # pylint: disable=no-self-use
        """
        :return (string) splapp app id
        """
        return constants.SPLAPP_APP_ID

    async def get_environment_meta(self, device_info, username, registration_info=None):
        """
        Fetch environment metadata
        return (EnvironmentMetadata)
        """
        if registration_info is None:
            registration_info = {}
        try:
            version_get_response = VersionGetResponse()

            # SSG version and min client version
            version_get_response.cloudgatewayAppVersion = str(app_version())
            version_get_response.minimumClientVersion = str(minimum_build(device_info.app_id))

            # Companion Apps
            companion_app_list = await fetch_registered_apps(self.system_auth_header, self.async_splunk_client)
            for key, app in companion_app_list.items():
                companion = version_get_response.companionApps.add()
                companion.appId = key
                companion.appVersion = app[constants.VERSION]

            # Splunk Version
            splunk_version = await self.async_telemetry_client.get_splunk_version(self.system_auth_header)
            version_get_response.splunkVersion = splunk_version

            # Telemetry Instance Id
            telemetry_instance_id = await self.async_telemetry_client.get_telemetry_instance_id(self.system_auth_header)
            version_get_response.instanceId = telemetry_instance_id

            # Installation Environment
            installation_environment = await self.async_telemetry_client.get_installation_environment(
                self.system_auth_header)

            installation_environment_proto = VersionGetResponse.CLOUD \
                if installation_environment is InstallationEnvironment.CLOUD \
                else VersionGetResponse.ENTERPRISE
            version_get_response.installationEnvironment = installation_environment_proto

            meta_info = await async_get_meta_info(self.system_auth_header, self.async_kvstore_client)

            # Deployment friendly name
            deployment_friendly_name = meta_info[constants.DEPLOYMENT_INFO][constants.DEPLOYMENT_FRIENDLY_NAME]
            version_get_response.deploymentFriendlyName = deployment_friendly_name

            # Device name
            version_get_response.deviceName = self.build_device_name(device_info, username)

            # Mdm Enforced
            mdm_configuration = meta_info.get(constants.ENFORCE_MDM, {})
            version_get_response.mdmEnforced = mdm_configuration.get(constants.ENFORCE_MDM, False)

            # Registration Type
            registration_type_proto = registration_info.get("registration_type", None)

            if registration_type_proto:
                version_get_response.registrationType = registration_type_proto

            # Registration Method
            registration_method_proto = registration_info.get("registration_method", None)
            if registration_method_proto:
                version_get_response.registrationMethod = registration_method_proto

            return EnvironmentMetadata(version_get_response.SerializeToString(), "{}.{}".format(
                constants.SPLAPP_APP_ID, constants.VERSION_GET_RESPONSE
            ))

        except Exception as e:
            LOGGER.exception("Exception fetching environment data")
            return EnvironmentMetadata(VersionGetResponse().SerializeToString(), "{}.{}".format(
                constants.SPLAPP_APP_ID, constants.VERSION_GET_RESPONSE
            ))
