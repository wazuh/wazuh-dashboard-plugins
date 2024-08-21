if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    'use strict';

    if (search instanceof RegExp) {
      throw TypeError('first argument must not be a RegExp');
    }
    if (start === undefined) {
      start = 0;
    }
    return this.indexOf(search, start) !== -1;
  };
}

var queryParamsQ = context.request.queryParams.q;
var payload;

if (queryParamsQ && queryParamsQ.includes('type=file')) {
  payload = {
    data: {
      affected_items: [
        {
          changes: 1,
          date: '2019-11-22T10:24:52Z',
          file: '/etc/resolv.conf',
          gid: '0',
          gname: 'root',
          inode: 1459742,
          md5: '731423fa8ba067262f8ef37882d1e742',
          mtime: '2009-02-02T23:06:58Z',
          perm: '100644',
          sha1: 'b65f7f2af66c53b51765877bbe91a22bc6fca1e2',
          sha256:
            '50f35af8ac4a5df3690991a4b428fa49d56580b0020fcc6e38283b3b1b2e6c74',
          size: 82,
          type: 'file',
          uid: '0',
          uname: 'root',
          attributes: '',
        },
        {
          changes: 1,
          date: '2019-11-22T10:24:56Z',
          file: '/etc/sgml/xml-core.cat',
          gid: '0',
          gname: 'root',
          inode: 2896763,
          md5: '055ba0bd3154c0a58b9bf8a0c9ecf2fa',
          mtime: '2012-11-07T21:44:21Z',
          perm: '100644',
          sha1: '3dec5570307472381671ff18bbe4d4be09951690',
          sha256:
            '3c46704b553c4b55ce928ffe89badfcfd08a02f0e6558211dfd57d9ae1e72aa4',
          size: 45,
          type: 'file',
          uid: '0',
          uname: 'root',
          attributes: '',
        },
      ],
      total_affected_items: 2,
      total_failed_items: 0,
      failed_items: [],
    },
    message: 'FIM findings of the agent were returned',
    error: 0,
  };
} else if (queryParamsQ && queryParamsQ.includes('type=registry_key')) {
  payload = {
    data: {
      affected_items: [
        {
          file: 'HKEY_LOCAL_MACHINE\\SYSTEM\\Setup',
          mtime: '2009-02-02T23:06:58Z',
        },
        {
          file: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\test',
          mtime: '2009-02-02T23:06:58Z',
        },
      ],
      total_affected_items: 2,
      total_failed_items: 0,
      failed_items: [],
    },
    message: 'FIM findings of the agent were returned',
    error: 0,
  };
} else {
  payload = {
    data: {
      affected_items: [
        {
          changes: 1,
          date: '2019-11-22T10:24:52Z',
          file: '/etc/resolv.conf',
          gid: '0',
          gname: 'root',
          inode: 1459742,
          md5: '731423fa8ba067262f8ef37882d1e742',
          mtime: '2009-02-02T23:06:58Z',
          perm: '100644',
          sha1: 'b65f7f2af66c53b51765877bbe91a22bc6fca1e2',
          sha256:
            '50f35af8ac4a5df3690991a4b428fa49d56580b0020fcc6e38283b3b1b2e6c74',
          size: 82,
          type: 'file',
          uid: '0',
          uname: 'root',
          attributes: '',
        },
        {
          changes: 1,
          date: '2019-11-22T10:24:56Z',
          file: '/etc/sgml/xml-core.cat',
          gid: '0',
          gname: 'root',
          inode: 2896763,
          md5: '055ba0bd3154c0a58b9bf8a0c9ecf2fa',
          mtime: '2012-11-07T21:44:21Z',
          perm: '100644',
          sha1: '3dec5570307472381671ff18bbe4d4be09951690',
          sha256:
            '3c46704b553c4b55ce928ffe89badfcfd08a02f0e6558211dfd57d9ae1e72aa4',
          size: 45,
          type: 'file',
          uid: '0',
          uname: 'root',
          attributes: '',
        },
      ],
      total_affected_items: 2,
      total_failed_items: 0,
      failed_items: [],
    },
    message: 'FIM findings of the agent were returned',
    error: 0,
  };
}

respond().withStatusCode(200).withData(JSON.stringify(payload));
