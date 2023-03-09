#!/usr/bin/env python2
# https://github.com/stef/pysodium/blob/master/LICENSE.txt
"""
Wrapper for libsodium library

Copyright (c) 2013-2014, Marsiske Stefan.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.

    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"""

import ctypes
import ctypes.util
import os

sodium = None

try:
    sodium = ctypes.cdll.LoadLibrary(ctypes.util.find_library('sodium') or ctypes.util.find_library('libsodium'))
except TypeError:
    pass

# If system library is not available, use embedded one
if not sodium or not sodium._name:
    curr_path = os.path.dirname(os.path.realpath(__file__))
    lib_dir = os.path.join(curr_path, 'sharedlibs')

    import platform

    ext_hash = {'darwin': 'dylib', 'windows': 'dll', 'linux': 'so'}
    try:
        ext = ext_hash.get(platform.system().lower())
    except KeyError:
        import sys

        raise RuntimeError('Platform not supported %', platform.system().lower())
        sys.exit(1)

    lib_name = 'libsodium.{}'.format(ext)
    lib = os.path.join(lib_dir, lib_name)
    sodium = ctypes.cdll.LoadLibrary(lib)

if not sodium._name:
    raise ValueError('Unable to find libsodium')

sodium.sodium_version_string.restype = ctypes.c_char_p

try:
    sodium_major = int(sodium.sodium_version_string().decode('utf8').split('.')[0])
    sodium_minor = int(sodium.sodium_version_string().decode('utf8').split('.')[1])
    sodium_patch = int(sodium.sodium_version_string().decode('utf8').split('.')[2])
except (IndexError, ValueError):
    raise ValueError('Unable to parse version string from libsodium')

def sodium_version_check(major, minor, patch):
    """Check if the current libsodium version is greater or equal to the supplied one
    """
    if major > sodium_major:
        return False
    if major == sodium_major and minor > sodium_minor:
        return False
    if major == sodium_major and minor == sodium_minor and patch > sodium_patch:
        return False
    return True

def sodium_version(major, minor, patch):
    def decorator(func):
        def wrapper(*args, **kwargs):
            if sodium_version_check(major, minor, patch) == False:
                raise ValueError('Unavailable in this libsodium version')
            return func(*args, **kwargs)
        return wrapper
    return decorator

def encode_strings(func):
    """
    This decorator forces the encoding of str function parameters to UTF-8
    to elliminate the differences between Python 3.x and Python 2.x. The only
    caveat is that bytes and str are both str types in Python 2.x so it is
    possible for the encode() function to fail. It is OK for us to accept that
    failure, hence the pass in the except block.

    Use this decorator on any functions that can take strings as parameters
    such as crypto_pwhash().
    """
    def wrapper(*args, **kwargs):
        largs = []
        for arg in args:
            if isinstance(arg, str):
                try:
                    arg = arg.encode(encoding='utf-8')
                except:
                    pass
            largs.append(arg)
        for k in kwargs.keys():
            if isinstance(kwargs[k], str):
                try:
                    kwargs[k] = kwargs[k].encode(encoding='utf-8')
                except:
                    pass
        return func(*largs, **kwargs)
    return wrapper

sodium.crypto_pwhash_scryptsalsa208sha256_strprefix.restype = ctypes.c_char_p

crypto_auth_KEYBYTES = sodium.crypto_auth_keybytes()
crypto_auth_BYTES = sodium.crypto_auth_bytes()
crypto_box_NONCEBYTES = sodium.crypto_box_noncebytes()
crypto_box_BEFORENMBYTES = sodium.crypto_box_beforenmbytes()
crypto_box_PUBLICKEYBYTES = sodium.crypto_box_publickeybytes()
crypto_box_SECRETKEYBYTES = sodium.crypto_box_secretkeybytes()
crypto_box_ZEROBYTES = sodium.crypto_box_zerobytes()
crypto_box_BOXZEROBYTES = sodium.crypto_box_boxzerobytes()
crypto_box_MACBYTES = sodium.crypto_box_macbytes()
crypto_box_SEALBYTES = sodium.crypto_box_sealbytes()
crypto_box_SEEDBYTES = sodium.crypto_box_seedbytes()
crypto_secretbox_KEYBYTES = sodium.crypto_secretbox_keybytes()
crypto_secretbox_NONCEBYTES = sodium.crypto_secretbox_noncebytes()
crypto_secretbox_ZEROBYTES = sodium.crypto_secretbox_zerobytes()
crypto_secretbox_BOXZEROBYTES = sodium.crypto_secretbox_boxzerobytes()
crypto_secretbox_MACBYTES = sodium.crypto_secretbox_macbytes()
crypto_sign_PUBLICKEYBYTES = sodium.crypto_sign_publickeybytes()
crypto_sign_SECRETKEYBYTES = sodium.crypto_sign_secretkeybytes()
crypto_sign_SEEDBYTES = sodium.crypto_sign_seedbytes()
crypto_sign_BYTES = sodium.crypto_sign_bytes()
crypto_sign_ed25519_SECRETKEYBYTES = sodium.crypto_sign_ed25519_secretkeybytes()
crypto_sign_ed25519_PUBLICKEYBYTES = sodium.crypto_sign_ed25519_publickeybytes()
crypto_stream_KEYBYTES = sodium.crypto_stream_keybytes()
crypto_stream_NONCEBYTES = sodium.crypto_stream_noncebytes()
crypto_stream_chacha20_NONCEBYTES = sodium.crypto_stream_chacha20_noncebytes()
crypto_stream_chacha20_KEYBYTES = sodium.crypto_stream_chacha20_keybytes()
crypto_generichash_KEYBYTES_MAX = sodium.crypto_generichash_keybytes_max()
crypto_generichash_BYTES = sodium.crypto_generichash_bytes()
crypto_generichash_BYTES_MIN = sodium.crypto_generichash_bytes_min()
crypto_generichash_BYTES_MAX = sodium.crypto_generichash_bytes_max()
crypto_generichash_STATEBYTES = sodium.crypto_generichash_statebytes()
crypto_scalarmult_curve25519_BYTES = sodium.crypto_scalarmult_curve25519_bytes()
crypto_scalarmult_BYTES = sodium.crypto_scalarmult_bytes()
crypto_scalarmult_SCALARBYTES = sodium.crypto_scalarmult_curve25519_scalarbytes()
crypto_generichash_blake2b_KEYBYTES_MAX = sodium.crypto_generichash_blake2b_keybytes_max()
crypto_generichash_blake2b_BYTES = sodium.crypto_generichash_blake2b_bytes()
crypto_generichash_blake2b_BYTES_MIN = sodium.crypto_generichash_blake2b_bytes_min()
crypto_generichash_blake2b_BYTES_MAX = sodium.crypto_generichash_blake2b_bytes_max()
crypto_generichash_blake2b_SALTBYTES = sodium.crypto_generichash_blake2b_saltbytes()
crypto_generichash_blake2b_PERSONALBYTES = sodium.crypto_generichash_blake2b_personalbytes()
crypto_pwhash_scryptsalsa208sha256_SALTBYTES = sodium.crypto_pwhash_scryptsalsa208sha256_saltbytes()
crypto_pwhash_scryptsalsa208sha256_STRBYTES = sodium.crypto_pwhash_scryptsalsa208sha256_strbytes()
crypto_pwhash_scryptsalsa208sha256_STRPREFIX = sodium.crypto_pwhash_scryptsalsa208sha256_strprefix()
crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_INTERACTIVE = sodium.crypto_pwhash_scryptsalsa208sha256_opslimit_interactive()
crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_INTERACTIVE = sodium.crypto_pwhash_scryptsalsa208sha256_memlimit_interactive()
crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_SENSITIVE = sodium.crypto_pwhash_scryptsalsa208sha256_opslimit_sensitive()
crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_SENSITIVE = sodium.crypto_pwhash_scryptsalsa208sha256_memlimit_sensitive()
crypto_hash_sha256_BYTES = sodium.crypto_hash_sha256_bytes()
crypto_hash_sha512_BYTES = sodium.crypto_hash_sha512_bytes()
crypto_aead_chacha20poly1305_KEYBYTES = sodium.crypto_aead_chacha20poly1305_keybytes()
crypto_aead_chacha20poly1305_NPUBBYTES = sodium.crypto_aead_chacha20poly1305_npubbytes()
crypto_aead_chacha20poly1305_NONCEBYTES = crypto_aead_chacha20poly1305_NPUBBYTES
crypto_aead_chacha20poly1305_ABYTES = sodium.crypto_aead_chacha20poly1305_abytes()

