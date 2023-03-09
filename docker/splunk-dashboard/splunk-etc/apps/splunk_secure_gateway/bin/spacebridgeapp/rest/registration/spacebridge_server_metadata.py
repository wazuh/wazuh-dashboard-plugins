"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for getting spacebridge server metadata
"""
import sys
import json
import requests

from splunk.persistconn.application import PersistentServerConnectionApplication
from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from http import HTTPStatus
from spacebridge_protocol.metadata_pb2 import GetSpacebridgeMetadataResponse
from spacebridge_protocol.discovery_pb2 import SpacebridgeInstance
from spacebridgeapp.logging import setup_logging
from cloudgateway.private.sodium_client import SodiumClient
from cloudgateway.splunk.encryption import SplunkEncryptionContext
from spacebridgeapp.rest.util.errors import SpacebridgeRestError
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, STATUS, PAYLOAD, SPACEBRIDGE_SERVER, MESSAGE, \
    SESSION, AUTHTOKEN, HEADER_AUTHORIZATION, HEADER_CONTENT_TYPE, QUERY

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_spacebridge_server_metadata")

class SpacebridgeServerMetadata(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the spacebridge_server_metadata endpoint.

    This method will query a specific Spacebridge Server's metadata endpoint.
    This endpoint currently returns the http_domain, grpc_domain and the instance_id
    """

    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)
        self.sodium_client = SodiumClient()

    def get(self, request):
        """
          This will return a payload containing all the metadata from Spacebridge's metadata endpoint,
          currently this is http_domain, grpc_domain and instance_id

          :param request
          :return json response with metadata from Spacebridge:
          """

        session_token = request[SESSION][AUTHTOKEN]
        sodium_client = SodiumClient(LOGGER.getChild('sodium_client'))
        encryption_context = SplunkEncryptionContext(session_token, SPACEBRIDGE_APP_NAME, sodium_client)
        sign_pub_key = encryption_context.sign_public_key()
        client_id = encryption_context.generichash_hex(sign_pub_key)

        spacebridge_server = request[QUERY].get(SPACEBRIDGE_SERVER)

        if not spacebridge_server:
            return {STATUS: HTTPStatus.BAD_REQUEST,
                    PAYLOAD: {MESSAGE: "Please provide a Spacebridge server."}}

        headers = {HEADER_CONTENT_TYPE: 'application/json',
                   HEADER_AUTHORIZATION: client_id}

        try:
            response = requests.get(
                url=f'https://{spacebridge_server}/api/metadata',
                headers=headers
            )

            if not response.ok:
                raise SpacebridgeRestError(message=str(response.content), status=response.status_code)

            metadata_response = GetSpacebridgeMetadataResponse()
            instance = SpacebridgeInstance()

            metadata_response.ParseFromString(response.content)
            instance.ParseFromString(metadata_response.instance)

            return {STATUS: HTTPStatus.OK,
                    PAYLOAD: {"http_domain": instance.httpDomain,
                              "grpc_domain": instance.grpcDomain,
                              "instance_id": instance.instanceId}}

        except Exception as e:
            return {STATUS: HTTPStatus.NOT_FOUND,
                    PAYLOAD: {MESSAGE: "Please enter a valid Spacebridge Server."}}
