"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Handler for edit tag requests.  Currently support add and remove tags.
"""
import json
import sys
from json import JSONDecodeError
from http import HTTPStatus

from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from spacebridgeapp.logging import setup_logging
from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME
from spacebridgeapp.util.constants import PAYLOAD, STATUS, MESSAGE
from spacebridgeapp.messages.request_context import RequestContext
from spacebridgeapp.tags.dashboard_tag_util import MIN_SPLUNK_VERSION_FOR_TAGS, is_dashboard_tagging_supported, \
    edit_dashboard_tags
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError, OperationHaltedError
from spacebridgeapp.rest import async_base_endpoint

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_edit_tag_handler.log", "edit_tag_handler")


class EditTagHandler(async_base_endpoint.AsyncBaseRestHandler):

    async def post(self, request):
        """
        Handler for POST requests to ssg/edit_tag API.

        :param request:
        :return:
        """
        response = await edit_dashboard_tags_request(request=request, async_client_factory=self.async_client_factory)
        return response


def format_error_response(message, status):
    LOGGER.error(f"{message}, status_code={status}")
    return {
        STATUS: status,
        PAYLOAD: {
            MESSAGE: message
        }
    }


def format_error_message(message, status, dashboard_id):
    LOGGER.error(f"{message}, status_code={status}, dashboard_id={dashboard_id}")
    return {
        STATUS: status,
        MESSAGE: message
    }


async def edit_dashboard_tags_request(request, async_client_factory):
    """
    Handle request to add/remove tags from a list of dashboards defined in request body

    Example post body:
    {
        "admin/search/dashboard_id": {
            "mobile": True,
            "ar": True,
            "vr": False
        },
        "admin/search/dashboard_id_2": {
            "mobile": True,
            "ar": False,
            "vr": True
        }
    }

    Example Results:
    {
        "status": 200,
        "payload": {
            "results": {
                 "admin/search/dashboard_id": {
                     "message": "The dashboard_id=admin/search/dashboard_id was not found.",
                     "status": 404
                 },
                 "admin/search/dashboard_id_2": {
                     "status": 200
                 }
             }
        }
    }

    :param request:
    :param async_client_factory:
    :return:
    """
    context = RequestContext.from_rest_request(request)
    async_splunk_client = async_client_factory.splunk_client()

    # Splunk Version Check
    splunk_version = await async_splunk_client.async_get_splunk_version(auth_header=context.auth_header)
    if not is_dashboard_tagging_supported(splunk_version):
        return format_error_response(
            message=f"Dashboard tagging is not supported in Splunk version={splunk_version}.  "
                    f"Splunk version {MIN_SPLUNK_VERSION_FOR_TAGS} or above is required.",
            status=HTTPStatus.METHOD_NOT_ALLOWED)

    # Validate JSON request body
    try:
        json_body = json.loads(request[PAYLOAD])
    except JSONDecodeError as e:
        return format_error_response(message=e.msg, status=HTTPStatus.BAD_REQUEST)

    # Process Request
    results = {}
    for dashboard_id, tags in json_body.items():
        try:
            await edit_dashboard_tags(request_context=context, async_splunk_client=async_splunk_client,
                                      dashboard_id=dashboard_id, tags=tags)
            results[dashboard_id] = {STATUS: HTTPStatus.OK}
        except SpacebridgeApiRequestError as e:
            LOGGER.warn("Failed to set dashboard tags, error=%s", str(e))
            results[dashboard_id] = format_error_message(
                dashboard_id=dashboard_id,
                message=e.message,
                status=e.status_code
            )
        except OperationHaltedError as e:
            LOGGER.warn("Failed to set dashboard tags, error=%s", str(e))
            results[dashboard_id] = format_error_message(
                dashboard_id=dashboard_id,
                message=str(e),
                status=HTTPStatus.INTERNAL_SERVER_ERROR
            )

    return {
        PAYLOAD: {"results": results},
        STATUS: HTTPStatus.OK
    }
