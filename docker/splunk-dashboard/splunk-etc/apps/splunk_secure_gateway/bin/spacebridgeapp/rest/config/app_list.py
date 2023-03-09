"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

REST endpoint handler for accessing and setting app_list kvstore records
"""

import json
import sys

from splunk.clilib.bundle_paths import make_splunkhome_path

sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from http import HTTPStatus
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.rest import async_base_endpoint
from spacebridgeapp.messages.request_context import RequestContext
from spacebridgeapp.request.app_list_request_processor import fetch_dashboard_app_list_with_default, fetch_app_names, \
    set_dashboard_app_list
from spacebridgeapp.exceptions.spacebridge_exceptions import SpacebridgeApiRequestError

from spacebridgeapp.request.splunk_auth_header import SplunkAuthHeader

from spacebridgeapp.util.constants import SPACEBRIDGE_APP_NAME, AUTHTOKEN, SESSION, USER, APP, DISPLAY_APP_NAME, \
    PAYLOAD, AUTHOR, DASHBOARDS_VISIBLE

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + ".log", "rest_app_list")


class AppList(async_base_endpoint.AsyncBaseRestHandler):
    """
    Main class for handling the app_list endpoint. Subclasses the spacebridge_app
    BaseRestHandler.

    """

    @staticmethod
    def render_error(err, status_code=None):
        if hasattr(err, 'status_code'):
            status_code = err.status_code

        if not status_code:
            status_code = HTTPStatus.INTERNAL_SERVER_ERROR

        return AppList.render(status_code, {'result': 'error', 'message': str(err)})


    @staticmethod
    def _is_enabled(selected_apps, app_id):
        global_enabled = len(selected_apps) == 0

        if global_enabled:
            return True

        return app_id in selected_apps

    async def get(self, request):
        """
          This method will process a DashboardAppListGetRequest.  This will return the list of app_names found under the
          dashboard_app_list key in the user_meta KVStore collection.

          :param request_context:
          :param client_single_request:
          :param single_server_response:
          :param async_client_factory:
          :return:
          """
        authtoken = request[SESSION][AUTHTOKEN]
        user = request[SESSION][USER]
        auth_header = SplunkAuthHeader(authtoken)
        request_context = RequestContext(auth_header, current_user=user, system_auth_header=auth_header)

        async_splunk_client = self.async_client_factory.splunk_client()
        async_kvstore_client = self.async_client_factory.kvstore_client()

        # Get dashboard_meta collection if key exists
        try:
            selected_apps = await fetch_dashboard_app_list_with_default(request_context=request_context,
                                                                        async_kvstore_client=async_kvstore_client,
                                                                        async_splunk_client=async_splunk_client)
            app_list = await fetch_app_names(request_context, async_splunk_client)
        except SpacebridgeApiRequestError as e:
            LOGGER.warn("Failed to fetch app list, error=%s", e)
            return self.render_error(e)

        payload = [{APP: app.app_name,
                    DISPLAY_APP_NAME: app.display_app_name,
                    AUTHOR: app.author,
                    DASHBOARDS_VISIBLE: self._is_enabled(selected_apps, app.app_name)} for app in app_list]

        return self.render(HTTPStatus.OK, payload)

    async def post(self, request):
        """
        Handler which creates a new app_list data entry in kvstore for the
        current user
        """
        authtoken = request[SESSION][AUTHTOKEN]
        user = request[SESSION][USER]
        auth_header = SplunkAuthHeader(authtoken)
        request_context = RequestContext(auth_header, current_user=user, system_auth_header=auth_header)

        async_splunk_client = self.async_client_factory.splunk_client()
        async_kvstore_client = self.async_client_factory.kvstore_client()

        try:
            total_app_list = await fetch_app_names(request_context, async_splunk_client)
            total_app_name_list = [app.app_name for app in total_app_list]

            selected_apps = json.loads(request[PAYLOAD])

            if selected_apps == total_app_name_list:
                selected_apps = []

            # # validate all app names
            for app_name in selected_apps:
                if app_name not in total_app_name_list:
                    error_message = f"id={app_name} is invalid."
                    return self.render_error(SpacebridgeApiRequestError(message=error_message,
                                                                        status_code=HTTPStatus.BAD_REQUEST))

            # Store names in kvstore
            dashboard_app_list = await set_dashboard_app_list(request_context=request_context,
                                                              app_names=selected_apps,
                                                              async_kvstore_client=async_kvstore_client,
                                                              async_splunk_client=async_splunk_client)

            result_app_names = [name for name in dashboard_app_list.app_names]

            payload = [{APP: app.app_name,
                        DISPLAY_APP_NAME: app.display_app_name,
                        AUTHOR: app.author,
                        DASHBOARDS_VISIBLE: self._is_enabled(result_app_names, app.app_name)} for app in total_app_list]

            return self.render(HTTPStatus.OK, {'result': 'ok', 'payload': payload})
        except SpacebridgeApiRequestError as e:
            return self.render_error(e)

