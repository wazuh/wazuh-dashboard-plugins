#!/usr/bin/python
# Wazuh agents load simulator
# Copyright (C) 2015-2020, Wazuh Inc.
# January 28, 2020.
#
# This program is free software; you can redistribute it
# and/or modify it under the terms of the GNU General Public
# License (version 2) as published by the FSF - Free Software
# Foundation.

# Python 3.7 or superior
# Dependencies
# pip3 install pycryptodome

import base64
import hashlib
import zlib
import socket
import threading
import json
import os
import ssl
import sys

from Crypto.Cipher import AES
from Crypto.Cipher import Blowfish
from Crypto.Util.Padding import pad, unpad
from struct import pack
from stat import S_IFLNK, S_IFREG, S_IRWXU, S_IRWXG, S_IRWXO
from time import mktime, localtime, sleep, time
from random import randint, sample, choice
from string import ascii_letters, digits
from random import randrange
from random import seed
from random import random

os_list = ["debian7", "debian8", "debian9", "debian10", "ubuntu12.04", "ubuntu14.04", "ubuntu16.04", "ubuntu18.04", "mojave"]
#os_list = ["debian7", "debian8", "debian9", "debian10", "ubuntu12.04", "ubuntu14.04", "ubuntu16.04", "ubuntu18.04"]
#os_list = ["ubuntu16.04"]
agent_count = 1

class Cipher:
  def __init__(self,data,key):
    self.block_size = 16
    self.data = data
    self.key_blowfish = key
    self.key_aes = key[:32]

  def encrypt_aes(self):
    iv = b'FEDCBA0987654321'
    cipher = AES.new(self.key_aes,AES.MODE_CBC,iv)
    crp = cipher.encrypt(pad(self.data, self.block_size))
    return (crp)

  def decrypt_aes(self):
    iv = b'FEDCBA0987654321'
    cipher = AES.new(self.key_aes,AES.MODE_CBC,iv)
    dcrp = cipher.decrypt(pad(self.data, self.block_size))
    return (dcrp)

  def encrypt_blowfish(self):
    iv = b'\xfe\xdc\xba\x98\x76\x54\x32\x10'
    cipher = Blowfish.new(self.key_blowfish, Blowfish.MODE_CBC, iv)
    crp = cipher.encrypt(self.data)
    return (crp)
