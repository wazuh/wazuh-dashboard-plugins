"""
(C) 2020 Splunk Inc. All rights reserved.

Module to process Token Refresh Request
"""
import sys
import json
from http import HTTPStatus
from datetime import datetime, timedelta

from spacebridgeapp.rest.clients.async_kvstore_client import AsyncKvStoreClient
from spacebridgeapp.request.request_processor import JWTAuthHeader, async_is_valid_session_token
from spacebridgeapp.util import constants
from spacebridgeapp.logging import setup_logging
from cloudgateway.private.util.tokens_util import calculate_token_info
from cloudgateway.splunk.auth import SplunkJWTCredentials
from splapp_protocol import request_pb2


LOGGER = setup_logging(constants.SPACEBRIDGE_APP_NAME + "token_refresh_request_processor.log",
                       "token_refresh_request_processor")

async def process_token_refresh_request(request_context,
                                        client_single_request,
                                        server_single_response,
                                        async_splunk_client,
                                        encryption_context,
                                        async_kvstore_client: AsyncKvStoreClient):

    if not isinstance(request_context.auth_header, JWTAuthHeader):
        secured_session_token = encryption_context.secure_session_token(request_context.auth_header.session_token)
        server_single_response.tokenRefreshResponse.sessionToken = secured_session_token
        server_single_response.tokenRefreshResponse.tokenExpiresAt = 0
        server_single_response.tokenRefreshResponse.code = request_pb2.TokenRefreshResponse.SUCCESS
        return

    session_token = request_context.auth_header.token
    system_auth_header = request_context.system_auth_header
    valid_request = await async_is_valid_session_token(request_context.current_user, session_token, async_splunk_client)

    if not valid_request:
        server_single_response.tokenRefreshResponse.code = request_pb2.TokenRefreshResponse.ERROR_TOKEN_INVALID
        return


    # Verify token is not already slated for deletion
    old_token_info = calculate_token_info(session_token)
    old_token_id = old_token_info['jti']
    delete_token_lookup = await async_kvstore_client.async_kvstore_get_request(
        collection=constants.DELETE_TOKENS_COLLECTION_NAME,
        params={"query": json.dumps({"token_id":old_token_id})},
        auth_header=request_context.auth_header
    )

    if delete_token_lookup.status == HTTPStatus.OK:
        tokens = await delete_token_lookup.json()
        if len(tokens) > 0:
            LOGGER.info(f"Token {old_token_id} found in delete_tokens collection. Unable to create new token.")
            server_single_response.tokenRefreshResponse.code = request_pb2.TokenRefreshResponse.ERROR_TOKEN_INVALID
            return            
    else:
        msg = await delete_token_lookup.text()
        LOGGER.warning(f"Token lookup failed. Status: {delete_token_lookup.status} Message: {msg}")

    # Generate new JWT token
    new_JWT = await async_splunk_client.async_create_new_JWT_token(request_context.current_user, system_auth_header)
    if new_JWT.code not in {HTTPStatus.CREATED, HTTPStatus.OK}:
        error = await new_JWT.text()
        LOGGER.warning("Failed to create new token status_code={}, error={}".format(new_JWT.code, error))
        server_single_response.tokenRefreshResponse.code = request_pb2.TokenRefreshResponse.ERROR_CREATING_TOKEN
        return

    new_JWT_json = await new_JWT.json()
    new_jwt_credentials = SplunkJWTCredentials(request_context.current_user)
    new_jwt_credentials.token = new_JWT_json['entry'][0]['content']['token']

    # Get token expiry
    new_token_info = calculate_token_info(new_jwt_credentials.token)
    server_single_response.tokenRefreshResponse.tokenExpiresAt = new_token_info['exp']

    # Encrypt this token
    new_session_token = new_jwt_credentials.get_credentials() if sys.version_info < (3, 0) else str.encode(new_jwt_credentials.get_credentials())
    encrypted_token = encryption_context.secure_session_token(new_session_token)
    server_single_response.tokenRefreshResponse.sessionToken = encrypted_token
    server_single_response.tokenRefreshResponse.code = request_pb2.TokenRefreshResponse.SUCCESS

    # Insert old token to the delete_tokens collection
    # TTL set for one hour from now so concurrent requests that could be using the old token complete successfully
    old_token_expiry = datetime.now() + timedelta(hours=1)
    delete_token_payload = {"token_id": old_token_id,
                       "user": request_context.current_user,
                       "expires_at": old_token_expiry.timestamp()}

    response = await async_kvstore_client.async_kvstore_post_request(collection=constants.DELETE_TOKENS_COLLECTION_NAME,
                                                                     data=json.dumps(delete_token_payload),
                                                                     auth_header=request_context.system_auth_header)

    if response.status != HTTPStatus.CREATED:
        msg = await response.text()
        LOGGER.error(f"Failed to store old token in {constants.DELETE_TOKENS_COLLECTION_NAME} collection.\nStatus: {response.status}\nMessage: {msg}")
    else:
        LOGGER.info(f"Added token {old_token_id} to {constants.DELETE_TOKENS_COLLECTION_NAME} collection")
                                                                     
    LOGGER.info(f"OLD_TOKEN_INFO = {old_token_info}, session_token = {session_token}, delete_token_payload = {delete_token_payload}")
