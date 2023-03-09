import requests

from cloudgateway.private.registration.util import requests_ssl_context
from spacebridge_protocol.http_pb2 import DeviceUnregistrationRequest, DeviceUnregistrationResponse, HttpError
from cloudgateway.private.exceptions.rest import CloudgatewayServerError


def build_device_unregister_req(device_id, encryption_context):
    """
    Build a DeviceUnregistrationRequest
    :param device_id: bytes representing device id to be unregistered
    :param encryption_context:
    :return: DeviceUnregistrationRequest Proto
    """
    unregister_proto = DeviceUnregistrationRequest()
    unregister_proto.deviceId = device_id
    unregister_proto.deploymentId = encryption_context.sign_public_key(transform=encryption_context.generichash_raw)

    return unregister_proto


def make_unregister_req(unregister_proto, sb_auth_header, config, key_bundle=None):
    """
    Initiate the unregistration request to cloud gateway
    :param unregister_proto: DeviceUnregistrationRequest proto
    :param sb_auth_header: auth header to send to cloud gateway
    :return: either return a requests response object or if there is an exception, a CloudGatewayServerError object
    """
    headers = {'Content-Type': 'application/x-protobuf', 'Authorization': str(sb_auth_header)}
    with requests_ssl_context(key_bundle) as cert:
        try:
            return requests.delete("%s/api/session" % config.get_spacebridge_domain(),
                                   headers=headers, proxies=config.get_proxies(),
                                   data=unregister_proto.SerializeToString(),
                                   cert=cert.name)
        except Exception:
            raise CloudgatewayServerError('Unable to reach Cloudgateway', 503)


def parse_sb_response(raw_response):
    """

    :param raw_response: serialized DeviceUnregistrationResponse proto
    :return:  DeviceUnregistrationResponse proto
    """

    spacebridge_response = DeviceUnregistrationResponse()
    spacebridge_response.ParseFromString(raw_response.content)

    if spacebridge_response.HasField('error') and \
            spacebridge_response.error.code != HttpError.Code.Value('ERROR_ROUTING_UNDELIVERABLE'):
        raise CloudgatewayServerError("Cloudgateway error on delete device request=%s" %
                                      spacebridge_response.error.message)

    return spacebridge_response
