"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Hosts APIs for listing one or more JSON formatted DashboardDescriptions.
"""
import sys


from splunk.clilib.bundle_paths import make_splunkhome_path
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from http import HTTPStatus
from spacebridgeapp.util.constants import PAYLOAD, STATUS, QUERY, OFFSET, MAX_RESULTS, DASHBOARD_IDS, MINIMAL_LIST
from spacebridgeapp.messages.request_context import RequestContext
from spacebridgeapp.request.dashboard_request_processor import process_dashboard_list_request
from spacebridgeapp.rest import async_base_endpoint
from google.protobuf.json_format import MessageToDict
from splapp_protocol import request_pb2


async def dashboard_list_request(request, async_client_factory, request_context):
    """
    REST handler to fetch a list of dashboards
    """

    try:
        offset = request[QUERY].get(OFFSET)
        max_results = request[QUERY].get(MAX_RESULTS)
        dashboard_ids = request[QUERY].get(DASHBOARD_IDS)
        minimal_list = int(request[QUERY].get(MINIMAL_LIST, 0))

        client_request_proto = request_pb2.ClientSingleRequest()
        dashboard_request = client_request_proto.dashboardListRequest
        if dashboard_ids:
            dashboard_ids = [dashboard_ids] if not isinstance(dashboard_ids, list) else dashboard_ids
            dashboard_request.dashboardIds.extend(dashboard_ids)
        if offset:
            dashboard_request.offset = int(offset)
        if max_results:
            dashboard_request.maxResults = int(max_results)
        dashboard_request.minimalList = minimal_list

        server_response_proto = request_pb2.ServerSingleResponse()

        await process_dashboard_list_request(request_context,
                                             client_request_proto,
                                             server_response_proto,
                                             async_client_factory)

        return MessageToDict(server_response_proto)
    except Exception as e:
        return {'error': str(e)}


class DashboardsHandler(async_base_endpoint.AsyncBaseRestHandler):

    async def get(self, request):
        """
        Lists one or more dashboards in the form of JSON formatted DashboardDescription messages.

        Request Parameters
            offset         the number of dashboards to skip
            max_results    the maximum number of dashboards to return
            dashboard_ids  one or more dashboard IDs to query
            minimal_list   0 for verbose descriptions and 1 for minimal descriptions
        """
        context = RequestContext.from_rest_request(request)
        response = await dashboard_list_request(request, self.async_client_factory, context)
        return {
            PAYLOAD: response,
            STATUS: HTTPStatus.INTERNAL_SERVER_ERROR if 'error' in response else HTTPStatus.OK,
        }
