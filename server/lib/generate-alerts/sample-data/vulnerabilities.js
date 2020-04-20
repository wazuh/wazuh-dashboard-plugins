// Vulnerability
export const severity = ["Low", "Medium", "High", "Critical"];
export const packageName = ["bluez", "gcc-mingw-w64", "squashfs-tools", "util-linux", "accountsservice", "git", "node", "zip", "kernel"];
export const cve = ["CVE-2017-11671", "CVE-2008-7320", "CVE-2011-1011", "CVE-2012-0881", "CVE-2012-1093"];
export const cweReference = ["CWE-527", "CWE-911", "CWE-409", "CWE-102", "CWE-120", "CWE-420", "CWE-322", "CWE-789"];

export const data = [
  {
      title: 'An issue was discovered in zlib_decompress_extra in modules/demux/mkv/util.cpp in VideoLAN VLC media player 3.x through 3.0.7. The Matroska demuxer, while parsing a malformed MKV file type, has a double free.',
      reference: 'http://git.videolan.org/?p=vlc.git;a=commit;h=81023659c7de5ac2637b4a879195efef50846102'
  },
  {
      title: 'bash: BASH_CMD is writable in restricted bash shells',
      reference: 'https://access.redhat.com/security/cve/CVE-2019-9924'
  },
  {
      title: 'CVE-2017-16808',
      reference: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-16808'
  },
  {
      title: 'CVE-2017-9763 on Ubuntu 18.04 LTS (bionic) - medium.',
      reference: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-9763'
  },
  {
      title: 'CVE-2018-10105',
      reference: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-10105'
  },
  {
      title: 'CVE-2018-14462',
      reference: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-14462'
  },
  {
      title: 'CVE-2018-14463',
      reference: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-14463'
  },
  {
      title: 'CVE-2018-14466',
      reference: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-14466'
  },
  {
      title: 'CVE-2018-5710 on Ubuntu 18.04 LTS (bionic) - low.',
      reference: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-5710'
  }
]