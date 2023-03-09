"""
(C) 2019 Splunk Inc. All rights reserved.

Methods for handling encryption
"""

import struct


# just in case we ever have multiple session token formats
SESSION_HEADER_VERSION_0 = 0x00

HEADER_END = 2

SHORT_BIG_ENDIAN = ">h"


def encrypt_for_send(sodium_client, receiver_public_key, plaintext):
    ciphertext = sodium_client.box_seal(plaintext, receiver_public_key)

    return ciphertext


def decrypt_for_receive(sodium_client, self_public_key, self_private_key, ciphertext):
    plaintext = sodium_client.box_seal_open(ciphertext, self_public_key, self_private_key)

    return plaintext


def encrypt_session_token(sodium_client, session_token, encrypt_public_key, encrypt_private_key):
    """
    :param sodium_client:
    :param session_token:
    :param encrypt_public_key:
    :param encrypt_private_key:
    :return:
    """

    ciphertext, nonce = sodium_client.box_easy(session_token, encrypt_private_key, encrypt_public_key)

    nonce_len = len(nonce)

    high = SESSION_HEADER_VERSION_0 << 8
    low = nonce_len & 0xff

    header = struct.pack(SHORT_BIG_ENDIAN, high | low)

    return header + nonce + ciphertext


def decrypt_session_token(sodium_client, session_token, public_key, private_key):
    """
    :param sodium_client:
    :param session_token:
    :param public_key:
    :param private_key:
    :return:
    """

    header_str = session_token[0:HEADER_END]
    header = struct.unpack(SHORT_BIG_ENDIAN, header_str)

    nonce_len = header[0] & 0xFF
    nonce_end = nonce_len + HEADER_END

    nonce = session_token[HEADER_END:nonce_end]
    ciphertext = session_token[nonce_end:]

    return sodium_client.box_easy_open(ciphertext, nonce, public_key, private_key)


def sign_detached(sodium_client, private_key, msg):
    return sodium_client.sign_detached(msg, private_key)


def sign_verify(sodium_client, sender_public_key, msg, signature):
    is_match = sodium_client.sign_detached_verify(msg, signature, sender_public_key)

    return is_match
