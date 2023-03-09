import sys
import uuid
import splunk.mining.conf as conf

def convertConfFile(infile, outfile):
    parsed = conf.ConfParser.parse(infile)
    
    if parsed is None:
        return False

    if "default" in parsed:
        del parsed["default"]

    if not "authentication" in parsed:
        print("Could not find the authentication stanza. Nothing to do.")
        return True

    if "authVersion" in parsed["authentication"] and parsed["authentication"]["authVersion"] == "v2":
        print("authVersion is already v2, nothing to do")
        return True

    if not "authType" in parsed["authentication"] or len(parsed["authentication"]["authType"]) == 0:
        print("Could not find the authType in the authentication stanza. Nothing to do.")
        return True

    authentication = parsed["authentication"]
    authType = parsed["authentication"]["authType"][0]

    if "authSettings" in authentication:
        if authType == "LDAP":
            domain = "ldapDefault"
            authSettings = authentication.pop("authSettings")[0]
            v1strats = authSettings.split(",")
            v2strats = []
            for s in v1strats:
                v1strat = s.strip()
                v2strat = domain + "_" + v1strat
                v2strats.append(v2strat)
                if v1strat in parsed:
                    parsed[v2strat] = parsed.pop(v1strat)

                v1RoleMapStrat = "roleMap_" + v1strat
                if v1RoleMapStrat in parsed:
                    parsed["roleMap_"+ v2strat] = parsed.pop(v1RoleMapStrat)

            parsed[domain] = dict()
            parsed[domain]["strategies"] = [','.join(v1strats)]
        else:
            domain = authentication.pop("authSettings")[0]
    else:
        domain = str(uuid.uuid4())

    authentication["authVersion"] = ["v2"]
    authentication["authDomains"] = ["splunk_auth," + domain]
    authentication["defaultDomain"] = [domain]
    parsed[domain]["authType"] = authentication.pop("authType")
    parsed["splunk_auth"]= {"authType":["Splunk"]}
    
    if "roleMap_SAML" in parsed:
        parsed["roleMap_"+ domain] = parsed.pop("roleMap_SAML")

    if "userToRoleMap_SAML" in parsed:
        parsed["userToRoleMap_"+ domain] = parsed.pop("userToRoleMap_SAML")

    if "authenticationResponseAttrMap_SAML" in parsed:
        parsed["authenticationResponseAttrMap_"+ domain] = parsed.pop("authenticationResponseAttrMap_SAML")

    if "lockedRoleToFullDNMap_SAML" in parsed:
            parsed["lockedRoleToFullDNMap_"+ domain] = parsed.pop("lockedRoleToFullDNMap_SAML")
    
    with open(outfile , 'w') as of:
        of.write(conf.ConfParser.toString(parsed))

    return True

if len(sys.argv) != 3:
    print ("Usage: %s <source> <destination>" % sys.argv[0])
    exit(0)

if not convertConfFile(sys.argv[1], sys.argv[2]):
    print ("Could not convert authentication.conf to v2 format.")
    exit(-1)

print ("Converted authentication.conf file to v2 format.")