if sodium_version_check(1, 0, 9):
    crypto_aead_chacha20poly1305_ietf_KEYBYTES = sodium.crypto_aead_chacha20poly1305_ietf_keybytes()
    crypto_aead_chacha20poly1305_ietf_NPUBBYTES = sodium.crypto_aead_chacha20poly1305_ietf_npubbytes()
    crypto_aead_chacha20poly1305_ietf_ABYTES = sodium.crypto_aead_chacha20poly1305_ietf_abytes()
    crypto_pwhash_SALTBYTES = sodium.crypto_pwhash_saltbytes()
    crypto_pwhash_STRBYTES = sodium.crypto_pwhash_strbytes()
    crypto_pwhash_OPSLIMIT_INTERACTIVE = sodium.crypto_pwhash_opslimit_interactive()
    crypto_pwhash_MEMLIMIT_INTERACTIVE = sodium.crypto_pwhash_memlimit_interactive()
    crypto_pwhash_OPSLIMIT_MODERATE = sodium.crypto_pwhash_opslimit_moderate()
    crypto_pwhash_MEMLIMIT_MODERATE = sodium.crypto_pwhash_memlimit_moderate()
    crypto_pwhash_OPSLIMIT_SENSITIVE = sodium.crypto_pwhash_opslimit_sensitive()
    crypto_pwhash_MEMLIMIT_SENSITIVE = sodium.crypto_pwhash_memlimit_sensitive()
    crypto_pwhash_ALG_DEFAULT = sodium.crypto_pwhash_alg_default()
    crypto_pwhash_ALG_ARGON2I13 = sodium.crypto_pwhash_alg_argon2i13()
    crypto_pwhash_argon2i_OPSLIMIT_INTERACTIVE = sodium.crypto_pwhash_argon2i_opslimit_interactive()
    crypto_pwhash_argon2i_MEMLIMIT_INTERACTIVE = sodium.crypto_pwhash_argon2i_memlimit_interactive()
    crypto_pwhash_argon2i_OPSLIMIT_MODERATE = sodium.crypto_pwhash_argon2i_opslimit_moderate()
    crypto_pwhash_argon2i_MEMLIMIT_MODERATE = sodium.crypto_pwhash_argon2i_memlimit_moderate()
    crypto_pwhash_argon2i_OPSLIMIT_SENSITIVE = sodium.crypto_pwhash_argon2i_opslimit_sensitive()
    crypto_pwhash_argon2i_MEMLIMIT_SENSITIVE = sodium.crypto_pwhash_argon2i_memlimit_sensitive()
else:
    crypto_pwhash_ALG_DEFAULT = None
    crypto_aead_chacha20poly1305_ietf_KEYBYTES = 32
    crypto_aead_chacha20poly1305_ietf_NPUBBYTES = 12
    crypto_aead_chacha20poly1305_ietf_ABYTES = 16
    crypto_pwhash_BYTES_MAX = 4294967295
    crypto_pwhash_BYTES_MIN = 16
    crypto_pwhash_MEMLIMIT_MAX = 4398046510080
    crypto_pwhash_MEMLIMIT_MIN = 1
    crypto_pwhash_OPSLIMIT_MAX = 4294967295
    crypto_pwhash_OPSLIMIT_MIN = 3
    crypto_pwhash_PASSWD_MAX = 4294967295
    crypto_pwhash_PASSWD_MIN = 0

crypto_aead_chacha20poly1305_ietf_NONCEBYTES = crypto_aead_chacha20poly1305_ietf_NPUBBYTES

if sodium_version_check(1, 0, 12):
    crypto_kx_PUBLICKEYBYTES = sodium.crypto_kx_publickeybytes()
    crypto_kx_SECRETKEYBYTES = sodium.crypto_kx_secretkeybytes()
    crypto_kx_SESSIONKEYBYTES = sodium.crypto_kx_sessionkeybytes()
    crypto_aead_xchacha20poly1305_ietf_KEYBYTES = sodium.crypto_aead_xchacha20poly1305_ietf_keybytes()
    crypto_aead_xchacha20poly1305_ietf_NPUBBYTES = sodium.crypto_aead_xchacha20poly1305_ietf_npubbytes()
    crypto_aead_xchacha20poly1305_ietf_NONCEBYTES = crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
    crypto_aead_xchacha20poly1305_ietf_ABYTES = sodium.crypto_aead_xchacha20poly1305_ietf_abytes()
    sodium.crypto_pwhash_bytes_max.restype=ctypes.c_uint
    sodium.crypto_pwhash_opslimit_max.restype=ctypes.c_uint
    sodium.crypto_pwhash_memlimit_max.restype=ctypes.c_uint
    sodium.crypto_pwhash_passwd_max.restype=ctypes.c_uint
    sodium.crypto_pwhash_scryptsalsa208sha256_bytes_max.restype=ctypes.c_uint
    sodium.crypto_pwhash_scryptsalsa208sha256_opslimit_max.restype=ctypes.c_uint
    sodium.crypto_pwhash_scryptsalsa208sha256_memlimit_max.restype=ctypes.c_ulonglong
    sodium.crypto_pwhash_scryptsalsa208sha256_passwd_max.restype=ctypes.c_uint
    crypto_pwhash_BYTES_MAX = sodium.crypto_pwhash_bytes_max()
    crypto_pwhash_BYTES_MIN = sodium.crypto_pwhash_bytes_min()
    crypto_pwhash_MEMLIMIT_MAX = sodium.crypto_pwhash_memlimit_max()
    crypto_pwhash_MEMLIMIT_MIN = sodium.crypto_pwhash_memlimit_min()
    crypto_pwhash_OPSLIMIT_MAX = sodium.crypto_pwhash_opslimit_max()
    crypto_pwhash_OPSLIMIT_MIN = sodium.crypto_pwhash_opslimit_min()
    crypto_pwhash_PASSWD_MAX = sodium.crypto_pwhash_passwd_max()
    crypto_pwhash_PASSWD_MIN = sodium.crypto_pwhash_passwd_min()
    crypto_pwhash_scryptsalsa208sha256_BYTES_MAX = sodium.crypto_pwhash_scryptsalsa208sha256_bytes_max()
    crypto_pwhash_scryptsalsa208sha256_BYTES_MIN = sodium.crypto_pwhash_scryptsalsa208sha256_bytes_min()
    crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_MAX = sodium.crypto_pwhash_scryptsalsa208sha256_memlimit_max()
    crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_MIN = sodium.crypto_pwhash_scryptsalsa208sha256_memlimit_min()
    crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_MAX = sodium.crypto_pwhash_scryptsalsa208sha256_opslimit_max()
    crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_MIN = sodium.crypto_pwhash_scryptsalsa208sha256_opslimit_min()
    crypto_pwhash_scryptsalsa208sha256_PASSWD_MAX = sodium.crypto_pwhash_scryptsalsa208sha256_passwd_max()
    crypto_pwhash_scryptsalsa208sha256_PASSWD_MIN = sodium.crypto_pwhash_scryptsalsa208sha256_passwd_min()
    crypto_kdf_KEYBYTES = sodium.crypto_kdf_keybytes()
else:
    crypto_pwhash_scryptsalsa208sha256_BYTES_MIN = 16
    crypto_pwhash_scryptsalsa208sha256_BYTES_MAX = 4294967264
    crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_MAX = 68719476736
    crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_MIN = 16777216
    crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_MIN = 32768
    crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_MAX =4294967295
    crypto_pwhash_scryptsalsa208sha256_PASSWD_MAX = 4294967295
    crypto_pwhash_scryptsalsa208sha256_PASSWD_MIN = 0

if sodium_version_check(1, 0, 13):
    crypto_pwhash_ALG_ARGON2ID13 = sodium.crypto_pwhash_alg_argon2id13()
    crypto_pwhash_argon2id_OPSLIMIT_INTERACTIVE = sodium.crypto_pwhash_argon2id_opslimit_interactive()
    crypto_pwhash_argon2id_MEMLIMIT_INTERACTIVE = sodium.crypto_pwhash_argon2id_memlimit_interactive()
    crypto_pwhash_argon2id_OPSLIMIT_MODERATE = sodium.crypto_pwhash_argon2id_opslimit_moderate()
    crypto_pwhash_argon2id_MEMLIMIT_MODERATE = sodium.crypto_pwhash_argon2id_memlimit_moderate()
    crypto_pwhash_argon2id_OPSLIMIT_SENSITIVE = sodium.crypto_pwhash_argon2id_opslimit_sensitive()
    crypto_pwhash_argon2id_MEMLIMIT_SENSITIVE = sodium.crypto_pwhash_argon2id_memlimit_sensitive()

if sodium_version_check(1, 0, 15):
    crypto_secretstream_xchacha20poly1305_STATEBYTES = sodium.crypto_secretstream_xchacha20poly1305_statebytes()
    crypto_secretstream_xchacha20poly1305_ABYTES = sodium.crypto_secretstream_xchacha20poly1305_abytes()
    crypto_secretstream_xchacha20poly1305_HEADERBYTES = sodium.crypto_secretstream_xchacha20poly1305_headerbytes()
    crypto_secretstream_xchacha20poly1305_KEYBYTES = sodium.crypto_secretstream_xchacha20poly1305_keybytes()
    crypto_secretstream_xchacha20poly1305_MESSAGEBYTES_MAX = sodium.crypto_secretstream_xchacha20poly1305_messagebytes_max()
    crypto_secretstream_xchacha20poly1305_TAG_MESSAGE = sodium.crypto_secretstream_xchacha20poly1305_tag_message()
    crypto_secretstream_xchacha20poly1305_TAG_PUSH = sodium.crypto_secretstream_xchacha20poly1305_tag_push()
    crypto_secretstream_xchacha20poly1305_TAG_REKEY = sodium.crypto_secretstream_xchacha20poly1305_tag_rekey()
    crypto_secretstream_xchacha20poly1305_TAG_FINAL = sodium.crypto_secretstream_xchacha20poly1305_tag_final()

