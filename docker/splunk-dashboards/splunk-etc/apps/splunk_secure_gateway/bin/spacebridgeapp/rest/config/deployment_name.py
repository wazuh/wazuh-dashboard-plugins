"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""

import json
import sys

from splunk.clilib.bundle_paths import make_splunkhome_path
from splunk.persistconn.application import PersistentServerConnectionApplication

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))

from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util import constants
from spacebridgeapp.rest.base_endpoint import BaseRestHandler
from spacebridgeapp.rest.services.kvstore_service import KVStoreCollectionAccessObject as kvstore


from spacebridgeapp.util.constants import SESSION, USER, AUTHTOKEN, NOBODY, META_COLLECTION_NAME, DEPLOYMENT_INFO, \
    DEPLOYMENT_FRIENDLY_NAME, SYSTEM_AUTHTOKEN, PAYLOAD, STATUS

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + ".log", "set_deployment_name")


class DeploymentName(BaseRestHandler, PersistentServerConnectionApplication):
    """
    Main class for handling the deployment_name endpoint. Subclasses the spacebridge_app
    BaseRestHandler.
    """
    def __init__(self, command_line, command_arg):
        BaseRestHandler.__init__(self)

    @staticmethod
    def validate_deployment_name(deployment_name):
        """
        Helper method to stip whitespace and validate deployment name
        :param deployment_name:
        :return:
        """
        if deployment_name:
            deployment_name = deployment_name.strip()

            # This number is from securegateway.conf we can set constant later
            if len(deployment_name) <= 64:
                return deployment_name
        return False

    def post(self, request):

        payload = json.loads(request[PAYLOAD])

        LOGGER.info("attempting to set deployment name")
        deployment_name = payload.get('deployment_name', '')
        status_code = HTTPStatus.OK
        error_message = None

        valid_deployment_name = DeploymentName.validate_deployment_name(deployment_name)

        if not valid_deployment_name:
            error_message = "Invalid Deployment Name"
            status_code = HTTPStatus.BAD_REQUEST

        # Don't check kvstore if we already have an error
        if error_message:
            return {
                PAYLOAD: {
                    'message': error_message
                },
                STATUS: status_code,
            }

        # Get the kvstore object first because posting overwrites the entire object
        try:
            kvstore_service = kvstore(collection=META_COLLECTION_NAME,
                                      session_key=request[SESSION][AUTHTOKEN],
                                      owner=NOBODY)
            # will return a tuple of (serverResponse, serverContent)
            result = json.loads(kvstore_service.get_item_by_key(DEPLOYMENT_INFO)[1])

        except Exception as e:
            # If key not in kvstore
            LOGGER.exception("Exception setting deployment name={}".format(e))
            if hasattr(e, 'statusCode') and e.statusCode == HTTPStatus.NOT_FOUND:
                error_message = 'Could not find deployment info in kvstore'
                error_status = HTTPStatus.NOT_FOUND
            elif hasattr(e, 'statusCode'):
                error_message = str(e)
                error_status = e.statusCode
            else:
                error_message = str(e)
                error_status = HTTPStatus.BAD_REQUEST

            return {
                PAYLOAD: {
                    'message': error_message,
                },
                STATUS: error_status
            }

        # Set new deployment name
        result[DEPLOYMENT_FRIENDLY_NAME] = valid_deployment_name

        kvstore_service.insert_or_update_item_containing_key(result)

        return {
            PAYLOAD: valid_deployment_name,
            STATUS: status_code,
        }