class Agent:
    def __init__(self, manager_address, cypher="aes", os=None, inventory_sample=None, id=None, name=None, key=None, version="3.12", fim_eps=None, fim_integrity_eps=None, authd_password=None):
        self.id = id
        self.name = name
        self.key = key
        self.version = version
        self.cypher = cypher
        self.os = os
        self.fim_eps = 1000 if fim_eps == None else fim_eps
        self.fim_integrity_eps = 10 if fim_integrity_eps == None else fim_integrity_eps
        self.manager_address = manager_address
        self.encryption_key = ""
        self.keep_alive_msg = ""
        self.startup_msg = ""
        self.authd_password = authd_password
        self.inventory_sample = inventory_sample
        self.inventory = None
        self.fim = None
        self.modules = {
                        "keepalive": {"status": "enabled", "frequency": 60.0},
                        "fim": {"status": "enabled", "eps": self.fim_eps},
                        "fim_integrity": {"status": "disabled", "eps": self.fim_integrity_eps},
                        "syscollector": {"status": "disabled", "frequency": 60.0, "eps": 200},
                        }
        self.setup()
    # Set up agent: Keep alive, encryption key and start up msg.
    def setup(self):
        self.set_os()
        if self.id == None and self.name == None and self.key == None:
            self.set_name()
            self.register()
        self.create_encryption_key()
        self.createKeepAlive()
        self.createHCStartup()
        self.initializeModules()
    # Pick random OS
    def set_os(self):
        if self.os == None:
            self.os = os_list[agent_count % len(os_list) - 1]
    # Set agent name
    def set_name(self):
        if self.inventory_sample == None:
            self.name = "{}-{}-{}".format(agent_count, ''.join(sample('0123456789abcdef' * 2, 8)), self.os)
        else:
            self.name = "{}-{}-{}-{}".format(agent_count, ''.join(sample('0123456789abcdef' * 2, 8)), self.os, self.inventory_sample.replace(".",""))
    # Request agent key
    def register(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
        context.check_hostname = False
        context.verify_mode= ssl.CERT_NONE
        ssl_socket = context.wrap_socket(sock, server_hostname=self.manager_address)
        ssl_socket.connect((self.manager_address, 1515))
        if self.authd_password == None:
            event = "OSSEC A:'{}'\n".format(self.name).encode()
        else:
            event = "OSSEC PASS: {} OSSEC A:'{}'\n".format(self.authd_password, self.name).encode()
        ssl_socket.send(event)
        recv = ssl_socket.recv(4096)
        registration_info = recv.decode().split("'")[1].split(" ")
        self.id = registration_info[0]
        self.key = registration_info[3]
        ssl_socket.close()
        sock.close()
        print("Registration - {}({})".format(self.name, self.id))
    # Add the Wazuh custom padding to each event sent
    def wazuh_padding(self, compressed_event):
        padding = 8
        extra = len(compressed_event) % padding
        if extra > 0:
            padded_event = (b'!' * (padding - extra)) + compressed_event
        else:
            padded_event = (b'!' * (padding)) + compressed_event
        return (padded_event)
    # Generate encryption key (using agent metadata and key)
    def create_encryption_key(self):
        id = self.id.encode()
        name = self.name.encode()
        key = self.key.encode()
        sum1 = (hashlib.md5((hashlib.md5(name).hexdigest().encode() + hashlib.md5(id).hexdigest().encode())).hexdigest().encode())[:15]
        sum2 = hashlib.md5(key).hexdigest().encode()
        key = sum2 + sum1
        self.encryption_key = key
    # Compose event from raw message
    def compose_event(self, message):
        message = message.encode()
        random_number = b'55555'
        global_counter = b'1234567891'
        split = b':'
        local_counter = b'5555'
        msg = random_number + global_counter + split + local_counter + split + message
        msg_md5 = hashlib.md5(msg).hexdigest()
        event = msg_md5.encode() + msg
        return (event)
    # Encrypt event AES or Blowfish
    def encrypt(self, padded_event):
        if self.cypher == "aes":
            encrypted_event = Cipher(padded_event,self.encryption_key).encrypt_aes()
        if self.cypher == "blowfish":
            encrypted_event = Cipher(padded_event,self.encryption_key).encrypt_blowfish()
        return (encrypted_event)
    # Add event headers for AES or Blowfish Cyphers
    def headers(self, agentid, encrypted_event):
        if self.cypher == "aes":
            header = "!{0}!#AES:".format(agentid).encode()
        if self.cypher == "blowfish":
            header = "!{0}!:".format(agentid).encode()
        headers_event = header + encrypted_event
        return (headers_event)
    def createEvent(self, message):
        # Compose event
        event = self.compose_event(message)
        # Compress
        compressed_event = zlib.compress(event)
        # Padding
        padded_event = self.wazuh_padding(compressed_event)
        # Encrypt
        encrypted_event = self.encrypt(padded_event)
        # Add headers
        headers_event = self.headers(self.id, encrypted_event)
        return (headers_event)
    def receiveMessage(self, sender):
        while True:
            buffer_size = 65536
            buffer_array = bytearray(buffer_size)
            nbytes = sender.socket.recv_into(buffer_array, buffer_size)
            if nbytes == 0:
                print("nodata")
                continue
            msg = buffer_array[0:nbytes]
            msg_removeheader = bytes(msg[5:])
            msg_decrypted = Cipher(msg_removeheader,self.encryption_key).decrypt_aes()
            padding = 0
            while(msg_decrypted):
                if msg_decrypted[padding] == 33:
                    padding += 1
                else:
                    break
            msg_removepadding = msg_decrypted[padding:]
            msg_decompress = zlib.decompress(msg_removepadding)
            msg_decoded = msg_decompress.decode()
            print(msg_decoded)
            sleep(1)
    def createHCStartup(self):
        msg = "#!-agent startup "
        self.startup_msg = self.createEvent(msg)
    def createKeepAlive(self):
        with open('keepalives.txt', 'r') as fp:
            line = fp.readline()
            while line:
                if line.strip("\n") == self.os:
                    msg = fp.readline()
                    line = fp.readline()
                    while line and line.strip("\n") not in os_list:
                        msg = msg+line
                        line = fp.readline()
                    break
                line = fp.readline()
        self.keep_alive_msg = self.createEvent(msg)
    def initializeModules(self):
        if self.modules["syscollector"]["status"] == "enabled":
            self.inventory = Inventory(self.os, self.inventory_sample)
        if self.modules["fim"]["status"] == "enabled":
            self.fim = GeneratorFIM(self.id, self.name, self.version)
        if self.modules["fim_integrity"]["status"] == "enabled":
            self.fim_integrity = GeneratorIntegrityFIM(self.id, self.name, self.version)
class Inventory:
    def __init__(self, os, inventory_sample=None):
        self.os = os
        self.SYSCOLLECTOR = 'syscollector'
        self.SYSCOLLECTOR_MQ = 'd'
        self.inventory = []
        self.inventory_path = ""
        self.inventory_sample = inventory_sample
        self.setup()
    def setup(self):
        if self.inventory_sample == None:
            inventory_files = os.listdir("inventory/{}".format(self.os))
            self.inventory_path = "inventory/{}/{}".format(self.os, choice(inventory_files))
        else:
            self.inventory_path = "inventory/{}/{}".format(self.os, self.inventory_sample)
        with open(self.inventory_path) as fp:
            line = fp.readline()
            while line:
                if not line.startswith("#"):
                    msg = "{0}:{1}:{2}".format(self.SYSCOLLECTOR_MQ, self.SYSCOLLECTOR, line.strip("\n"))
                    self.inventory.append(msg)
                line = fp.readline()
class GeneratorIntegrityFIM:
    def __init__(self, agent_id, agent_name, agent_version):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.agent_version = agent_version
        self.INTEGRITY_MQ = "5"
        self.event_type = None
        self.fim_generator = GeneratorFIM(self.agent_id, self.agent_name, self.agent_version)
    def formatMessage(self, message):
        return ('{0}:[{1}] ({2}) any->syscheck:{3}'.format(self.INTEGRITY_MQ, self.agent_id, self.agent_name, message))
    def generateMessage(self):
        if self.event_type == "integrity_check_global" or \
            self.event_type == "integrity_check_left" or self.event_type == "integrity_check_right":
            id = int(time())
            data = {"id": id, "begin": self.fim_generator.randfile(), "end": self.fim_generator.randfile(), "checksum": self.fim_generator.randsha1()}

        if self.event_type == "integrity_clear":
            id = int(time())
            data = {"id": id}

        if self.event_type == "state":
            timestamp = int(time())
            self.fim_generator.generateAttributes()
            attributes = self.fim_generator.getAttributes()
            data = {"path": self.fim_generator._file, "timestamp": timestamp, "attributes": attributes}

        message = json.dumps({"component": "syscheck", "type": self.event_type, "data": data})
        return self.formatMessage(message)
    def getMessage(self, event_type=None):
        if event_type is not None:
            self.event_type = event_type
        else:
            self.event_type = choice(["integrity_check_global", "integrity_check_left", "integrity_check_right", "integrity_clear", "state"])
            #self.event_type = choice(["state"])

        return self.generateMessage()
class GeneratorFIM:
    def __init__(self, agent_id, agent_name, agent_version):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.agent_version = agent_version
        self.FILE_ROOT = '/root/'
        self._file = self.FILE_ROOT + 'a'
        self._size = 0
        self._mode = S_IFREG | S_IRWXU
        self._uid = 0
        self._gid = 0
        self._md5 = 'xxx'
        self._sha1 = 'xxx'
        self._sha256 = 'xxx'
        self._uname = 'root'
        self._gname = 'root'
        self._mdate = int(mktime(localtime()))
        self._permissions = "rw-r--r--"
        self._inode = 0
        self._checksum = "f65b9f66c5ef257a7566b98e862732640d502b6f"
        self.SYSCHECK = 'syscheck'
        self.SYSCHECK_MQ = 8
        self.DEFAULT_FILE_LENGTH = 10
        self.MAX_SIZE = 1024
        self.USERS = {0: 'root', 1000: 'Dave', 1001: 'Connie'}
        self.MAX_TIMEDIFF = 3600
        self.MAX_INODE = 1024
        self.baseline_completed = 0
        self.event_mode = None
        self.event_type = None
    def randfile(self):
        self._file = self.FILE_ROOT + ''.join(sample(ascii_letters + digits, self.DEFAULT_FILE_LENGTH))
        return self._file
    def randsize(self):
        self._size = randint(-1, self.MAX_SIZE)
        return self._size
    def randmode(self):
        self._mode = choice((S_IFREG, S_IFLNK))

        if self._mode == S_IFLNK:
            self._mode |= S_IRWXU | S_IRWXG | S_IRWXO
            self._md5 = 'xxx'
            self._sha1 = 'xxx'
        else:
            s = sample((S_IRWXU, S_IRWXG, S_IRWXO), 2)
            self._mode |= s[0] | s[1]

        return self._mode
    def randuid(self):
        self._uid = choice(list(self.USERS.keys()))
        self._uname = self.USERS[self._uid]
        return self._uid, self._uname
    def randgid(self):
        self._gid = choice(list(self.USERS.keys()))
        self._gname = self.USERS[self._gid]
        return self._gid, self._gname
    def randmd5(self):
        if self._mode & S_IFREG == S_IFREG:
            self._md5 = ''.join(sample('0123456789abcdef' * 2, 32))

        return self._md5
    def randsha1(self):
        if self._mode & S_IFREG == S_IFREG:
            self._sha1 = ''.join(sample('0123456789abcdef' * 3, 40))

        return self._sha1
    def randsha256(self):
        if self._mode & S_IFREG == S_IFREG:
            self._sha256 = ''.join(sample('0123456789abcdef' * 4, 64))

        return self._sha256
    def randtime(self):
        self._mdate += randint(1, self.MAX_TIMEDIFF)
        return self._mdate
    def randinode(self):
        self._inode = randint(1, self.MAX_INODE)
        return self._inode
    def generateAttributes(self):
        self.randfile()
        self.randsize()
        self.randmode()
        self.randuid()
        self.randgid()
        self.randmd5()
        self.randsha1()
        self.randsha256()
        self.randtime()
        self.randinode()
    def checkChangedAttributes(self, attributes, old_attributes):
        changed_attributes = []
        if attributes["size"] != old_attributes["size"]:
            changed_attributes.append("size")
        if attributes["perm"] != old_attributes["perm"]:
            changed_attributes.append("permission")
        if attributes["uid"] != old_attributes["uid"]:
            changed_attributes.append("uid")
        if attributes["gid"] != old_attributes["gid"]:
            changed_attributes.append("gid")
        if attributes["user_name"] != old_attributes["user_name"]:
            changed_attributes.append("user_name")
        if attributes["group_name"] != old_attributes["group_name"]:
            changed_attributes.append("group_name")
        if attributes["inode"] != old_attributes["inode"]:
            changed_attributes.append("inode")
        if attributes["mtime"] != old_attributes["mtime"]:
            changed_attributes.append("mtime")
        if attributes["hash_md5"] != old_attributes["hash_md5"]:
            changed_attributes.append("md5")
        if attributes["hash_sha1"] != old_attributes["hash_sha1"]:
            changed_attributes.append("sha1")
        if attributes["hash_sha256"] != old_attributes["hash_sha256"]:
            changed_attributes.append("sha256")

        return (changed_attributes)
    def getAttributes(self):
        attributes = {
                    "type": "file", "size": self._size, "perm": self._permissions, "uid": str(self._uid), "gid": str(self._gid),  \
                    "user_name": self._uname, "group_name": self._gname, "inode": self._inode, "mtime": self._mdate, \
                    "hash_md5": self._md5, "hash_sha1": self._sha1, "hash_sha256": self._sha256, "checksum" : self._checksum \
                    }
        return (attributes)
    def formatMessage(self, message):
        if self.agent_version == "3.12":
            return ('{0}:[{1}] ({2}) any->syscheck:{3}'.format(self.SYSCHECK_MQ, self.agent_id, self.agent_name, message))
        if self.agent_version == "3.11":
            # If first time generating. Send control message to simulate end of FIM baseline.
            if self.baseline_completed == 0:
                self.baseline_completed = 1
                return ('{0}:{1}:{2}'.format(self.SYSCHECK_MQ, self.SYSCHECK, "syscheck-db-completed"))
            return ('{0}:{1}:{2}'.format(self.SYSCHECK_MQ, self.SYSCHECK, message))
    def generateMessage(self):
        if self.agent_version == "3.12":
            if self.event_type == "added":
                timestamp = int(time())
                self.generateAttributes()
                attributes = self.getAttributes()
                data = {"path": self._file, "mode": self.event_mode, "type": self.event_type, "timestamp": timestamp, "attributes": attributes}
            if self.event_type == "modified":
                timestamp = int(time())
                self.generateAttributes()
                attributes = self.getAttributes()
                self.generateAttributes()
                old_attributes = self.getAttributes()
                changed_attributes = self.checkChangedAttributes(attributes, old_attributes)
                data = {"path": self._file, "mode": self.event_mode, "type": self.event_type, "timestamp": timestamp, "attributes": attributes, "old_attributes": old_attributes, "changed_attributes": changed_attributes}

            if self.event_type == "deleted":
                timestamp = int(time())
                self.generateAttributes()
                attributes = self.getAttributes()
                data = {"path": self._file, "mode": self.event_mode, "type": self.event_type, "timestamp": timestamp, "attributes": attributes}

            message = json.dumps({"type": "event", "data": data})

        if self.agent_version == "3.11":
            self.generateAttributes()
            message = '{0}:{1}:{2}:{3}:{4}:{5}:{6}:{7}:{8}:{9} {10}'.format( \
                   self._size, self._mode, self._uid, self._gid, self._md5, \
                   self._sha1, self._uname, self._gname, self._mdate, \
                   self._inode, self._file)

        return self.formatMessage(message)
    def getMessage(self, event_mode=None, event_type=None):
        if event_mode is not None:
            self.event_mode = event_mode
        else:
            self.event_mode = choice(["real-time", "whodata", "scheduled"])

        if event_type is not None:
            self.event_type = event_type
        else:
            self.event_type = choice(["added", "modified", "deleted"])

        return self.generateMessage()
class Sender:
    def __init__(self, manager_address, manager_port="1514", protocol="tcp"):
        self.manager_address = manager_address
        self.manager_port = manager_port
        self.protocol = protocol
        if self.protocol == "tcp":
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.manager_address, int(self.manager_port)))
        if self.protocol == "udp":
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def sendEvent(self, event):
        if self.protocol == "tcp":
            length = pack('<I', len(event))
            self.socket.send(length+event)
            #return(self.socket.recv(2048))
            #self.socket.close() # Not closing. It will close the socket on Ctrl+C.
        if self.protocol == "udp":
            self.socket.sendto(event, (self.manager_address, int(self.manager_port)))
        return(0)