if sodium_version_check(1, 0, 18):
    crypto_core_ristretto255_BYTES = sodium.crypto_core_ristretto255_bytes()
    crypto_core_ristretto255_HASHBYTES = sodium.crypto_core_ristretto255_hashbytes()
    crypto_core_ristretto255_SCALARBYTES = sodium.crypto_core_ristretto255_scalarbytes()
    crypto_core_ristretto255_NONREDUCEDSCALARBYTES = sodium.crypto_core_ristretto255_nonreducedscalarbytes()

sodium_init = sodium.sodium_init

class CryptoSignState(ctypes.Structure):
    _pack_ = 1
    _fields_ = [
        ('state', ctypes.c_uint64 * 8),
        ('count', ctypes.c_uint64 * 2),
        ('buf', ctypes.c_uint8 * 128)
    ]

def __check(code):
    if code != 0:
        raise ValueError("code={}".format(code))


def pad_buf(buf, length, name = 'buf'):
    buflen = len(buf)
    if buflen > length:
        raise ValueError("Cannot pad %s (len: %d - expected %d or less)" % (name, buflen, length))

    padding = length - buflen
    if padding > 0:
        return buf + b"\x00"*padding
    else:
        return buf

def crypto_scalarmult_curve25519(n, p):
    if None in (n,p):
        raise ValueError("invalid parameters")
    if len(n) != crypto_scalarmult_SCALARBYTES: raise ValueError("truncated scalar")
    if len(p) != crypto_scalarmult_BYTES: raise ValueError("truncated point")
    buf = ctypes.create_string_buffer(crypto_scalarmult_BYTES)
    __check(sodium.crypto_scalarmult_curve25519(buf, n, p))
    return buf.raw


def crypto_scalarmult_curve25519_base(n):
    if n is None:
        raise ValueError("invalid parameters")
    if len(n) != crypto_scalarmult_SCALARBYTES: raise ValueError("truncated scalar")
    buf = ctypes.create_string_buffer(crypto_scalarmult_BYTES)
    __check(sodium.crypto_scalarmult_curve25519_base(ctypes.byref(buf), n))
    return buf.raw

# crypto_stream_chacha20_xor(unsigned char *c, const unsigned char *m, unsigned long long mlen, const unsigned char *n, const unsigned char *k)
def crypto_stream_chacha20_xor(message, nonce, key):
    if len(nonce) != crypto_stream_chacha20_NONCEBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_stream_chacha20_KEYBYTES: raise ValueError("truncated key")

    mlen = ctypes.c_longlong(len(message))

    c = ctypes.create_string_buffer(len(message))

    __check(sodium.crypto_stream_chacha20_xor(c, message, mlen, nonce, key))

    return c.raw

# crypto_stream_chacha20_xor_ic(unsigned char *c, const unsigned char *m, unsigned long long mlen, const unsigned char *n, uint64_t ic, const unsigned char *k)
def crypto_stream_chacha20_xor_ic(message, nonce, initial_counter, key):
    if len(nonce) != crypto_stream_chacha20_NONCEBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_stream_chacha20_KEYBYTES: raise ValueError("truncated key")

    mlen = ctypes.c_longlong(len(message))
    ic = ctypes.c_uint64(initial_counter)

    c = ctypes.create_string_buffer(len(message))

    __check(sodium.crypto_stream_chacha20_xor_ic(c, message, mlen, nonce, ic, key))

    return c.raw

# crypto_aead_chacha20poly1305_encrypt(unsigned char *c, unsigned long long *clen, const unsigned char *m, unsigned long long mlen, const unsigned char *ad, unsigned long long adlen, const unsigned char *nsec, const unsigned char *npub, const unsigned char *k);
def crypto_aead_chacha20poly1305_encrypt(message, ad, nonce, key):
    if len(nonce) != crypto_aead_chacha20poly1305_NONCEBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_aead_chacha20poly1305_KEYBYTES: raise ValueError("truncated key")

    mlen = ctypes.c_ulonglong(len(message))
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)

    c = ctypes.create_string_buffer(mlen.value + 16)
    clen = ctypes.c_ulonglong(0)

    __check(sodium.crypto_aead_chacha20poly1305_encrypt(c, ctypes.byref(clen), message, mlen, ad, adlen, None, nonce, key))
    return c.raw


# crypto_aead_chacha20poly1305_decrypt(unsigned char *m, unsigned long long *mlen, unsigned char *nsec, const unsigned char *c, unsigned long long clen, const unsigned char *ad, unsigned long long adlen, const unsigned char *npub, const unsigned char *k)
def crypto_aead_chacha20poly1305_decrypt(ciphertext, ad, nonce, key):
    if len(nonce) != crypto_aead_chacha20poly1305_NONCEBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_aead_chacha20poly1305_KEYBYTES: raise ValueError("truncated key")

    m = ctypes.create_string_buffer(len(ciphertext) - 16)
    mlen = ctypes.c_ulonglong(0)
    clen = ctypes.c_ulonglong(len(ciphertext))
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)
    __check(sodium.crypto_aead_chacha20poly1305_decrypt(m, ctypes.byref(mlen), None, ciphertext, clen, ad, adlen, nonce, key))
    return m.raw

# crypto_aead_chacha20poly1305_encrypt_detached(unsigned char *c, unsigned char *mac, unsigned long long *maclen_p, const unsigned char *m, unsigned long long mlen, const unsigned char *ad, unsigned long long adlen, const unsigned char *nsec, const unsigned char *npub, const unsigned char *k)
@sodium_version(1, 0, 9)
def crypto_aead_chacha20poly1305_encrypt_detached(message, ad, nonce, key):
    """ Return ciphertext, mac tag """
    if len(nonce) != crypto_aead_chacha20poly1305_NONCEBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_aead_chacha20poly1305_KEYBYTES: raise ValueError("truncated key")

    mlen = ctypes.c_ulonglong(len(message))
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)
    c = ctypes.create_string_buffer(mlen.value)
    maclen_p = ctypes.c_ulonglong(crypto_aead_chacha20poly1305_ABYTES)
    mac = ctypes.create_string_buffer(maclen_p.value)

    __check(sodium.crypto_aead_chacha20poly1305_encrypt_detached(c, mac, ctypes.byref(maclen_p), message, mlen, ad, adlen, None, nonce, key))
    return c.raw, mac.raw

# crypto_aead_chacha20poly1305_decrypt_detached(unsigned char *m, unsigned char *nsec, const unsigned char *c, unsigned long long clen, const unsigned char *mac, const unsigned char *ad, unsigned long long adlen, const unsigned char *npub, const unsigned char *k)
@sodium_version(1, 0, 9)
def crypto_aead_chacha20poly1305_decrypt_detached(ciphertext, mac, ad, nonce, key):
    """ Return message if successful or -1 (ValueError) if not successful"""
    if len(nonce) != crypto_aead_chacha20poly1305_NONCEBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_aead_chacha20poly1305_KEYBYTES: raise ValueError("truncated key")
    if len(mac) != crypto_aead_chacha20poly1305_ABYTES:
        raise ValueError("mac length != %i" % crypto_aead_chacha20poly1305_ABYTES)

    clen = ctypes.c_ulonglong(len(ciphertext))
    m = ctypes.create_string_buffer(clen.value)
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)
    __check(sodium.crypto_aead_chacha20poly1305_decrypt_detached(m, None, ciphertext, clen, mac, ad, adlen, nonce, key))
    return m.raw

# crypto_aead_chacha20poly1305_ietf_encrypt(unsigned char *c, unsigned long long *clen_p, const unsigned char *m, unsigned long long mlen, const unsigned char *ad, unsigned long long adlen, const unsigned char *nsec, const unsigned char *npub, const unsigned char *k)
@sodium_version(1, 0, 4)
def crypto_aead_chacha20poly1305_ietf_encrypt(message, ad, nonce, key):
    if len(nonce) != crypto_aead_chacha20poly1305_ietf_NONCEBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_aead_chacha20poly1305_ietf_KEYBYTES: raise ValueError("truncated key")

    mlen = ctypes.c_ulonglong(len(message))
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)
    c = ctypes.create_string_buffer(mlen.value + 16)
    clen = ctypes.c_ulonglong(0)

    __check(sodium.crypto_aead_chacha20poly1305_ietf_encrypt(c, ctypes.byref(clen), message, mlen, ad, adlen, None, nonce, key))
    return c.raw

# crypto_aead_chacha20poly1305_ietf_decrypt(unsigned char *m, unsigned long long *mlen, unsigned char *nsec, const unsigned char *c, unsigned long long clen, const unsigned char *ad, unsigned long long adlen, const unsigned char *npub, const unsigned char *k)
@sodium_version(1, 0, 4)
def crypto_aead_chacha20poly1305_ietf_decrypt(ciphertext, ad, nonce, key):
    if len(nonce) != crypto_aead_chacha20poly1305_ietf_NONCEBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_aead_chacha20poly1305_ietf_KEYBYTES: raise ValueError("truncated key")

    m = ctypes.create_string_buffer(len(ciphertext) - 16)
    mlen = ctypes.c_ulonglong(0)
    clen = ctypes.c_ulonglong(len(ciphertext))
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)
    __check(sodium.crypto_aead_chacha20poly1305_ietf_decrypt(m, ctypes.byref(mlen), None, ciphertext, clen, ad, adlen, nonce, key))
    return m.raw

