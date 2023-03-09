"""
(C) 2019 Splunk Inc. All rights reserved.
"""

import struct
import time
import atexit
import logging

from .sodium import sodium_server_pb2 as sodium
from .errors import SodiumProcessError, SodiumOperationError
from .external_process import start as start_sodium_process


INT_BIG_ENDIAN = ">i"

_PROC = start_sodium_process()


def _cleanup():
    _PROC.terminate()


atexit.register(_cleanup)


def is_alive():
    alive = True
    poll = _PROC.poll()
    if poll is not None:
        alive = False

    return alive


class SodiumClient(object):
    def __init__(self, logger=None):
        if not logger:
            logger = logging.Logger("sodium_client", level=logging.ERROR)

        self.logger = logger

    def _send_request(self, pb_msg, op_name):
        if not is_alive():
            # process has terminated
            raise SodiumProcessError()

        t1 = time.time() * 1000

        serialized = pb_msg.SerializeToString()

        size_header = struct.pack(INT_BIG_ENDIAN, len(serialized))
        _PROC.stdin.write(size_header + serialized)
        _PROC.stdin.flush()

        out_header = _PROC.stdout.read(4)
        out_size = struct.unpack(INT_BIG_ENDIAN, out_header)
        out_buf = _PROC.stdout.read(out_size[0])

        sodium_response = sodium.Response()
        sodium_response.ParseFromString(out_buf)

        t2 = time.time() * 1000
        time_taken = t2 - t1
        self.logger.info("{0} time_taken={1} ms".format(op_name, time_taken))

        return sodium_response

    def box_generate_keypair(self):
        key_pair_request = sodium.BoxKeyPairGenerateRequest()
        req = sodium.Request(boxKeyPairGenerateRequest=key_pair_request)
        res = self._send_request(req, 'box_generate_keypair')

        if res.HasField('error'):
            raise SodiumOperationError()

        return res.boxKeyPairGenerateResponse.keyPair.publicKey, res.boxKeyPairGenerateResponse.keyPair.secretKey

    def box_seal(self, plaintext, receiver_public_key):
        box_seal_request = sodium.BoxSealRequest(plaintext=plaintext, publicKey=receiver_public_key)
        req = sodium.Request(boxSealRequest=box_seal_request)
        res = self._send_request(req, 'box_seal')

        if res.HasField('error'):
            raise SodiumOperationError()

        return res.boxSealResponse.ciphertext

    def box_seal_open(self, ciphertext, self_public_key, self_secret_key):
        box_seal_open_request = sodium.BoxSealOpenRequest(ciphertext=ciphertext, keypair=sodium.KeyPair(
            publicKey=self_public_key,
            secretKey=self_secret_key
        ))

        req = sodium.Request(boxSealOpenRequest=box_seal_open_request)
        res = self._send_request(req, 'box_seal_open')

        if res.HasField('error'):
            raise SodiumOperationError()

        return res.boxSealOpenResponse.plaintext

    def box_easy(self, plaintext, sender_secret_key, receiver_public_key):
        box_easy_request = sodium.BoxEasyRequest(plaintext=plaintext,
                                                 secretKey=sender_secret_key,
                                                 publicKey=receiver_public_key)
        req = sodium.Request(boxEasyRequest=box_easy_request)
        res = self._send_request(req, 'box_easy')

        if res.HasField('error'):
            raise SodiumOperationError()

        return res.boxEasyResponse.ciphertext, res.boxEasyResponse.nonce

    def box_easy_open(self, ciphertext, nonce, sender_public_key, receiver_secret_key):
        box_easy_open_request = sodium.BoxEasyOpenRequest(ciphertext=ciphertext,
                                                          nonce=nonce,
                                                          publicKey=sender_public_key,
                                                          secretKey=receiver_secret_key)

        req = sodium.Request(boxEasyOpenRequest=box_easy_open_request)
        res = self._send_request(req, 'box_easy_open')

        if res.HasField('error'):
            raise SodiumOperationError()

        return res.boxEasyOpenResponse.plaintext

    def sign_generate_keypair(self):
        sign_keypair_request = sodium.SignKeyPairGenerateRequest()

        req = sodium.Request(signKeyPairGenerateRequest=sign_keypair_request)
        res = self._send_request(req, 'sign_generate_keypair')

        if res.HasField('error'):
            raise SodiumOperationError()

        return res.signKeyPairGenerateResponse.keyPair.publicKey, res.signKeyPairGenerateResponse.keyPair.secretKey

    def sign_detached(self, msg, sender_secret_key):
        sign_detached_request = sodium.SignDetachedRequest(message=msg, secretKey=sender_secret_key)

        req = sodium.Request(signDetachedRequest=sign_detached_request)
        res = self._send_request(req, 'sign_detached')

        if res.HasField('error'):
            raise SodiumOperationError()

        return res.signDetachedResponse.digest

    def sign_detached_verify(self, msg, signature, sender_public_key):
        sign_detached_verify_request = sodium.SignDetachedVerifyRequest(message=msg,
                                                                        signature=signature,
                                                                        publicKey=sender_public_key)

        req = sodium.Request(signDetachedVerifyRequest=sign_detached_verify_request)
        res = self._send_request(req, 'sign_detached_verify')

        if res.HasField('error'):
            raise SodiumOperationError()

        return res.signDetachedVerifyResponse.signatureMatches

    def hash_generic(self, msg):
        hashgeneric_request = sodium.HashGenericRequest(message=msg)

        req = sodium.Request(hashGenericRequest=hashgeneric_request)
        res = self._send_request(req, 'hash_generic')

        if res.HasField('error'):
            raise SodiumOperationError()

        return res.hashGenericResponse.signature