class Injector:
    def __init__(self, sender, agent):
        self.sender = sender
        self.agent = agent
        self.thread_number = 0
        self.threads = []
        for module, config in self.agent.modules.items():
            if config["status"] == "enabled":
                self.threads.append(InjectorThread(self.thread_number, "Thread-"+str(self.agent.id)+str(module), self.sender, self.agent, module))
                self.thread_number += 1
    def run(self):
        for thread in range(self.thread_number):
            self.threads[thread].setDaemon(True)
            self.threads[thread].start()
class InjectorThread (threading.Thread):
    def __init__(self, threadID, name, sender, agent, module):
        threading.Thread.__init__(self)
        self.threadID = threadID
        self.name = name
        self.sender = sender
        self.agent = agent
        self.totalMessages = 0
        self.module = module
    def keepalive(self):
        sleep(10)
        print("Startup - {}({})".format(self.agent.name, self.agent.id))
        self.sender.sendEvent(self.agent.startup_msg)
        self.sender.sendEvent(self.agent.keep_alive_msg)
        starttime=time()
        while(1):
            # Send agent keep alive
            print("KeepAlive - {}({})".format(self.agent.name, self.agent.id))
            self.sender.sendEvent(self.agent.keep_alive_msg)
            sleep(self.agent.modules["keepalive"]["frequency"] - ((time() - starttime) % self.agent.modules["keepalive"]["frequency"]))
    def fim(self):
        sleep(10)
        starttime=time()
        # Loop events
        while(1):
            #event = self.agent.createEvent(self.agent.fim.getMessage(event_type="added"))
            event = self.agent.createEvent(self.agent.fim.getMessage())
            self.sender.sendEvent(event)
            self.totalMessages += 1
            if self.totalMessages % self.agent.modules["fim"]["eps"] == 0:
                sleep(1.0 - ((time() - starttime) % 1.0))
    def fim_integrity(self):
        sleep(10)
        starttime=time()
        # Loop events
        while(1):
            event = self.agent.createEvent(self.agent.fim_integrity.getMessage())
            self.sender.sendEvent(event)
            self.totalMessages += 1
            if self.totalMessages % self.agent.modules["fim_integrity"]["eps"] == 0:
                sleep(1.0 - ((time() - starttime) % 1.0))
    def inventory(self):
        sleep(10)
        starttime=time()
        while(1):
            # Send agent inventory scan
            print("Scan started - {}({}) - {}({})".format(self.agent.name, self.agent.id, "syscollector", self.agent.inventory.inventory_path))
            scan_id = int(time()) # Random start scan ID
            for item in self.agent.inventory.inventory:
                event = self.agent.createEvent(item.replace("<scan_id>",str(scan_id)))
                self.sender.sendEvent(event)
                self.totalMessages += 1
                if self.totalMessages % self.agent.modules["syscollector"]["eps"] == 0:
                    self.totalMessages = 0
                    sleep(1.0 - ((time() - starttime) % 1.0))
            print("Scan ended - {}({}) - {}({})".format(self.agent.name, self.agent.id, "syscollector", self.agent.inventory.inventory_path))
            sleep(self.agent.modules["syscollector"]["frequency"] - ((time() - starttime) % self.agent.modules["syscollector"]["frequency"]))
    def run(self):
        #message = "1:/var/log/syslog:Jan 29 10:03:41 master sshd[19635]: pam_unix(sshd:session): session opened for user vagrant by (uid=0) uid: 0"
        print("Starting - {}({})({}) - {}".format(self.agent.name, self.agent.id, self.agent.os, self.module))
        if self.module == "keepalive":
            self.keepalive()
        elif self.module == "fim":
            self.fim()
        elif self.module == "syscollector":
            self.inventory()
        elif self.module == "fim_integrity":
            self.fim_integrity()
        else:
            print("Module unknown: {}".format(self.module))