# crypto_aead_chacha20poly1305_ietf_encrypt_detached(unsigned char *c, unsigned char *mac, unsigned long long *maclen_p, const unsigned char *m, unsigned long long mlen, const unsigned char *ad, unsigned long long adlen, const unsigned char *nsec, const unsigned char *npub, const unsigned char *k)
@sodium_version(1, 0, 9)
def crypto_aead_chacha20poly1305_ietf_encrypt_detached(message, ad, nonce, key):
    """ Return ciphertext, mac tag """
    if len(nonce) != crypto_aead_chacha20poly1305_ietf_NONCEBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_aead_chacha20poly1305_ietf_KEYBYTES: raise ValueError("truncated key")

    mlen = ctypes.c_ulonglong(len(message))
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)
    c = ctypes.create_string_buffer(mlen.value)
    maclen_p = ctypes.c_ulonglong(crypto_aead_chacha20poly1305_ietf_ABYTES)
    mac = ctypes.create_string_buffer(maclen_p.value)

    __check(sodium.crypto_aead_chacha20poly1305_ietf_encrypt_detached(c, mac, ctypes.byref(maclen_p), message, mlen, ad, adlen, None, nonce, key))
    return c.raw, mac.raw

# crypto_aead_chacha20poly1305_ietf_decrypt_detached(unsigned char *m, unsigned char *nsec, const unsigned char *c, unsigned long long clen, const unsigned char *mac, const unsigned char *ad, unsigned long long adlen, const unsigned char *npub, const unsigned char *k)
@sodium_version(1, 0, 9)
def crypto_aead_chacha20poly1305_ietf_decrypt_detached(ciphertext, mac, ad, nonce, key):
    """ Return message if successful or -1 (ValueError) if not successful"""
    if len(nonce) != crypto_aead_chacha20poly1305_ietf_NONCEBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_aead_chacha20poly1305_ietf_KEYBYTES: raise ValueError("truncated key")
    if len(mac) != crypto_aead_chacha20poly1305_ietf_ABYTES:
        raise ValueError("mac length != %i" % crypto_aead_chacha20poly1305_ietf_ABYTES)

    clen = ctypes.c_ulonglong(len(ciphertext))
    m = ctypes.create_string_buffer(clen.value)
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)
    __check(sodium.crypto_aead_chacha20poly1305_ietf_decrypt_detached(m, None, ciphertext, clen, mac, ad, adlen, nonce, key))
    return m.raw

#crypto_aead_xchacha20poly1305_ietf_encrypt(ciphertext, &ciphertext_len,
#                                           message, message_len,
#                                           additional_data, additional_data_len,
#                                           null, nonce, key);
@sodium_version(1, 0, 12)
def crypto_aead_xchacha20poly1305_ietf_encrypt(message, ad, nonce, key):
    if len(nonce) != crypto_aead_xchacha20poly1305_ietf_NPUBBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_aead_xchacha20poly1305_ietf_KEYBYTES: raise ValueError("truncated key")
    mlen = ctypes.c_ulonglong(len(message))
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)
    c = ctypes.create_string_buffer(mlen.value + 16)
    clen = ctypes.c_ulonglong(0)

    __check(sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(c, ctypes.byref(clen),
                                                             message, mlen,
                                                             ad, adlen,
                                                             None, nonce, key))
    return c.raw

#crypto_aead_xchacha20poly1305_ietf_decrypt(decrypted, &decrypted_len,
#                                           null,
#                                           ciphertext, ciphertext_len,
#                                           additional_data, additional_data_len,
#                                           nonce, key);
@sodium_version(1, 0, 12)
def crypto_aead_xchacha20poly1305_ietf_decrypt(ciphertext, ad, nonce, key):
    if len(nonce) != crypto_aead_xchacha20poly1305_ietf_NPUBBYTES: raise ValueError("truncated nonce")
    if len(key) != crypto_aead_xchacha20poly1305_ietf_KEYBYTES: raise ValueError("truncated key")

    m = ctypes.create_string_buffer(len(ciphertext) - 16)
    mlen = ctypes.c_ulonglong(0)
    clen = ctypes.c_ulonglong(len(ciphertext))
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)
    __check(sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(m, ctypes.byref(mlen),
                                                              None,
                                                              ciphertext, clen,
                                                              ad, adlen,
                                                              nonce, key))
    return m.raw

# crypto_auth(unsigned char *out, const unsigned char *in, unsigned long long inlen, const unsigned char *k)
def crypto_auth(m, k):
    if m is None or k is None:
        raise ValueError("invalid parameters")
    if len(k) != crypto_auth_KEYBYTES:
        raise ValueError("invalid key")
    buf = ctypes.create_string_buffer(crypto_auth_BYTES)
    __check(sodium.crypto_auth(buf, m, ctypes.c_ulonglong(len(m)), k))
    return buf.raw

# crypto_auth_verify(const unsigned char *h, const unsigned char *in, unsigned long long inlen, const unsigned char *k)
def crypto_auth_verify(h, m, k):
    if h is None or m is None or k is None:
        raise ValueError("invalid parameters")
    if len(k) != crypto_auth_KEYBYTES:
        raise ValueError("invalid key")
    if len(h) != crypto_auth_BYTES:
        raise ValueError("invalid tag")
    __check(sodium.crypto_auth_verify(h, m, ctypes.c_ulonglong(len(m)), k))

# crypto_generichash(unsigned char *out, size_t outlen, const unsigned char *in, unsigned long long inlen, const unsigned char *key, size_t keylen)
@encode_strings
def crypto_generichash(m, k=b'', outlen=crypto_generichash_BYTES):
    buf = ctypes.create_string_buffer(outlen)
    __check(sodium.crypto_generichash(buf, ctypes.c_size_t(outlen), m, ctypes.c_ulonglong(len(m)), k, ctypes.c_size_t(len(k))))
    return buf.raw


# crypto_generichash_init(crypto_generichash_state *state, const unsigned char *key, const size_t keylen, const size_t outlen);
@encode_strings
def crypto_generichash_init(outlen=crypto_generichash_BYTES, k=b''):
    state = ctypes.create_string_buffer(crypto_generichash_STATEBYTES)
    __check(sodium.crypto_generichash_init(ctypes.byref(state), k, ctypes.c_size_t(len(k)), ctypes.c_size_t(outlen)))
    return state


# crypto_generichash_update(crypto_generichash_state *state, const unsigned char *in, unsigned long long inlen);
@encode_strings
def crypto_generichash_update(state, m):
    if len(state) != crypto_generichash_STATEBYTES: raise ValueError("invalid state")
    __check(sodium.crypto_generichash_update(ctypes.byref(state), m, ctypes.c_ulonglong(len(m))))
    return state


# crypto_generichash_final(crypto_generichash_state *state, unsigned char *out, const size_t outlen);
def crypto_generichash_final(state, outlen=crypto_generichash_BYTES):
    if len(state) != crypto_generichash_STATEBYTES: raise ValueError("invalid state")
    buf = ctypes.create_string_buffer(outlen)
    __check(sodium.crypto_generichash_final(ctypes.byref(state), buf, ctypes.c_size_t(outlen)))
    return buf.raw

def crypto_generichash_blake2b_salt_personal(message, outlen = crypto_generichash_blake2b_BYTES, key = b'', salt = b'', personal = b''):
    keylen   = len(key)

    if keylen != 0 and not crypto_generichash_blake2b_BYTES_MIN <= keylen <= crypto_generichash_blake2b_KEYBYTES_MAX:
        raise ValueError("%d <= len(key) <= %d - %d received" % (crypto_generichash_blake2b_BYTES_MIN, crypto_generichash_blake2b_KEYBYTES_MAX, keylen))

    salt     = pad_buf(salt, crypto_generichash_blake2b_SALTBYTES, 'salt')
    personal = pad_buf(personal, crypto_generichash_blake2b_PERSONALBYTES, 'personal')

    buf      = ctypes.create_string_buffer(outlen)
    outlen   = ctypes.c_size_t(outlen)
    inlen    = ctypes.c_ulonglong(len(message))
    keylen   = ctypes.c_size_t(keylen)

    __check(sodium.crypto_generichash_blake2b_salt_personal(buf, outlen, message, inlen, key, keylen, salt, personal))
    return buf.raw


def randombytes(size):
    buf = ctypes.create_string_buffer(size)
    sodium.randombytes(buf, ctypes.c_ulonglong(size))
    return buf.raw


def crypto_box_keypair():
    pk = ctypes.create_string_buffer(crypto_box_PUBLICKEYBYTES)
    sk = ctypes.create_string_buffer(crypto_box_SECRETKEYBYTES)
    __check(sodium.crypto_box_keypair(pk, sk))
    return pk.raw, sk.raw

# int crypto_box_seed_keypair(unsigned char *pk, unsigned char *sk,
#                                const unsigned char *seed);
def crypto_box_seed_keypair(seed):
    if seed is None:
        raise ValueError("invalid parameters")
    if len(seed) != crypto_box_SEEDBYTES: raise ValueError("invalid seed size")

    pk = ctypes.create_string_buffer(crypto_box_PUBLICKEYBYTES)
    sk = ctypes.create_string_buffer(crypto_box_SECRETKEYBYTES)
    __check(sodium.crypto_box_seed_keypair(pk, sk, seed))
    return pk.raw, sk.raw

