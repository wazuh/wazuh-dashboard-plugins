"""
(C) 2019 Splunk Inc. All rights reserved.
"""


class _Name(object):
    def __init__(self, name):
        self.name = name


class _NoopMtlsContext(object):
    def __enter__(self):
        return _Name(None)

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


def requests_ssl_context(key_bundle):
    if key_bundle:
        return key_bundle.make_temporary_file()

    return _NoopMtlsContext()


def sb_auth_endpoint(auth_code, config):
    """
    Generate cloudgateway auth endpoint
    """

    return '{0}/api/registrations/{1}'.format(config.get_spacebridge_domain(), auth_code)


def sb_client_auth_endpoint(config):
    """
    Generate endpoint for client side registration to spacebridge
    """

    return '{0}/api/registrations'.format(config.get_spacebridge_domain())


def sb_client_auth_result_endpoint(auth_code, config):
    """
    Generate endpoint for client side registration to spacebridge
    """

    return '{0}/api/registrations/{1}/result'.format(config.get_spacebridge_domain(), auth_code)


def sb_message_endpoint(config):
    """
    Endpoint for sending messages over spacebridge
    """
    return '{0}/api/deployments/messages'.format(config.get_spacebridge_domain())


def sb_mdm_authentication_endpoint(config):
    """
    Endpoint for sending messages over spacebridge
    """
    return '{0}/api/mdm/authenticate'.format(config.get_spacebridge_domain())

def sb_auth_header(encryption_context):
    """
    Build the auth header that cloudgateway expects
    :param encryption_context:
    :return: json object containing authorization header
    """
    return encryption_context.sign_public_key(transform=encryption_context.generichash_hex)

