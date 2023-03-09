"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.

Module providing client for making asynchronous requests to Splunk Core
"""
import json
from http import HTTPStatus
from spacebridgeapp.rest.clients.async_non_ssl_client import AsyncNonSslClient
from spacebridgeapp.rest.registration.util import AuthMethod
from spacebridgeapp.request.request_processor import JWTAuthHeader
from spacebridgeapp.util import constants
from spacebridgeapp.util.string_utils import append_path_to_uri

from spacebridgeapp.logging import setup_logging

import urllib.parse as urllib

LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "_async_splunk_client.log", "async_splunk_client")

HISTORY = '/history'
DISPATCH = '/dispatch'


class AsyncSplunkClient(AsyncNonSslClient):
    """
    Client for handling asynchronous requests to Splunk API
    """

    def __init__(self, uri):
        """
        :param uri: string representing uri to make request to
        """
        self.uri = uri
        super(AsyncSplunkClient, self).__init__()

    def async_get_app_list_request(self, auth_header, params=None, app_id=None):
        """
        Make async request to Splunk /apps/local api

        :param auth_header: Value for the Authorization header
        :param params: [tuples]
        :param app_id: specify this if you would like to get the details for a specific app
        :return: async request object
        """
        uri = self.get_app_list_uri(app_id)
        return self.async_get_request(uri=uri, params=params, auth_header=auth_header)

    def get_app_list_uri(self, app_id=None):
        """
        Construct Splunk /apps/local api to retrieve app list
        https://docs.splunk.com/Documentation/Splunk/7.2.5/RESTREF/RESTapps#apps.2Flocal

        :return:
        """
        if app_id:
            return self.get_rest_endpoint_uri(f'apps/local/{app_id}')

        return self.get_rest_endpoint_uri('apps/local')

    def async_get_dashboard_list_request(self, auth_header, owner="-", app_name="-", params=None):
        """
        Make async request to Splunk data/ui/views api

        :param auth_header: Value for the Authorization header
        :param owner: [string]
        :param app_name: [string]
        :param params: [tuples]
        :return: async request object
        """
        uri = self.get_dashboard_list_uri(owner, app_name)
        return self.async_get_request(uri=uri, params=params, auth_header=auth_header)

    async def async_get_all_users(self, auth_header):
        uri = '%sservices/authentication/users' % self.uri

        response = await self.async_get_request(uri, auth_header=auth_header, params={'output_mode': 'json'})

        response_code = HTTPStatus.OK
        users = []

        if response.code == HTTPStatus.OK:
            parsed = await response.json()
            users = list(map((lambda x: x['name']), parsed['entry']))
        else:
            response_code = response.code

        result_tuple = (response_code, users)

        return result_tuple

    async def async_get_sign_credentials(self, auth_header):
        """
        Fetch public and private keys necessary for signing messages. Needed for sending push notifications which
        don't have access to a system auth token to fetch the keys from passwords.conf
        """
        uri = '{}services/ssg/cloudgateway/sign_credentials'.format(self.uri)

        response = await self.async_get_request(uri, auth_header=auth_header, params={'output_mode': 'json'})

        response_code = HTTPStatus.OK

        if response.code == HTTPStatus.OK:
            parsed = await response.json()
        else:
            response_code = response.code
            parsed = {}

        result_tuple = (response_code, parsed)

        return result_tuple

    async def async_get_users_roles_mapping(self, auth_header):
        """
        Returns a map of all Splunk users viewable using the permissions of the supplied authtoken to a list of the
        roles the user belongs to
        """
        uri = '{}services/authentication/users'.format(self.uri)
        params = {
            'count': 0,
            'output_mode': 'json',
        }

        response_code = HTTPStatus.OK
        user_role_mapping = {}
        response = await self.async_get_request(uri, auth_header=auth_header, params=params)

        if response.code == HTTPStatus.OK:
            parsed = await response.json()
            user_role_mapping = {entry['name']: entry["content"]['roles'] for entry in parsed["entry"]}
        else:
            response_code = response.code

        result_tuple = (response_code, user_role_mapping)
        return result_tuple

    def async_get_viewable_roles(self, auth_header):
        uri = '{}services/authorization/roles?output_mode=json'.format(self.uri)
        return self.async_get_request(uri, auth_header=auth_header)

    def async_get_role(self, auth_header, role_name):
        uri = '{splunkd_uri}services/authorization/roles/{role_name}?output_mode=json'.format(
            splunkd_uri=self.uri, role_name=role_name)
        return self.async_get_request(uri=uri, auth_header=auth_header)

    def get_dashboard_list_uri(self, owner, app_name):
        """
        Construct Splunk data/ui/views api to retrieve dashboard list
        http://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTknowledge#data.2Fui.2Fviews

        :param owner:
        :param app_name:
        :return:
        """
        return self.get_namespaced_rest_endpoint_uri(f'{owner}/{app_name}/data/ui/views')

    def async_get_dashboard_request(self, auth_header, owner="-", app_name="search", dashboard_name=None,
                                    params=None):
        """
        Make async request to Splunk data/ui/views/[dashboard_name]
        :param owner:
        :param app_name:
        :param dashboard_name:
        :param auth_header: Value for the Authorization header
        :param params:
        :return:
        """
        uri = self.get_dashboard_uri(owner, app_name, dashboard_name)
        return self.async_get_request(uri=uri, params=params, auth_header=auth_header)

    def get_dashboard_uri(self, owner, app_name, dashboard_name):
        """
        Construct Splunk data/ui/views/[dashboard_name] api to retrieve dashboard
        http://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTknowledge#data.2Fui.2Fviews.2F.7Bname.7D

        :param owner:
        :param app_name:
        :param dashboard_name:
        :return:
        """
        return self.get_namespaced_rest_endpoint_uri(f'{owner}/{app_name}/data/ui/views/{dashboard_name}')

    def async_ar_workspace_get_request(self, auth_header, dashboard_name=''):
        """
        Make async get request to Splunk services/kvstore/ar_workspace rest API
        """
        uri = self.get_ar_workspace_uri()
        params = {'dashboard_id': dashboard_name}
        return self.async_get_request(uri=uri, params=params, auth_header=auth_header)

    def async_ar_workspace_set_request(self, auth_header, dashboard_name='', workspace_data=''):
        """
        Make async post request to Splunk services/kvstore/ar_workspace rest API
        """
        uri = self.get_ar_workspace_uri()
        params = {'dashboard_id': dashboard_name}
        return self.async_post_request(uri=uri, params=params, data=workspace_data, auth_header=auth_header)

    def get_ar_workspace_uri(self):
        """ Construct URI for the ar_workspaces REST API, for reading and writing ar_workspace data
        :return:
        """
        return self.get_rest_endpoint_uri('kvstore/ar_workspace')

    def async_get_search_data_request(self, auth_header, owner='admin', app_name='search', data=''):
        """
        Call Splunk API to retrieve visualization data asynchronously
        """
        uri = self.get_search_data_uri(owner, app_name)
        return self.async_post_request(uri=uri, data=data, auth_header=auth_header)

    def get_search_data_uri(self, owner, app_name):
        """
        Construct uri for synchronous search query
        http://docs.splunk.com/Documentation/Splunk/7.1.2/RESTREF/RESTsearch#search.2Fjobs.2Fexport
        """
        return self.get_namespaced_rest_endpoint_uri(f'{owner}/{app_name}/search/jobs')

    def async_get_search_job_request(self, auth_header, owner='admin', app_name='search', search_id='',
                                     params=None):
        """
        Make async call to get search job metadata
        """
        uri = self.get_search_job_uri(owner, app_name, search_id)
        return self.async_get_request(uri=uri, params=params, auth_header=auth_header)

    def async_delete_search_job_request(self, auth_header, owner='admin', app_name='search', search_id='',
                                        params=None):
        """
        Make async call to get search job metadata
        """
        uri = self.get_search_job_uri(owner, app_name, search_id)
        return self.async_delete_request(uri=uri, params=params, auth_header=auth_header)

    def get_search_job_uri(self, owner, app_name, sid):
        """
        Construct uri to search job by sid
        http://docs.splunk.com/Documentation/Splunk/7.1.2/RESTREF/RESTsearch#search.2Fjobs.2F.7Bsearch_id.7D
        """
        return self.get_namespaced_rest_endpoint_uri(f'{owner}/{app_name}/search/jobs/{sid}')

    def async_get_search_job_results_preview_request(self, auth_header, owner='admin', app_name='search', search_id='',
                                                     params=None):
        """
        Make async call to get search job results
        """
        uri = self.get_search_job_results_preview_uri(owner, app_name, search_id)
        return self.async_get_request(uri=uri, params=params, auth_header=auth_header)

    def get_search_job_results_preview_uri(self, owner, app_name, sid):
        """
        Construct uri to search job results by sid
        http://docs.splunk.com/Documentation/Splunk/7.1.2/RESTREF/RESTsearch#search.2Fjobs.2F.7Bsearch_id.7D.2Fresults_preview
        """
        return self.get_namespaced_rest_endpoint_uri(f'{owner}/{app_name}/search/jobs/{sid}/results_preview')

    def get_login_uri(self):
        """
        Construct uri for the login api which returns a splunk cookie using username and password info
        :return: uri string
        """
        return self.get_rest_endpoint_uri('auth/login?output_mode=json', encoded=False)

    def async_get_splunk_cookie(self, username, password):
        """
        Get a user's splunk cookie by hitting the 'auth/login' api.
        Reference: http://docs.splunk.com/Documentation/Splunk/7.0.3/RESTREF/RESTaccess#auth.2Flogin
        """
        uri = self.get_login_uri()
        data = {'username': username, 'password': password}
        return self.async_post_request(uri, data=data, auth_header=None)

    def get_token_uri(self, token_id=""):
        """
        Construct uri for the tokens api which returns user's token info
        :return: uri string
        """
        return self.get_rest_endpoint_uri(f'authorization/tokens/{token_id}')

    def async_get_JWT_validation(self, username, auth_header):
        """
        Validate JWT token by hitting the 'authorization/tokens' api successfully
        """
        uri = self.get_token_uri()
        params = {'output_mode': 'json', 'username': username}
        return self.async_get_request(uri, params=params, auth_header=auth_header)

    def async_create_new_JWT_token(self, username, auth_header):
        """
        Create new JWT token
        :param username:
        :param auth_header:
        :return:
        """
        uri = self.get_token_uri()
        data = {
            "name": username,
            "not_before": "+0d",
            "audience": constants.CLOUDGATEWAY,
            "expires_on": "+14d"
        }
        params = {'output_mode': 'json'}
        return self.async_post_request(uri, auth_header=auth_header, data=data, params=params)

    def async_delete_old_JWT_token(self, username, id, auth_header):
        """
        Delete JWT token
        :param id:
        :param auth_header:
        :return:
        """
        uri = self.get_token_uri(username)
        params = {
            "id": id
        }
        return self.async_delete_request(uri, auth_header=auth_header, params=params)

    def async_get_app_info(self, app_name, auth_header, params=None):
        """
        Make async request to Splunk /apps/local/[app_name] to retrieve friendly app name

        :param app_name:
        :param auth_header: Value for the Authorization header
        :param params:
        :return:
        """
        uri = self.get_app_info_uri(app_name)
        return self.async_get_request(uri=uri, params=params, auth_header=auth_header)

    def get_app_info_uri(self, app_name):
        """
        List information about the {app_name} app.
        http://docs.splunk.com/Documentation/Splunk/7.1.2/RESTREF/RESTapps#apps.2Flocal.2F.7Bname.7D
        """
        return self.get_rest_endpoint_uri(f'apps/local/{app_name}?output_mode=json', encoded=False)

    def async_get_current_context(self, auth_header):
        """
        Make async request to Splunk /authentication/current-context api to retrieve current user's context

        """
        uri = self.get_current_context_uri()
        return self.async_get_request(uri=uri, auth_header=auth_header)

    def get_current_context_uri(self):
        """
        Construct uri for the current-context api which returns the user information for the current context
        http://docs.splunk.com/Documentation/Splunk/7.1.2/RESTREF/RESTaccess#authentication.2Fcurrent-context
        """
        return self.get_rest_endpoint_uri('authentication/current-context?output_mode=json', encoded=False)

    def async_get_saved_searches(self, auth_header, owner, app_name, ref):
        """
        Make async get request to Splunk /saved/searches/{ref} to retrieve saved search metadata
        """
        params = {'output_mode': 'json', 'count': 0}
        rest_uri = self.get_saved_searches_uri(owner, app_name, ref)
        return self.async_get_request(uri=rest_uri, params=params, auth_header=auth_header)

    def async_get_saved_searches_history(self, auth_header, owner, app_name, ref):
        """
        Make async get request to Splunk /saved/searches/{ref}/history to retrieve saved search history
        """
        # Params will get last scheduled saved_search executed
        params = {'output_mode': 'json',
                  'count': '1',
                  'sort_dir': 'desc',
                  'sort_key': 'start',
                  'search': '(isScheduled=true AND (isDone=true OR isRealTimeSearch=true))'}
        rest_uri = self.get_saved_searches_uri(owner, app_name, ref, HISTORY)
        return self.async_get_request(uri=rest_uri, params=params, auth_header=auth_header)

    def async_post_saved_searches_dispatch(self, auth_header, owner, app_name, ref, data=None):
        """
        Make async post request to Splunk /saved/searches/{ref}/dispatch to trigger saved search job
        """
        rest_uri = self.get_saved_searches_uri(owner, app_name, ref, DISPATCH)
        return self.async_post_request(uri=rest_uri, data=data, auth_header=auth_header)

    def get_saved_searches_uri(self, owner, app_name, ref, path=''):
        """
        Construct uri for saved searches by ref
        https://docs.splunk.com/Documentation/Splunk/7.1.2/RESTREF/RESTsearch#saved.2Fsearches.2F.7Bname.7D
        """
        # servicesNS can not dispatch searches with no app context
        if app_name is None or app_name == '-':
            return self.get_rest_endpoint_uri(f'saved/searches/{ref}{path}')
        return self.get_namespaced_rest_endpoint_uri(f'{owner}/{app_name}/saved/searches/{ref}{path}')

    def get_rest_endpoint_uri(self, path, encoded=True):
        """
        Create uri for splunk custom rest endpoints
        """
        return append_path_to_uri(self.uri, f'services/{path}', encoded=encoded)

    def get_namespaced_rest_endpoint_uri(self, path, encoded=True):
        """
        Create uri for splunk custom rest endpoints
        """

        return append_path_to_uri(self.uri, f'servicesNS/{path}', encoded=encoded)


    def async_get_deployment_info(self, auth_header):
        """
        Fetch information from the deployment_info endpoint which contains information such as the splapp's public
        keys, mdm public keys, etc
        :param auth_header: auth header used for authentication to kvstore
        :return (Dict} containing deployment information
        """
        uri = self.get_rest_endpoint_uri('ssg/kvstore/deployment_info')
        return self.async_get_request(uri=uri, auth_header=auth_header)

    def async_get_registration_query(self, auth_header, auth_code, device_name):
        """
        Makes a call to the handler which is called by the registration page when opening the login modal
        when registering a new device


        :param auth_code: auth code used for registration to spacebridge
        :param device_name: device name being registered
        :return: Temp key for temporary record saved in KVStore and confirmation code
        """
        uri = self.get_rest_endpoint_uri('ssg/registration/query')
        params = {'auth_code': auth_code,
                  'device_name': device_name}

        return self.async_get_request(uri=uri, params=params, auth_header=auth_header)

    def async_post_registration_confirmation(self, auth_header, auth_code, temp_key, device_name):
        """
        Makes a call to the handler which is called by the registration page when the user completes the confirmation
        code/login modal
        """

        params = {'auth_code': auth_code, 'self_register': 'false'}
        uri = self.get_rest_endpoint_uri('ssg/registration/confirmation')
        if isinstance(auth_header, JWTAuthHeader):
            params['auth_method'] = AuthMethod.SAML.value
            data = json.dumps({'temp_key': temp_key})
        elif all(hasattr(auth_header, attr) for attr in ('username', 'password')):
            # TODO: Unclear if device_name is actualy used
            params['auth_method'] = AuthMethod.LOCAL_LDAP.value
            data = json.dumps({'username': auth_header.username,
                               'password': auth_header.password,
                               'temp_key': temp_key,
                               'device_name': device_name})
        else:
            raise TypeError('Unsupported auth header type')

        return self.async_post_request(uri=uri, params=params, data=data, auth_header=auth_header)

    def async_create_role(self, auth_header, name, imported_roles=None, capabilities=None):
        """Creates a new Splunk role with the given name, inherited roles, and capabilities."""
        # Note that we do not JSON serialize the payload. This endpoint only accepts data in a
        # application/x-www-form-urlencoded body.
        data = {'name': name}
        if imported_roles:
            data['imported_roles'] = imported_roles
        if capabilities:
            data['capabilities'] = capabilities
        return self.async_post_request(uri=self.get_rest_endpoint_uri('authorization/roles?output_mode=json', encoded=False),
                                       auth_header=auth_header, data=data)

    def async_update_role(self, auth_header, name, imported_roles=None, capabilities=None):
        """Updates an existing Splunk role with the given parameters."""
        # We check against None in this case because we want to explicitly allow callers to set imported roles or
        # capabilities to an empty list. We cannot use an empty list if either field is None because we would be erasing
        # any imported roles and capabilities already associated with the given role.
        #
        # Note that we do not JSON serialize the payload. This endpoint only accepts data in a
        # application/x-www-form-urlencoded body.
        data = {}
        if imported_roles is not None:
            data['imported_roles'] = imported_roles or ''
        if capabilities is not None:
            data['capabilities'] = capabilities or ''

        if not data:
            raise ValueError('Must specify at least one of imported_roles or capabilities')

        uri = self.get_rest_endpoint_uri('authorization/roles/{name}?output_mode=json'.format(name=name), encoded=False)
        return self.async_post_request(uri=uri, auth_header=auth_header, data=data)

    def async_delete_role(self, auth_header, name):
        """Deletes a role by name."""
        uri = self.get_rest_endpoint_uri('authorization/roles/{name}?output_mode=json'.format(name=name), encoded=False)
        return self.async_delete_request(uri=uri, auth_header=auth_header)

    def async_fetch_companion_apps(self, auth_header, app_id=None):
        if app_id:
            uri = '{}services/ssg/registration/companion_app/{}'.format(self.uri, app_id)
        else:
            uri = '{}services/ssg/registration/companion_app'.format(self.uri)
        return self.async_get_request(uri=uri, auth_header=auth_header)

    def get_server_settings_uri(self):
        return "{}/services/server/settings".format(self.uri)

    def async_get_server_settings(self, auth_header):
        uri = self.get_server_settings_uri()
        return self.async_get_request(uri=uri, auth_header=auth_header, params={'output_mode': 'json'})

    def async_get_server_info(self, auth_header):
        """
        Async api call to get /server/info
        :param auth_header:
        :return:
        """
        uri = '{}/services/server/info'.format(self.uri)
        return self.async_get_request(uri=uri, auth_header=auth_header, params={'output_mode': 'json'})

    async def async_get_splunk_version(self, auth_header):
        """
        Helper method in Splunk service to get the Splunk Version
        :param auth_header:
        :return:
        """
        response = await self.async_get_server_info(auth_header)

        if response.code == HTTPStatus.OK:
            response_json = await response.json()

            generator = response_json.get('generator')
            if generator:
                return generator.get('version')
        return None

    def get_search_ast_url(self):
        return "{}servicesNS/admin/search/search/ast".format(self.uri)

    def async_post_search_ast(self, auth_header, search_query):
        uri = self.get_search_ast_url()

        form_data = {
            'spl': search_query
        }
        form_data_jsn = json.dumps(form_data)

        params = {'output_mode': 'json'}
        return self.async_post_request(uri=uri, auth_header=auth_header, data=form_data_jsn, params=params)