def crypto_box_beforenm(pk, sk):
    if pk is None or sk is None:
        raise ValueError("invalid parameters")
    if len(pk) != crypto_box_PUBLICKEYBYTES: raise ValueError("pk incorrect size")
    if len(sk) != crypto_box_SECRETKEYBYTES: raise ValueError("sk incorrect size")
    c = ctypes.create_string_buffer(crypto_secretbox_KEYBYTES)
    __check(sodium.crypto_box_beforenm(c, pk, sk))
    return c.raw

def crypto_box(msg, nonce, pk, sk):
    if None in (msg, nonce, pk, sk):
        raise ValueError("invalid parameters")
    if len(pk) != crypto_box_PUBLICKEYBYTES: raise ValueError("pk incorrect size")
    if len(sk) != crypto_box_SECRETKEYBYTES: raise ValueError("sk incorrect size")
    if len(nonce) != crypto_box_NONCEBYTES: raise ValueError("nonce incorrect size")
    c = ctypes.create_string_buffer(crypto_box_MACBYTES + len(msg))
    __check(sodium.crypto_box_easy(c, msg, ctypes.c_ulonglong(len(msg)), nonce, pk, sk))
    return c.raw

def crypto_box_afternm(msg, nonce, k):
    if None in (msg, nonce, k):
        raise ValueError("invalid parameters")
    if len(k) != crypto_box_BEFORENMBYTES: raise ValueError("k incorrect size")
    if len(nonce) != crypto_box_NONCEBYTES: raise ValueError("nonce incorrect size")
    c = ctypes.create_string_buffer(crypto_box_MACBYTES + len(msg))
    __check(sodium.crypto_box_easy_afternm(c, msg, ctypes.c_ulonglong(len(msg)), nonce, k))
    return c.raw

def crypto_box_open(c, nonce, pk, sk):
    if None in (c, nonce, pk, sk):
        raise ValueError("invalid parameters")
    if len(pk) != crypto_box_PUBLICKEYBYTES: raise ValueError("pk incorrect size")
    if len(sk) != crypto_box_SECRETKEYBYTES: raise ValueError("sk incorrect size")
    if len(nonce) != crypto_box_NONCEBYTES: raise ValueError("nonce incorrect size")
    msg = ctypes.create_string_buffer(len(c) - crypto_box_MACBYTES)
    __check(sodium.crypto_box_open_easy(msg, c, ctypes.c_ulonglong(len(c)), nonce, pk, sk))
    return msg.raw

def crypto_box_open_afternm(c, nonce, k):
    if None in (c, nonce, k):
        raise ValueError("invalid parameters")
    if len(k) != crypto_box_BEFORENMBYTES: raise ValueError("k incorrect size")
    if len(nonce) != crypto_box_NONCEBYTES: raise ValueError("nonce incorrect size")
    msg = ctypes.create_string_buffer(len(c) - crypto_box_MACBYTES)
    __check(sodium.crypto_box_open_easy_afternm(msg, c, ctypes.c_ulonglong(len(c)), nonce, k))
    return msg.raw

def crypto_secretbox(msg, nonce, k):
    if None in (msg, nonce, k):
        raise ValueError("invalid parameters")
    if len(k) != crypto_secretbox_KEYBYTES: raise ValueError("k incorrect size")
    if len(nonce) != crypto_secretbox_NONCEBYTES: raise ValueError("nonce incorrect size")
    padded = b"\x00" * crypto_secretbox_ZEROBYTES + msg
    c = ctypes.create_string_buffer(len(padded))
    __check(sodium.crypto_secretbox(c, padded, ctypes.c_ulonglong(len(padded)), nonce, k))
    return c.raw[crypto_secretbox_BOXZEROBYTES:]


def crypto_secretbox_open(c, nonce, k):
    if None in (c, nonce, k):
        raise ValueError("invalid parameters")
    if len(k) != crypto_secretbox_KEYBYTES: raise ValueError("k incorrect size")
    if len(nonce) != crypto_secretbox_NONCEBYTES: raise ValueError("nonce incorrect size")
    padded = b"\x00" * crypto_secretbox_BOXZEROBYTES + c
    msg = ctypes.create_string_buffer(len(padded))
    __check(sodium.crypto_secretbox_open(msg, padded, ctypes.c_ulonglong(len(padded)), nonce, k))
    return msg.raw[crypto_secretbox_ZEROBYTES:]

# int crypto_box_seal(unsigned char *c, const unsigned char *m,
#                    unsigned long long mlen, const unsigned char *pk);

@sodium_version(1, 0, 3)
def crypto_box_seal(msg, k):
    if msg is None or k is None:
        raise ValueError("invalid parameters")
    if len(k) != crypto_box_PUBLICKEYBYTES: raise ValueError("k incorrect size")
    c = ctypes.create_string_buffer(len(msg)+crypto_box_SEALBYTES)
    __check(sodium.crypto_box_seal(c, msg, ctypes.c_ulonglong(len(msg)), k))
    return c.raw

# int crypto_box_seal_open(unsigned char *m, const unsigned char *c,
#                         unsigned long long clen,
#                         const unsigned char *pk, const unsigned char *sk);

@sodium_version(1, 0, 3)
def crypto_box_seal_open(c, pk, sk):
    if None in (c, pk, sk):
        raise ValueError("invalid parameters")
    if len(pk) != crypto_box_PUBLICKEYBYTES: raise ValueError("pk incorrect size")
    if len(sk) != crypto_box_SECRETKEYBYTES: raise ValueError("sk incorrect size")
    msg = ctypes.create_string_buffer(len(c)-crypto_box_SEALBYTES)
    __check(sodium.crypto_box_seal_open(msg, c, ctypes.c_ulonglong(len(c)), pk, sk))
    return msg.raw


# int crypto_box_detached(unsigned char *c, unsigned char *mac,
#                        const unsigned char *m, unsigned long long mlen,
#                        const unsigned char *n, const unsigned char *pk,
#                        const unsigned char *sk);

def crypto_box_detached(msg, nonce, pk, sk):
    if None in (msg, nonce, pk, sk): raise ValueError("invalid parameters")
    if len(pk) != crypto_box_PUBLICKEYBYTES: raise ValueError("pk incorrect size")
    if len(sk) != crypto_box_SECRETKEYBYTES: raise ValueError("sk incorrect size")
    if len(nonce) != crypto_box_NONCEBYTES: raise ValueError("nonce incorrect size")
    c = ctypes.create_string_buffer(len(msg))
    mac = ctypes.create_string_buffer(crypto_box_MACBYTES)
    __check(sodium.crypto_box_detached(c, mac, msg, ctypes.c_ulonglong(len(msg)), nonce, pk, sk))
    return c.raw, mac.raw

# int crypto_box_open_detached(unsigned char *m, const unsigned char *c,
#                             const unsigned char *mac,
#                             unsigned long long clen,
#                             const unsigned char *n,
#                             const unsigned char *pk,
#                             const unsigned char *sk);

def crypto_box_open_detached(c, mac, nonce, pk, sk):
    if None in (c, mac, nonce, pk, sk):
        raise ValueError("invalid parameters")
    if len(pk) != crypto_box_PUBLICKEYBYTES: raise ValueError("pk incorrect size")
    if len(sk) != crypto_box_SECRETKEYBYTES: raise ValueError("sk incorrect size")
    if len(nonce) != crypto_box_NONCEBYTES: raise ValueError("nonce incorrect size")
    msg = ctypes.create_string_buffer(len(c))
    __check(sodium.crypto_box_open_detached(msg, c, mac, ctypes.c_ulonglong(len(c)), nonce, pk, sk))
    return msg.raw


# void crypto_secretstream_xchacha20poly1305_keygen (unsigned char k[crypto_secretstream_xchacha20poly1305_KEYBYTES])
@sodium_version(1, 0, 15)
def crypto_secretstream_xchacha20poly1305_keygen():
    key = ctypes.create_string_buffer(crypto_secretstream_xchacha20poly1305_KEYBYTES)
    sodium.crypto_secretstream_xchacha20poly1305_keygen(ctypes.byref(key))
    return key.raw


# int crypto_secretstream_xchacha20poly1305_init_push(crypto_secretstream_xchacha20poly1305_state *state,
#                                                     unsigned char out[crypto_secretstream_xchacha20poly1305_HEADERBYTES],
#                                                     const unsigned char k[crypto_secretstream_xchacha20poly1305_KEYBYTES])
@sodium_version(1, 0, 15)
def crypto_secretstream_xchacha20poly1305_init_push(key):
    if key == None:
        raise ValueError("invalid parameters")
    if not (len(key) == crypto_secretstream_xchacha20poly1305_KEYBYTES): raise ValueError("Truncated key")

    state  = ctypes.create_string_buffer(crypto_secretstream_xchacha20poly1305_STATEBYTES)
    header = ctypes.create_string_buffer(crypto_secretstream_xchacha20poly1305_HEADERBYTES)
    __check(sodium.crypto_secretstream_xchacha20poly1305_init_push(state, header, key))
    return state.raw, header.raw

