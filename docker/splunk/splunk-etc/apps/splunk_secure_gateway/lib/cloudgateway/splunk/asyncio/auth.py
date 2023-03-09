
from http import HTTPStatus
from cloudgateway.splunk.auth import SplunkJWTCredentials, SplunkAuthHeader
from cloudgateway.private.util import constants
from cloudgateway.private.asyncio.clients.aio_client import AioHttpClient


class AioSplunkAuthHeader(SplunkAuthHeader):
    """
    Wrapper for a splunk session token. Returns a splunk auth header when stringified
    to be used on HTTP requests to Splunk's REST apis
    """
    def __init__(self, session_token):
        self.session_token = session_token

    def __repr__(self):
        return 'Splunk {0}'.format(self.session_token)

    async def validate(self, async_splunk_client):
        """
        Check if this auth header is valid or not against Splunk
        """
        response = await async_splunk_client.async_get_current_context(auth_header=self)
        if response.code == HTTPStatus.OK:
            return True

        return False

class AioSplunkJWTMDMCredentials(SplunkJWTCredentials):

    def __init__(self, username):
        self.username = username
        self.token = None
        self.async_client = AioHttpClient()

    async def load_jwt_token(self, system_auth, audience=constants.CLOUDGATEWAY):
        self.token = await self.fetch_jwt_token_from_session_key(self.username, system_auth, audience)

    async def fetch_jwt_token_from_session_key(self, username, system_auth_header, audience):
        """
        Creates a new JWT token for the given user

        :param username: User-supplied username
        :param session_key: Session key supplied to user from Splunk
        :param audience: User-supplied purpose of this token
        :return: JWT token for given user
        """
        url = self.jwt_token_url()
        data = self.jwt_token_data(username, audience)

        headers = {
            constants.HEADER_CONTENT_TYPE: constants.APPLICATION_JSON,
            constants.HEADER_AUTHORIZATION: '{}'.format(system_auth_header),
            constants.HEADER_CONTENT_TYPE: constants.CONTENT_TYPE_FORM_ENCODED
        }

        r = await self.async_client.async_post_request(url, None, data=data, headers=headers)

        if r.code != HTTPStatus.CREATED:
            text = await r.text()
            raise Exception('Exception creating JWT token with code={}, message={}'.format(r.code, text))

        response = await r.json()
        return response['entry'][0]['content']['token']
