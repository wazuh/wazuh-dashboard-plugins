from cloudgateway.key_bundle import KeyBundle
from cloudgateway.splunk.clients.splunk_client import fetch_sensitive_data
from spacebridgeapp.util.constants import MTLS_CERT, MTLS_KEY, SPACEBRIDGE_APP_NAME
from spacebridgeapp.rest.clients.async_spacebridge_client import AsyncSpacebridgeClient


def build_key_bundle(session_key):
    mtls_cert = fetch_sensitive_data(session_key, MTLS_CERT, app_name=SPACEBRIDGE_APP_NAME)
    mtls_key = fetch_sensitive_data(session_key, MTLS_KEY, app_name=SPACEBRIDGE_APP_NAME)
    key_bundle = KeyBundle(mtls_cert, mtls_key)
    return key_bundle


def build_mtls_spacebridge_client(session_key):
    key_bundle = build_key_bundle(session_key)

    return AsyncSpacebridgeClient(key_bundle)