# int crypto_secretstream_xchacha20poly1305_init_pull(crypto_secretstream_xchacha20poly1305_state *state,
#                                                     const unsigned char in[crypto_secretstream_xchacha20poly1305_HEADERBYTES],
#                                                     const unsigned char k[crypto_secretstream_xchacha20poly1305_KEYBYTES])
@sodium_version(1, 0, 15)
def crypto_secretstream_xchacha20poly1305_init_pull(header, key):
    if None in (header, key):
        raise ValueError("invalid parameters")
    if not (len(header) == crypto_secretstream_xchacha20poly1305_HEADERBYTES): raise ValueError("Truncated header")
    if not (len(key) == crypto_secretstream_xchacha20poly1305_KEYBYTES): raise ValueError("Truncated key")

    state  = ctypes.create_string_buffer(crypto_secretstream_xchacha20poly1305_STATEBYTES)
    __check(sodium.crypto_secretstream_xchacha20poly1305_init_pull(state, header, key))
    return state.raw

#void crypto_secretstream_xchacha20poly1305_rekey (crypto_secretstream_xchacha20poly1305_state *state)
@sodium_version(1, 0, 15)
def crypto_secretstream_xchacha20poly1305_rekey(state):
    if state == None:
        raise ValueError("invalid parameters")
    if not (len(state) == crypto_secretstream_xchacha20poly1305_STATEBYTES): raise ValueError("Truncated state")

    sodium.crypto_secretstream_xchacha20poly1305_rekey(state)

#int crypto_secretstream_xchacha20poly1305_push (crypto_secretstream_xchacha20poly1305_state *state,
#                                                unsigned char *out,
#                                                unsigned long long *outlen_p,
#                                                const unsigned char *m,
#                                                unsigned long long mlen,
#                                                const unsigned char *ad,
#                                                unsigned long long adlen,
#                                                unsigned char tag)

@sodium_version(1, 0, 15)
def crypto_secretstream_xchacha20poly1305_push(state, message, ad, tag):
    if None in (state, message):
        raise ValueError("invalid parameters")
    if not (len(state) == crypto_secretstream_xchacha20poly1305_STATEBYTES): raise ValueError("Truncated state")

    mlen = ctypes.c_ulonglong(len(message))
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)
    c = ctypes.create_string_buffer(mlen.value + crypto_secretstream_xchacha20poly1305_ABYTES)
    clen = ctypes.c_ulonglong(0)

    __check(sodium.crypto_secretstream_xchacha20poly1305_push(
                                                                state,                  #  crypto_secretstream_xchacha20poly1305_state *state,
                                                                c,                      #  unsigned char *out
                                                                ctypes.byref(clen),     #  unsigned long long *outlen_p,
                                                                message,                #  const unsigned char *m,
                                                                mlen,                   #  unsigned long long mlen,
                                                                ad,                     #  const unsigned char *ad,
                                                                adlen,                  #  unsigned long long adlen,
                                                                tag))                   #  unsigned char tag)
    return c.raw


#crypto_secretstream_xchacha20poly1305_pull (crypto_secretstream_xchacha20poly1305_state *state,
#                                            unsigned char *m,
#                                            unsigned long long *mlen_p,
#                                            unsigned char *tag_p,
#                                            const unsigned char *in,
#                                            unsigned long long inlen,
#                                            const unsigned char *ad,
#                                            unsigned long long adlen)
@sodium_version(1, 0, 15)
def crypto_secretstream_xchacha20poly1305_pull(state, ciphertext, ad):
    if None in (state, ciphertext):
        raise ValueError("invalid parameters")
    if not (len(state) == crypto_secretstream_xchacha20poly1305_STATEBYTES): raise ValueError("Truncated state")
    if len(ciphertext) < crypto_secretstream_xchacha20poly1305_ABYTES:
        raise ValueError("truncated cyphertext")

    m = ctypes.create_string_buffer(len(ciphertext) - crypto_secretstream_xchacha20poly1305_ABYTES)
    mlen = ctypes.c_ulonglong(0)
    tag  = ctypes.c_ubyte(0)
    clen = ctypes.c_ulonglong(len(ciphertext))
    adlen = ctypes.c_ulonglong(len(ad)) if ad is not None else ctypes.c_ulonglong(0)

    __check(sodium.crypto_secretstream_xchacha20poly1305_pull(
                                                                state,
                                                                m,                   # char *m,
                                                                ctypes.byref(mlen),  # long long *mlen_p,
                                                                ctypes.byref(tag),   # char *tag_p,
                                                                ciphertext,          # unsigned char *in,
                                                                clen,                # long long inlen,
                                                                ad,                  # unsigned char *ad,
                                                                adlen                # long long adlen)
                                                                ))
    return m.raw, tag.value

def crypto_sign_keypair():
    pk = ctypes.create_string_buffer(crypto_sign_PUBLICKEYBYTES)
    sk = ctypes.create_string_buffer(crypto_sign_SECRETKEYBYTES)
    __check(sodium.crypto_sign_keypair(pk, sk))
    return pk.raw, sk.raw


def crypto_sign_seed_keypair(seed):
    if len(seed) != crypto_sign_SEEDBYTES: raise ValueError("invalid seed size")
    pk = ctypes.create_string_buffer(crypto_sign_PUBLICKEYBYTES)
    sk = ctypes.create_string_buffer(crypto_sign_SECRETKEYBYTES)
    __check(sodium.crypto_sign_seed_keypair(pk, sk, seed))
    return pk.raw, sk.raw

def crypto_sign(m, sk):
    if m is None or sk is None:
        raise ValueError("invalid parameters")
    if not (len(sk) == crypto_sign_SECRETKEYBYTES): raise ValueError('Truncated secret key')

    smsg = ctypes.create_string_buffer(len(m) + crypto_sign_BYTES)
    smsglen = ctypes.c_ulonglong()
    __check(sodium.crypto_sign(smsg, ctypes.byref(smsglen), m, ctypes.c_ulonglong(len(m)), sk))
    return smsg.raw


def crypto_sign_detached(m, sk):
    if m is None or sk is None:
        raise ValueError("invalid parameters")
    if not (len(sk) == crypto_sign_SECRETKEYBYTES): raise ValueError('Truncated secret key')
    sig = ctypes.create_string_buffer(crypto_sign_BYTES)
    # second parm is for output of signature len (optional, ignored if NULL)
    __check(sodium.crypto_sign_detached(sig, ctypes.c_void_p(0), m, ctypes.c_ulonglong(len(m)), sk))
    return sig.raw


def crypto_sign_open(sm, pk):
    if sm is None or pk is None:
        raise ValueError("invalid parameters")
    if not (len(pk) == crypto_sign_PUBLICKEYBYTES): raise ValueError('Truncated public key')
    msg = ctypes.create_string_buffer(len(sm))
    msglen = ctypes.c_ulonglong()
    __check(sodium.crypto_sign_open(msg, ctypes.byref(msglen), sm, ctypes.c_ulonglong(len(sm)), pk))
    return msg.raw[:msglen.value]


def crypto_sign_verify_detached(sig, msg, pk):
    if None in (sig, msg, pk):
        raise ValueError
    if len(sig) != crypto_sign_BYTES:
        raise ValueError("invalid sign")
    if not (len(pk) == crypto_sign_PUBLICKEYBYTES): raise ValueError('Truncated public key')
    __check(sodium.crypto_sign_verify_detached(sig, msg, ctypes.c_ulonglong(len(msg)), pk))


# crypto_sign_init(crypto_sign_state *state);
@sodium_version(1, 0, 12)
def crypto_sign_init():
    state = CryptoSignState()
    __check(sodium.crypto_sign_init(ctypes.byref(state)))
    return state


# crypto_sign_update(crypto_sign_state *state, const unsigned char *m, unsigned long long mlen);
@sodium_version(1, 0, 12)
def crypto_sign_update(state, m):
    if(not isinstance(state, CryptoSignState)):
        raise TypeError("state is not CryptoSignState")
    if m is None:
        raise ValueError("invalid parameters")
    __check(sodium.crypto_sign_update(ctypes.byref(state), m, ctypes.c_ulonglong(len(m))))


# crypto_sign_final_create(crypto_sign_state *state, unsigned char *sig, unsigned long long *siglen_p, const unsigned char *sk);
@sodium_version(1, 0, 12)
def crypto_sign_final_create(state, sk):
    if(not isinstance(state, CryptoSignState)):
        raise TypeError("state is not CryptoSignState")
    if sk is None:
        raise ValueError("invalid parameters")
    if len(sk) != crypto_sign_SECRETKEYBYTES:
        raise ValueError("invalid secret key")
    buf = ctypes.create_string_buffer(crypto_sign_BYTES)
    __check(sodium.crypto_sign_final_create(ctypes.byref(state), buf, ctypes.c_void_p(0), sk))
    return buf.raw


# crypto_sign_final_verify(crypto_sign_state *state, unsigned char *sig, const unsigned char *sk);
@sodium_version(1, 0, 12)
def crypto_sign_final_verify(state, sig, pk):
    if(not isinstance(state, CryptoSignState)):
        raise TypeError("state is not CryptoSignState")
    if None in (sig, pk):
        raise ValueError("invalid parameters")
    if len(sig) != crypto_sign_BYTES:
        raise ValueError("invalid signature")
    if len(pk) != crypto_sign_PUBLICKEYBYTES:
        raise ValueError("invalid public key")
    __check(sodium.crypto_sign_final_verify(ctypes.byref(state), sig, pk))


# int crypto_stream_salsa20(unsigned char *c, unsigned long long clen,
#                           const unsigned char *n, const unsigned char *k);
def crypto_stream(cnt, nonce=None, key=None):
    res = ctypes.create_string_buffer(cnt)
    if not nonce:
        nonce = randombytes(crypto_stream_NONCEBYTES)
    if not key:
        key = randombytes(crypto_stream_KEYBYTES)
    __check(sodium.crypto_stream(res, ctypes.c_ulonglong(cnt), nonce, key))
    return res.raw


