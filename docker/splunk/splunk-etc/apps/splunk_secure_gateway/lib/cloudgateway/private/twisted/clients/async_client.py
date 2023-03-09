"""
(C) 2019 Splunk Inc. All rights reserved.

Base class for AsyncClient
"""
from twisted.internet._sslverify import ClientTLSOptions

from cloudgateway.private.twisted.clients.proxy_connect_agent import HTTPProxyConnector
from twisted.web.iweb import IPolicyForHTTPS
from twisted.internet import reactor
from twisted.internet import ssl
from twisted.internet.ssl import PrivateCertificate
from zope.interface import implementer
from treq.client import HTTPClient
from twisted.web.client import Agent
from cloudgateway.private.util.constants import HEADER_AUTHORIZATION, \
    HEADER_CONTENT_TYPE, APPLICATION_JSON


def proxy_treq(https_proxy=None):
    # Setup of agent
    if https_proxy:
        host = https_proxy['host']
        port = https_proxy['port']

        proxy = HTTPProxyConnector(proxy_host=host,
                                   proxy_port=int(port))

        agent = Agent(reactor=proxy)
    else:
        agent = Agent(reactor)

    return HTTPClient(agent)


def mtls_treq(https_proxy=None, pkcs12=None):
    @implementer(IPolicyForHTTPS)
    class MtlsContextFactory(object):
        def creatorForNetloc(self, hostname, port):
            client_cert = PrivateCertificate.loadPEM(pkcs12.pkey_pem + pkcs12.cert_pem)
            return ssl.optionsForClientTLS(pkcs12.hostname,
                                           clientCertificate=client_cert)

    # Setup of agent
    if https_proxy:
        host = https_proxy['host']
        port = https_proxy['port']

        proxy = HTTPProxyConnector(proxy_host=host,
                                   proxy_port=int(port))

        agent = Agent(reactor=proxy, contextFactory=MtlsContextFactory())
    else:
        agent = Agent(reactor, contextFactory=MtlsContextFactory())

    return HTTPClient(agent)


class AsyncClient(object):
    """
    Client for handling asynchronous requests to KV Store
    """

    def __init__(self, treq=proxy_treq()):
        """
        Our client wraps the treq http client. This is so we can provide different implementations such as providing
        a mocked implementation to make testing easier.
        :param treq: instance of treq http client
        """
        self.treq = treq

    def async_get_request(self, uri, auth_header, auth=None, params=None, headers=None, timeout=None):
        """
        Makes a asynchronous get request to a given uri
        :param uri: string representing uri to make request to
        :param auth_header: A value to supply for the Authorization header
        :param params: Optional parameters to be append as the query string to the URL
        :param headers: Optional request headers
        :param timeout: request timeout (in seconds)
        :return: result of get request
        """

        if not headers:
            headers = {HEADER_CONTENT_TYPE: APPLICATION_JSON}

        if auth_header is not None:
            headers[HEADER_AUTHORIZATION] = repr(auth_header)

        return self.treq.get(url=uri,
                             headers=headers,
                             auth=auth,
                             params=params,
                             timeout=timeout)

    def async_post_request(self, uri, auth_header, auth=None, params=None, data=None, headers=None, timeout=None):
        """
        Makes a asynchronous post request to a given uri
        :param uri: string representing uri to make request to
        :param auth_header: A value to supply for the Authorization header
        :param params: Optional parameters to be append as the query string to the URL
        :param data: Request body
        :param headers: header to send with post request.
        :param timeout: request timeout (in seconds)
        :return:
        """
        if not headers:
            headers = {HEADER_CONTENT_TYPE: APPLICATION_JSON}

        if auth_header is not None:
            headers[HEADER_AUTHORIZATION] = repr(auth_header)

        # don't log request data as username and passwords can be leaked in plaintext MSB-846

        return self.treq.post(url=uri,
                              headers=headers,
                              auth=auth,
                              params=params,
                              data=data,
                              timeout=timeout)

    def async_delete_request(self, uri, auth_header, auth=None, params=None, timeout=None):
        """
        :param uri:
        :param auth_header: A value to supply for the Authorization header
        :param params:
        :param timeout: request timeout (in seconds)
        :return:
        """

        headers = {HEADER_CONTENT_TYPE: APPLICATION_JSON, HEADER_AUTHORIZATION: repr(auth_header)}

        return self.treq.delete(url=uri,
                                headers=headers,
                                auth=auth,
                                params=params,
                                timeout=timeout)