def create_agents_all_inventory(manager_address, cypher): # TMP
    global agent_count
    agents = []
    for os_folder in os_list:
        inventory_files = os.listdir("inventory/{}".format(os_folder))
        for sample_file in inventory_files:
            agents.append(Agent(manager_address, cypher, os=os_folder, inventory_sample=sample_file))
            agent_count = agent_count + 1
    return agents
def create_agents(agents_number, manager_address, cypher, fim_eps=None, authd_password=None):
    global agent_count
    # Read client.keys and create virtual agents
    agents = []
    for agent in range(agents_number):
        if authd_password != None:
            agents.append(Agent(manager_address, cypher, fim_eps=fim_eps, authd_password=authd_password))
        else:
            agents.append(Agent(manager_address, cypher, fim_eps=fim_eps))
        agent_count = agent_count + 1
    return agents

def main():
    # Arguments
    #manager_address = "172.16.5.10" # local
    manager_address = "nlb-env-5daf386292d6-523ad6c9f1872924.elb.us-east-2.amazonaws.com" #cloud
    #manager_address = "54.161.60.30" #c5
    agents_number = 1
    agents = []
    protocol = "tcp"
    cypher = "aes"
    fim_eps = None
    total_duration = None
    authd_password = None
    agents_version = "3.12"
    #message = "1:/var/log/syslog:Jan 29 10:03:41 master sshd[19635]: pam_unix(sshd:session): session opened for user vagrant by (uid=0) uid: 0"

    # Parse arguments
    if len(sys.argv) > 1 and sys.argv[1]:
        manager_address = sys.argv[1]
    if len(sys.argv) > 2 and sys.argv[2]:
        agents_number = int(sys.argv[2])
    if len(sys.argv) > 3 and sys.argv[3]:
        fim_eps = int(sys.argv[3])
    if len(sys.argv) > 4 and sys.argv[4]:
        total_duration = int(sys.argv[4])
    if len(sys.argv) > 5 and sys.argv[5]:
        protocol = sys.argv[5]
    if len(sys.argv) > 6 and sys.argv[6]:
        authd_password = sys.argv[6]

    # Customization for Docker with Environment variables
    manager_address = os.getenv('WAZUH_MANAGER_ADDRESS') or manager_address
    agents_number = os.getenv('WAZUH_AGENTS') or agents_number
    fim_eps = os.getenv('WAZUH_AGENTS_FIM_EPS') or fim_eps
    total_duration = os.getenv('WAZUH_AGENTS_SIMULATION_DURATION') or total_duration
    protocol = os.getenv('WAZUH_MANAGER_PROTOCOL') or protocol
    authd_password = os.getenv('WAZUH_MANAGER_PASSWORD') or authd_password
    agents_version = os.getenv('WAZUH_AGENTS_VERSION') or agents_version

    # Register and connect <agents_number> agents
    agents = create_agents(agents_number, manager_address, cypher, fim_eps=fim_eps, authd_password=authd_password)

    # Register and connect one each per each Inventory sample and OS
    #agents = create_agents_all_inventory(manager_address, cypher)

    # Create one agent
    #agents.append(Agent(manager_address, cypher, id="864", name="1-528113f0-debian7", key="83289936c8cb3731e776c5ee15c8f67b3359e126654ff20d172c47b693aaf475", version="3.12"))
    #agents = [Agent(manager_address, cypher, version="3.12")]
    #agent_count = len(agents)

    # Create sender and injector per agent
    sender = Sender(manager_address, protocol=protocol)
    for agent in agents:
        injector = Injector(sender, agent)
        injector.run()
        if protocol == "tcp":
            sender = Sender(manager_address, protocol=protocol)

    #agents[0].receiveMessage(sender)

    if total_duration != None:
        sleep(total_duration)
        sys.exit(0)
    else:
        while True:
            sleep(60)

if __name__ == '__main__':
    main()