# crypto_stream_salsa20_xor(unsigned char *c, const unsigned char *m, unsigned long long mlen,
#                           const unsigned char *n, const unsigned char *k)
def crypto_stream_xor(msg, cnt, nonce, key):
    res = ctypes.create_string_buffer(cnt)
    if len(nonce) != crypto_stream_NONCEBYTES: raise ValueError("invalid nonce")
    if len(key) != crypto_stream_KEYBYTES: raise ValueError("invalid key")
    __check(sodium.crypto_stream_xor(res, msg, ctypes.c_ulonglong(cnt), nonce, key))
    return res.raw


def crypto_sign_pk_to_box_pk(pk):
    if pk is None:
        raise ValueError
    if not (len(pk) == crypto_sign_PUBLICKEYBYTES): raise ValueError('Truncated public key')
    res = ctypes.create_string_buffer(crypto_box_PUBLICKEYBYTES)
    __check(sodium.crypto_sign_ed25519_pk_to_curve25519(ctypes.byref(res), pk))
    return res.raw


def crypto_sign_sk_to_box_sk(sk):
    if sk is None:
        raise ValueError
    if not (len(sk) == crypto_sign_SECRETKEYBYTES): raise ValueError('Truncated secret key')
    res = ctypes.create_string_buffer(crypto_box_SECRETKEYBYTES)
    __check(sodium.crypto_sign_ed25519_sk_to_curve25519(ctypes.byref(res), sk))
    return res.raw

def crypto_sign_sk_to_seed(sk):
    if sk is None:
        raise ValueError
    if not (len(sk) == crypto_sign_SECRETKEYBYTES): raise ValueError('Truncated secret key')
    seed = ctypes.create_string_buffer(crypto_sign_SEEDBYTES)
    __check(sodium.crypto_sign_ed25519_sk_to_seed(ctypes.byref(seed), sk))
    return seed.raw

# int crypto_pwhash(unsigned char * const out,
#                   unsigned long long outlen,
#                   const char * const passwd,
#                   unsigned long long passwdlen,
#                   const unsigned char * const salt,
#                   unsigned long long opslimit,
#                   size_t memlimit, int alg);
@sodium_version(1, 0, 9)
@encode_strings
def crypto_pwhash(outlen, passwd, salt, opslimit, memlimit, alg=crypto_pwhash_ALG_DEFAULT):
    if None in (outlen, passwd, salt, opslimit, memlimit):
        raise ValueError("invalid parameters")
    if len(salt) != crypto_pwhash_SALTBYTES: raise ValueError("invalid salt")
    if not (crypto_pwhash_BYTES_MIN <= outlen <= crypto_pwhash_BYTES_MAX): raise ValueError("invalid hash len")
    if not (crypto_pwhash_PASSWD_MIN <= len(passwd) <= crypto_pwhash_PASSWD_MAX): raise ValueError("invalid passwd len")
    if not (crypto_pwhash_OPSLIMIT_MIN <= opslimit <= crypto_pwhash_OPSLIMIT_MAX): raise ValueError("invalid opslimit")
    if not (crypto_pwhash_MEMLIMIT_MIN <= memlimit <= crypto_pwhash_MEMLIMIT_MAX): raise ValueError("invalid memlimit")

    out = ctypes.create_string_buffer(outlen)

    __check(sodium.crypto_pwhash(ctypes.byref(out),
                                 ctypes.c_ulonglong(outlen),
                                 passwd,
                                 ctypes.c_ulonglong(len(passwd)),
                                 ctypes.byref(salt),
                                 ctypes.c_ulonglong(opslimit),
                                 ctypes.c_size_t(memlimit),
                                 ctypes.c_int(alg)))
    return out.raw

# int crypto_pwhash_str(char out[crypto_pwhash_STRBYTES],
#                       const char * const passwd,
#                       unsigned long long passwdlen,
#                       unsigned long long opslimit,
#                       size_t memlimit);
@sodium_version(1, 0, 9)
@encode_strings
def crypto_pwhash_str(passwd, opslimit, memlimit):
    if None in (passwd, opslimit, memlimit):
        raise ValueError("invalid parameters")
    if not (crypto_pwhash_PASSWD_MIN <= len(passwd) <= crypto_pwhash_PASSWD_MAX): raise ValueError("invalid passwd len")
    if not (crypto_pwhash_OPSLIMIT_MIN <= opslimit <= crypto_pwhash_OPSLIMIT_MAX): raise ValueError("invalid opslimit")
    if not (crypto_pwhash_MEMLIMIT_MIN <= memlimit <= crypto_pwhash_MEMLIMIT_MAX): raise ValueError("invalid memlimit")
    out = ctypes.create_string_buffer(crypto_pwhash_STRBYTES)
    __check(sodium.crypto_pwhash_str(ctypes.byref(out), passwd, ctypes.c_ulonglong(len(passwd)), ctypes.c_ulonglong(opslimit), ctypes.c_size_t(memlimit)))
    return out.raw

# int crypto_pwhash_str_verify(const char str[crypto_pwhash_STRBYTES],
#                              const char * const passwd,
#                              unsigned long long passwdlen);
@sodium_version(1, 0, 9)
@encode_strings
def crypto_pwhash_str_verify(pstr, passwd):
    if None in (pstr, passwd) or len(pstr) != crypto_pwhash_STRBYTES:
        raise ValueError("invalid parameters")
    if not (crypto_pwhash_PASSWD_MIN < len(passwd) <= crypto_pwhash_PASSWD_MAX): raise ValueError("invalid passwd len")
    return sodium.crypto_pwhash_str_verify(pstr, passwd, ctypes.c_ulonglong(len(passwd))) == 0

# int crypto_pwhash_scryptsalsa208sha256(unsigned char * const out,
#                                        unsigned long long outlen,
#                                        const char * const passwd,
#                                        unsigned long long passwdlen,
#                                        const unsigned char * const salt,
#                                        unsigned long long opslimit,
#                                        size_t memlimit);
def crypto_pwhash_scryptsalsa208sha256(outlen, passwd, salt, opslimit, memlimit):
    if None in (outlen, passwd, salt, opslimit, memlimit):
        raise ValueError

    if len(salt) != crypto_pwhash_scryptsalsa208sha256_SALTBYTES: raise ValueError("invalid salt")
    if not (crypto_pwhash_scryptsalsa208sha256_BYTES_MIN <= outlen <= crypto_pwhash_scryptsalsa208sha256_BYTES_MAX): raise ValueError("invalid hash len")
    if not (crypto_pwhash_scryptsalsa208sha256_PASSWD_MIN <= len(passwd) <= crypto_pwhash_scryptsalsa208sha256_PASSWD_MAX): raise ValueError("invalid passwd len")
    if not (crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_MIN <= opslimit <= crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_MAX): raise ValueError("invalid opslimit")
    if not (crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_MIN <= memlimit <= crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_MAX): raise ValueError("invalid memlimit")

    out = ctypes.create_string_buffer(outlen)
    __check(sodium.crypto_pwhash_scryptsalsa208sha256(out, ctypes.c_ulonglong(outlen), passwd, ctypes.c_ulonglong(len(passwd)), salt, ctypes.c_ulonglong(opslimit), ctypes.c_size_t(memlimit)))
    return out.raw

# int crypto_pwhash_scryptsalsa208sha256_str(char out[crypto_pwhash_scryptsalsa208sha256_STRBYTES],
#                                            const char * const passwd,
#                                            unsigned long long passwdlen,
#                                            unsigned long long opslimit,
#                                            size_t memlimit);
def crypto_pwhash_scryptsalsa208sha256_str(passwd, opslimit, memlimit):
    if None in (passwd, opslimit, memlimit):
        raise ValueError
    if not (crypto_pwhash_scryptsalsa208sha256_PASSWD_MIN <= len(passwd) <= crypto_pwhash_scryptsalsa208sha256_PASSWD_MAX): raise ValueError("invalid passwd len")
    if not (crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_MIN <= opslimit <= crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_MAX): raise ValueError("invalid opslimit")
    if not (crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_MIN <= memlimit <= crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_MAX): raise ValueError("invalid memlimit")
    out = ctypes.create_string_buffer(crypto_pwhash_scryptsalsa208sha256_STRBYTES)
    __check(sodium.crypto_pwhash_scryptsalsa208sha256_str(out, passwd, ctypes.c_ulonglong(len(passwd)), ctypes.c_ulonglong(opslimit), ctypes.c_size_t(memlimit)))
    return out.raw

#int crypto_pwhash_scryptsalsa208sha256_str_verify(const char str[crypto_pwhash_scryptsalsa208sha256_STRBYTES],
#                                                  const char * const passwd,
#                                                  unsigned long long passwdlen);
def crypto_pwhash_scryptsalsa208sha256_str_verify(stored, passwd):
    if stored is None or passwd is None:
       raise ValueError
    if not (crypto_pwhash_scryptsalsa208sha256_PASSWD_MIN <= len(passwd) <= crypto_pwhash_scryptsalsa208sha256_PASSWD_MAX): raise ValueError("invalid passwd len")
    if len(stored) != crypto_pwhash_scryptsalsa208sha256_STRBYTES: raise ValueError('invalid str size')

    __check(sodium.crypto_pwhash_scryptsalsa208sha256_str_verify(stored, passwd, ctypes.c_ulonglong(len(passwd))))

