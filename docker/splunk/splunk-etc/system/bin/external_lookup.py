#!/usr/bin/env python

import csv
import sys
import socket

""" An adapter that takes CSV as input, performs a lookup to the operating
    system hostname resolution facilities, then returns the CSV results 

    This is intended as an example of creating external lookups in general.

    Note that the script offers mapping both ways, from host to IP and from IP
    to host.  
    
    Bidrectional mapping is always required when using an external lookup as an
    'automatic' lookup: one configured to be used without explicit reference in
    a search.

    In the other use mode, eg in a search string as "|lookup lookupname", it is
    sufficient to provide only the mappings that will be used.

    WARNING: DNS is not unambiguously reversible, so this script will produce
             unusual results when used for values that do not reverse-resolve to
             their original values in your environment.

             For example, if your events have host=foo, and you search for
             ip=1.2.3.4, the generated search expression may be
             host=foo.yourcompany.com, which will not match.
"""


# Given a host, find the ip
def lookup(host):
    try:
        hostname, aliaslist, ipaddrlist = socket.gethostbyname_ex(host)
        return ipaddrlist
    except:
        return []

# Given an ip, return the host
def rlookup(ip):
    try:
        hostname, aliaslist, ipaddrlist = socket.gethostbyaddr(ip)
        return hostname
    except:
        return ''

def main():
    if len(sys.argv) != 3:
        print("Usage: python external_lookup.py [host field] [ip field]")
        sys.exit(1)

    hostfield = sys.argv[1]
    ipfield = sys.argv[2]

    infile = sys.stdin
    outfile = sys.stdout

    r = csv.DictReader(infile)
    header = r.fieldnames

    w = csv.DictWriter(outfile, fieldnames=r.fieldnames)
    w.writeheader()

    for result in r:
        # Perform the lookup or reverse lookup if necessary
        if result[hostfield] and result[ipfield]:
            # both fields were provided, just pass it along
            w.writerow(result)

        elif result[hostfield]:
            # only host was provided, add ip
            ips = lookup(result[hostfield])
            for ip in ips:
                result[ipfield] = ip
                w.writerow(result)

        elif result[ipfield]:
            # only ip was provided, add host
            result[hostfield] = rlookup(result[ipfield])
            if result[hostfield]:
                w.writerow(result)

main()
