from spacebridge_protocol import sb_common_pb2, websocket_pb2


def parse_signed_envelope(serialized_signed_envelope, logger):
    """Deserialize a serialized Signed Envelope Proto object

    Arguments:
        serialized_signed_envelope {[type]} -- [description]

    Returns:
        [type] -- [description]
    """

    signed_envelope = sb_common_pb2.SignedEnvelope()
    try:
        signed_envelope.ParseFromString(serialized_signed_envelope)
    except:
        logger.exception("Exception deserializing Signed Envelope")

    return signed_envelope


def parse_application_message(serialized_message, logger):
    """Deserialize a serialized Application Message object

    Arguments:
        serialized_message {bytes}

    Returns:
        ApplicationMessage Proto
    """

    application_message = websocket_pb2.ApplicationMessage()

    try:
        application_message.ParseFromString(serialized_message)
    except:
        logger.exception("Exception deserializing protobuf")

    return application_message


def parse_spacebridge_message(serialized_spacebridge_message, logger):
    """
    Deserialize spacebridge message and if it is an error message, log it.
    :param serialized_spacebridge_message: serialized SpacebridgeMessage proto
    :return: None
    """
    spacebridge_message = websocket_pb2.SpacebridgeMessage()
    try:
        spacebridge_message.ParseFromString(serialized_spacebridge_message)

        if spacebridge_message.HasField("error"):
            logger.info("Received Spacebridge Error with message=%s" % spacebridge_message.error.message)

    except Exception:
        logger.exception("Exception parsing spacebridge message")

    return spacebridge_message
