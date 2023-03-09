import json
import requests

from cloudgateway.auth import SimpleUserCredentials, UserAuthCredentials
from cloudgateway.private.util import constants
from cloudgateway.private.util.tokens_util import calculate_token_info
from cloudgateway.private.util.http_status import HTTPStatus
from spacebridge_protocol import http_pb2

try:
    from splunk import rest as rest
except ImportError:
    pass

NOT_BEFORE = "+0d"
EXPIRES_ON = "+30d"


class SplunkAuthHeader(object):
    """
    Wrapper for a splunk session token. Returns a splunk auth header when stringified
    to be used on HTTP requests to Splunk's REST apis
    """

    def __init__(self, session_token):
        self.session_token = session_token

    def __repr__(self):
        return 'Splunk {0}'.format(self.session_token)

    def validate(self, async_splunk_client):
        raise NotImplementedError


class SplunkBasicCredentials(SimpleUserCredentials):
    """Basic username and password credentials wrapper which gets validated with Splunk
    """

    def validate(self):
        """validate username and password with Splunk
        """
        authenticate_splunk_credentials(self.username, self.password)


class SplunkJWTCredentials(UserAuthCredentials):
    """
    Credentials interface for Splunk JWT Tokens
    """

    def __init__(self, username):
        self.username = username
        self.token = None
        self.token_id = None

    def load_jwt_token(self, system_auth_header, audience=constants.CLOUDGATEWAY):
        """
        Creates a new JWT token for the given user

        :param username: User-supplied username
        :param session_key: Session key supplied to user from Splunk
        :param audience: User-supplied purpose of this token
        :return: JWT token for given user
        """
        url = self.jwt_token_url()
        data = self.jwt_token_data(self.username, audience)

        headers = {
            constants.HEADER_CONTENT_TYPE: constants.APPLICATION_JSON,
            constants.HEADER_AUTHORIZATION: '{}'.format(system_auth_header),
            constants.HEADER_CONTENT_TYPE: constants.CONTENT_TYPE_FORM_ENCODED
        }

        r = requests.post(url, data=data, verify=False, headers=headers)

        if r.status_code != HTTPStatus.CREATED:
            raise Exception('Exception creating JWT token with code={}, message={}'.format(r.status_code, r.text))

        self.token = r.json()['entry'][0]['content']['token']
        self.token_id = r.json()['entry'][0]['content']['id']

    def get_username(self):
        return self.username

    def jwt_token_url(self):
        return '{}services/authorization/tokens?output_mode=json'.format(rest.makeSplunkdUri())

    def validate(self):
        pass

    def get_expiration(self):
        return calculate_token_info(self.token)['exp']

    def get_token_type(self):
        return http_pb2.TokenType.Value('JWT')

    def jwt_token_data(self, username, audience):
        return {
            "name": username,
            "not_before": NOT_BEFORE,
            "audience": audience,
            "expires_on": EXPIRES_ON
        }

    def get_credentials(self):
        return json.dumps({
            'username': self.username,
            'token': self.token,
            'type': constants.JWT_TOKEN_TYPE
        })


def authenticate_splunk_credentials(username, password):
    """
    Checks whether a supplied username/password pair are valid Splunk credentials. Throws an error otherwise.

    :param username: User-supplied username
    :param password: User-supplied password
    :return: None
    """
    request_url = '{}/services/auth/login'.format(rest.makeSplunkdUri())
    body = {
        'username': username,
        'password': password
    }
    response, c = rest.simpleRequest(request_url, postargs=body, rawResult=True)
    exception = requests.RequestException()
    exception.statusCode = response.status

    if response.status == 200:
        return

    elif response.status == 401:
        exception.msg = 'Error: Supplied username or password is incorrect'
    else:
        exception.msg = 'Error: unable to authenticate client'

    raise exception