# int crypto_sign_ed25519_sk_to_pk(unsigned char *pk, const unsigned char *sk)
def crypto_sign_sk_to_pk(sk):
    if sk is None or len(sk) != crypto_sign_ed25519_SECRETKEYBYTES:
        raise ValueError
    res = ctypes.create_string_buffer(crypto_sign_ed25519_PUBLICKEYBYTES)
    __check(sodium.crypto_sign_ed25519_sk_to_pk(ctypes.byref(res), sk))
    return res.raw

# int crypto_hash_sha256(unsigned char *out, const unsigned char *in,
#                       unsigned long long inlen);
def crypto_hash_sha256(message):
    if message is None:
        raise ValueError("invalid parameters")
    out = ctypes.create_string_buffer(crypto_hash_sha256_BYTES)
    __check(sodium.crypto_hash_sha256(out, message, ctypes.c_ulonglong(len(message))))
    return out.raw

# int crypto_hash_sha512(unsigned char *out, const unsigned char *in,
#                       unsigned long long inlen);
def crypto_hash_sha512(message):
    if message is None:
        raise ValueError("invalid parameters")
    out = ctypes.create_string_buffer(crypto_hash_sha512_BYTES)
    __check(sodium.crypto_hash_sha512(out, message, ctypes.c_ulonglong(len(message))))
    return out.raw

# int crypto_kx_keypair(unsigned char pk[crypto_kx_PUBLICKEYBYTES],
#                      unsigned char sk[crypto_kx_SECRETKEYBYTES]);
@sodium_version(1, 0, 12)
def crypto_kx_keypair():
    pk = ctypes.create_string_buffer(crypto_kx_PUBLICKEYBYTES)
    sk = ctypes.create_string_buffer(crypto_kx_SECRETKEYBYTES)
    __check(sodium.crypto_kx_keypair(pk, sk))
    return pk.raw, sk.raw

# int crypto_kx_client_session_keys(unsigned char rx[crypto_kx_SESSIONKEYBYTES],
#                                  unsigned char tx[crypto_kx_SESSIONKEYBYTES],
#                                  const unsigned char client_pk[crypto_kx_PUBLICKEYBYTES],
#                                  const unsigned char client_sk[crypto_kx_SECRETKEYBYTES],
#                                  const unsigned char server_pk[crypto_kx_PUBLICKEYBYTES]);
@sodium_version(1, 0, 12)
def crypto_kx_client_session_keys(client_pk, client_sk, server_pk):
    if None in (client_pk, client_sk, server_pk):
        raise ValueError("invalid parameters")
    if not (len(client_pk) == crypto_kx_PUBLICKEYBYTES): raise ValueError("Invalid client public key")
    if not (len(client_sk) == crypto_kx_SECRETKEYBYTES): raise ValueError("Invalid client secret key")
    if not (len(server_pk) == crypto_kx_PUBLICKEYBYTES): raise ValueError("Invalid server public key")

    rx = ctypes.create_string_buffer(crypto_kx_SESSIONKEYBYTES)
    tx = ctypes.create_string_buffer(crypto_kx_SESSIONKEYBYTES)
    __check(sodium.crypto_kx_client_session_keys(rx, tx, client_pk, client_sk, server_pk))
    return rx.raw, tx.raw

# int crypto_kx_server_session_keys(unsigned char rx[crypto_kx_SESSIONKEYBYTES],
#                                  unsigned char tx[crypto_kx_SESSIONKEYBYTES],
#                                  const unsigned char server_pk[crypto_kx_PUBLICKEYBYTES],
#                                  const unsigned char server_sk[crypto_kx_SECRETKEYBYTES],
#                                  const unsigned char client_pk[crypto_kx_PUBLICKEYBYTES]);
@sodium_version(1, 0, 12)
def crypto_kx_server_session_keys(server_pk, server_sk, client_pk):
    if None in (server_pk, server_sk, client_pk):
        raise ValueError("invalid parameters")
    if not (len(server_pk) == crypto_kx_PUBLICKEYBYTES): raise ValueError("Invalid server public key")
    if not (len(server_sk) == crypto_kx_SECRETKEYBYTES): raise ValueError("Invalid server secret key")
    if not (len(client_pk) == crypto_kx_PUBLICKEYBYTES): raise ValueError("Invalid client public key")

    rx = ctypes.create_string_buffer(crypto_kx_SESSIONKEYBYTES)
    tx = ctypes.create_string_buffer(crypto_kx_SESSIONKEYBYTES)
    __check(sodium.crypto_kx_server_session_keys(rx, tx, server_pk, server_sk, client_pk))
    return rx.raw, tx.raw

# void sodium_increment(unsigned char *n, const size_t nlen)
@sodium_version(1, 0, 4)
def sodium_increment(n):
    sodium.sodium_increment(n, ctypes.c_size_t(len(n)))

# int crypto_core_ristretto255_is_valid_point(const unsigned char *p);
@sodium_version(1, 0, 18)
def crypto_core_ristretto255_is_valid_point(p):
    return sodium.crypto_core_ristretto255_is_valid_point(p) == 1

# int crypto_core_ristretto255_from_hash(unsigned char *p, const unsigned char *r);
@sodium_version(1, 0, 18)
def crypto_core_ristretto255_from_hash(r):
    if len(r) != crypto_core_ristretto255_HASHBYTES: raise ValueError("Invalid parameter, must be {} bytes".format(crypto_core_ristretto255_HASHBYTES))
    p = ctypes.create_string_buffer(crypto_core_ristretto255_BYTES)
    __check(sodium.crypto_core_ristretto255_from_hash(p,r))
    return p.raw

# int crypto_scalarmult_ristretto255(unsigned char *q, const unsigned char *n, const unsigned char *p);
@sodium_version(1, 0, 18)
def crypto_scalarmult_ristretto255(n, p):
    if None in (n,p):
        raise ValueError("invalid parameters")
    if len(n) != crypto_core_ristretto255_SCALARBYTES: raise ValueError("truncated scalar")
    if len(p) != crypto_core_ristretto255_BYTES: raise ValueError("truncated point")
    buf = ctypes.create_string_buffer(crypto_core_ristretto255_BYTES)
    __check(sodium.crypto_scalarmult_ristretto255(buf, n, p))
    return buf.raw

# int crypto_scalarmult_ristretto255_base(unsigned char *q, const unsigned char *n);
@sodium_version(1, 0, 18)
def crypto_scalarmult_ristretto255_base(n):
    if n is None:
        raise ValueError("invalid parameters")
    if len(n) != crypto_core_ristretto255_SCALARBYTES: raise ValueError("truncated scalar")
    buf = ctypes.create_string_buffer(crypto_core_ristretto255_BYTES)
    __check(sodium.crypto_scalarmult_ristretto255_base(buf, n))
    return buf.raw

# void crypto_core_ristretto255_scalar_random(unsigned char *r);
@sodium_version(1, 0, 18)
def crypto_core_ristretto255_scalar_random():
    r = ctypes.create_string_buffer(crypto_core_ristretto255_SCALARBYTES)
    sodium.crypto_core_ristretto255_scalar_random(r)
    return r.raw

# int crypto_core_ristretto255_scalar_invert(unsigned char *recip, const unsigned char *s);
@sodium_version(1, 0, 18)
def crypto_core_ristretto255_scalar_invert(s):
    if not s or len(s)!=crypto_core_ristretto255_SCALARBYTES: raise ValueError("Invalid param, must be {} bytes".format(crypto_core_ristretto255_SCALARBYTES))
    r = ctypes.create_string_buffer(crypto_core_ristretto255_SCALARBYTES)
    __check(sodium.crypto_core_ristretto255_scalar_invert(r,s))
    return r.raw

# void crypto_core_ristretto255_scalar_reduce(unsigned char *r, const unsigned char *s);
@sodium_version(1, 0, 18)
def crypto_core_ristretto255_scalar_reduce(s):
    if not s or len(s)!=crypto_core_ristretto255_NONREDUCEDSCALARBYTES: raise ValueError("Invalid parameter: must be {} bytes".format(crypto_core_ristretto255_NONREDUCEDSCALARBYTES))
    r = ctypes.create_string_buffer(crypto_core_ristretto255_SCALARBYTES)
    sodium.crypto_core_ristretto255_scalar_reduce(r,s)
    return r.raw

@sodium_version(1, 0, 12)
def crypto_kdf_derive_from_key(subkey_id, context, master_key):
    r = ctypes.create_string_buffer(crypto_kdf_KEYBYTES)
    __check(sodium.crypto_kdf_derive_from_key(r,
                                              crypto_kdf_KEYBYTES,
                                              ctypes.c_uint64(subkey_id),
                                              ctypes.c_char_p(context),
                                              ctypes.c_char_p(master_key)))
    return r.raw

@sodium_version(1, 0, 12)
def crypto_pwhash_easy(plaintext, salt=None):
    if not salt:
        salt = ctypes.create_string_buffer(crypto_pwhash_SALTBYTES)

    return crypto_pwhash(crypto_box_SEEDBYTES, plaintext, salt,
                         crypto_pwhash_OPSLIMIT_MODERATE, crypto_pwhash_MEMLIMIT_MODERATE)
