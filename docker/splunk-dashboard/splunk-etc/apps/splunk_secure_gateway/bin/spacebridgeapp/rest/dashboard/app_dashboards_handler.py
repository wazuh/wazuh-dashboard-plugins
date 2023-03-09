import sys
from xml.etree import ElementTree


from splunk.clilib.bundle_paths import make_splunkhome_path
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'bin']))
sys.path.append(make_splunkhome_path(['etc', 'apps', 'splunk_secure_gateway', 'lib']))

from spacebridgeapp.dashboard.parse_helpers import get_text
from spacebridgeapp.request.app_list_request_processor import fetch_app_details
from spacebridgeapp.dashboard.dashboard_request_json import fetch_dashboard_list_json
from http import HTTPStatus
from spacebridgeapp.util.constants import PAYLOAD, STATUS, QUERY, APP_ID, SPACEBRIDGE_APP_NAME
from spacebridgeapp.messages.request_context import RequestContext
from spacebridgeapp.rest import async_base_endpoint
from spacebridgeapp.logging import setup_logging
from spacebridgeapp.data.app_list_data import App

LOGGER = setup_logging(SPACEBRIDGE_APP_NAME + "_edit_tag_handler.log", "app_dashboards_handler")


def extract_tags(content):
    if 'eai:data' not in content:
        return []

    eai_data = content.get('eai:data')
    root = ElementTree.fromstring(eai_data)
    tags_element = root.find('tags')
    tags_text = get_text(tags_element)
    tags_list = tags_text.split(',') if tags_text else []
    return tags_list


def extract_dashboard_info(dashboard):
    content = dashboard['content']
    dashboard_id = dashboard['name']
    owner = content['eai:userName']
    app_id = content['eai:appName']
    label = content['label']
    canonical_id = f'{owner}/{app_id}/{dashboard_id}'
    tags = extract_tags(content)

    return {
        'dashboard_id': dashboard_id,
        'owner': owner,
        'app_id': app_id,
        'canonical_id': canonical_id,
        'label': label,
        'tags': tags
    }


def format_dashboard_list(dashboards):
    return [extract_dashboard_info(dashboard) for dashboard in dashboards]


def format_app_details(app_details: App):
    return {
        'id': app_details.app_name,
        'name': app_details.display_app_name,
        'author': app_details.author
    }


def format_response(app_details, dashboards):
    app_details_formatted = format_app_details(app_details)
    dashboards_formatted = format_dashboard_list(dashboards)

    return {
        'app': app_details_formatted,
        'dashboards': dashboards_formatted
    }


async def fetch_dashboard_list(request_context, app_id, splunk_client):
    app_details = await fetch_app_details(request_context, app_id, splunk_client)
    _, dashboards, _ = await fetch_dashboard_list_json(request_context,
                                                       app_names=[app_id],
                                                       minimal_list=False,
                                                       async_splunk_client=splunk_client)
    return {
        PAYLOAD: format_response(app_details[0], dashboards),
        STATUS: HTTPStatus.OK
    }


class AppDashboardsHandler(async_base_endpoint.AsyncBaseRestHandler):

    async def get(self, request):
        """
        Lists one or more dashboards in the form of JSON formatted DashboardDescription messages.

        Request Parameters
            app_id  the id of the app to fetch, only supports 1 at a time
        """
        context = RequestContext.from_rest_request(request)
        app_id = request[QUERY].get(APP_ID)
        splunk_client = self.async_client_factory.splunk_client()
        response = await fetch_dashboard_list(context, app_id, splunk_client)
        return response

