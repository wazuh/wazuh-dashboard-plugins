#!/usr/bin/env python3
"""
Seeds a realistic UAT dataset into the Wazuh 5.0 indices so the AI Assistant has something to
actually answer questions about. Runs ON the VM (talks to https://localhost:9200).

Field paths are taken ONLY from the shapes already confirmed against the live 5.0 templates by
seed_findings.sh / seed_vuln_states.sh / seed_states_wave2.sh — the templates are `dynamic: strict`,
so an invented path is rejected outright (which is also a useful contract check: this script fails
loudly rather than silently seeding nothing).

What it creates:
  * ~210 security findings across 5 agents / 4 severities / 7 days, including
      - an sshd brute-force burst from one source IP against several usernames
      - suspicious PowerShell on a Windows host
      - web exploitation, malware drop, FIM-ish and PAM session events
      - MITRE technique+tactic and PCI DSS tags throughout
  * ~16 vulnerability state docs (Critical..Low) with real CVE ids and packages
  * a few extra FIM file states on more than one agent

Usage (on the VM):  python3 <plugin>/eval/seed_uat_dataset.py [admin-password]
Reset:              python3 <plugin>/eval/seed_uat_dataset.py --purge
Events only:        python3 <plugin>/eval/seed_uat_dataset.py --events-only
"""
import hashlib
import json
import random
import ssl
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

PASS = "admin"
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
if ARGS:
    PASS = ARGS[0]
PURGE = "--purge" in sys.argv
EVENTS_ONLY = "--events-only" in sys.argv
IDX = "https://localhost:9200"
FINDINGS = "wazuh-findings-v5-security"
SEED_MARK = "uat-seed"

random.seed(20260725)  # deterministic dataset

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
import base64

AUTH = "Basic " + base64.b64encode(f"admin:{PASS}".encode()).decode()


def req(method, path, body=None, ndjson=False):
    url = f"{IDX}{path}"
    data = None
    headers = {"Authorization": AUTH}
    if body is not None:
        if ndjson:
            data = body.encode()
            headers["Content-Type"] = "application/x-ndjson"
        else:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, context=ctx) as resp:
        return json.loads(resp.read().decode() or "{}")


AGENTS = [
    ("001", "wazuh-server-01", "Ubuntu", "22.04", "ubuntu"),
    ("002", "web-prod-01", "Ubuntu", "22.04", "ubuntu"),
    ("003", "web-prod-02", "Ubuntu", "22.04", "ubuntu"),
    ("004", "db-prod-01", "Ubuntu", "20.04", "ubuntu"),
    ("005", "win-dc-01", "Microsoft Windows Server 2019", "10.0.17763", "windows"),
]

# (rule id, severity word, description, tags, category, mitre tid, mitre tname, tactic, pci)
RULES = [
    (92213, "critical", "Executable file dropped in folder commonly used by malware",
     ["malware", "sysmon"], "malware", "T1204", "User Execution", "Execution", ["11.5"]),
    (31169, "critical", "Shellshock attack detected",
     ["attack", "web"], "intrusion", "T1190", "Exploit Public-Facing Application", "Initial Access", ["6.5.1"]),
    (31151, "high", "Multiple web server 400 error codes from same source ip",
     ["attack", "web"], "intrusion", "T1190", "Exploit Public-Facing Application", "Initial Access", ["6.5.1"]),
    (5710, "high", "Attempt to login using a non-existent user",
     ["authentication_failed", "sshd"], "authentication", "T1110", "Brute Force", "Credential Access", ["10.2.4"]),
    (5712, "high", "sshd brute force trying to get access to the system",
     ["authentication_failures", "sshd"], "authentication", "T1110", "Brute Force", "Credential Access", ["10.2.4"]),
    (5716, "high", "sshd: authentication failed",
     ["authentication_failed", "sshd"], "authentication", "T1110", "Brute Force", "Credential Access", ["10.2.4"]),
    (91802, "high", "Suspicious PowerShell encoded command executed",
     ["powershell", "windows"], "malware", "T1059.001", "PowerShell", "Execution", ["10.6.1"]),
    (550, "medium", "Integrity checksum changed",
     ["fim", "syscheck"], "file_integrity", "T1565", "Data Manipulation", "Impact", ["11.5"]),
    (5501, "medium", "PAM login session opened",
     ["pam", "syslog"], "authentication", "T1078", "Valid Accounts", "Persistence", ["8.1.1"]),
    (5502, "medium", "PAM login session closed",
     ["pam", "syslog"], "authentication", "T1078", "Valid Accounts", "Persistence", ["8.1.1"]),
    (2501, "low", "syslog: User authentication failure",
     ["syslog"], "system", "T1005", "Data from Local System", "Collection", ["10.6.1"]),
    (1002, "low", "Unknown problem somewhere in the system",
     ["syslog"], "system", "T1005", "Data from Local System", "Collection", ["10.6.1"]),
]

USERS = ["root", "admin", "oracle", "vagrant", "postgres", "svc_backup"]
SRC_IPS = ["198.51.100.77", "203.0.113.7", "198.51.100.10", "192.0.2.44", "10.0.0.5"]


def finding(ts, agent, rule, src_ip, src_user, dst_user, proc, cmd):
    aid, aname, osname, osver, osplat = agent
    rid, sev, desc, tags, cat, tid, tname, tac, pci = rule
    return {
        "@timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "wazuh": {
            "agent": {"id": aid, "name": aname, "groups": ["default", SEED_MARK]},
            "cluster": {"name": "wazuh", "node": "master"},
            "schema": {"version": "1.0"},
            "rule": {
                "id": str(rid), "level": sev, "description": desc, "title": desc,
                "tags": tags, "category": cat,
                "mitre": {"technique": {"id": tid, "name": tname}, "tactic": {"name": tac}},
                "compliance": {"pci_dss": pci},
            },
        },
        "source": {"ip": src_ip, "port": random.randint(1024, 65000), "user": {"name": src_user}},
        "destination": {"user": {"name": dst_user}},
        "host": {"os": {"name": osname, "version": osver, "platform": osplat}},
        "process": {"name": proc, "command_line": cmd},
    }


def build_findings():
    now = datetime.now(timezone.utc)
    docs = []

    # 1) sshd brute-force burst: ONE attacker IP, several usernames, against web-prod-01, last ~3h
    brute = [r for r in RULES if r[0] in (5710, 5712, 5716)]
    for i in range(42):
        ts = now - timedelta(minutes=random.randint(5, 200))
        docs.append(finding(ts, AGENTS[1], random.choice(brute), "198.51.100.77",
                            random.choice(["admin", "root", "oracle", "test"]), "",
                            "sshd", "sshd: unknown user [preauth]"))

    # 2) suspicious PowerShell on the Windows host, last 24h
    ps = next(r for r in RULES if r[0] == 91802)
    for i in range(9):
        ts = now - timedelta(hours=random.randint(1, 23))
        docs.append(finding(ts, AGENTS[4], ps, "192.0.2.44", "svc_backup", "Administrator",
                            "powershell.exe",
                            "powershell.exe -NoP -W Hidden -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoA"))

    # 3) web exploitation + malware drops, spread over 7 days
    for rid in (31169, 92213, 31151):
        rule = next(r for r in RULES if r[0] == rid)
        for i in range(12):
            ts = now - timedelta(hours=random.randint(1, 24 * 7))
            docs.append(finding(ts, random.choice([AGENTS[1], AGENTS[2]]), rule,
                                random.choice(["203.0.113.7", "198.51.100.10"]),
                                "www-data", "root", "apache2", "/usr/sbin/apache2 -k start"))

    # 4) routine PAM sessions / FIM / syslog noise across all agents, 7 days
    routine = [r for r in RULES if r[0] in (5501, 5502, 550, 2501, 1002)]
    for i in range(135):
        ts = now - timedelta(hours=random.randint(0, 24 * 7))
        agent = random.choice(AGENTS)
        rule = random.choice(routine)
        user = random.choice(USERS)
        docs.append(finding(ts, agent, rule, random.choice(SRC_IPS), user, user,
                            "sshd" if agent[4] != "windows" else "winlogon.exe",
                            f"session for {user}"))
    return docs


def bulk_findings(docs):
    lines = []
    for d in docs:
        lines.append(json.dumps({"create": {"_index": FINDINGS}}))
        lines.append(json.dumps(d))
    payload = "\n".join(lines) + "\n"
    res = req("POST", "/_bulk?refresh=true", payload, ndjson=True)
    errs = [i for i in res.get("items", []) if (i.get("create") or i.get("index", {})).get("status", 500) not in (200, 201)]
    print(f"findings: sent {len(docs)}, errors={res.get('errors')}, rejected={len(errs)}")
    for e in errs[:3]:
        print("   REJECT:", json.dumps(e)[:300])
    return len(errs) == 0


VULNS = [
    ("CVE-2024-3094", "Critical", 10.0, "xz-utils", "5.2.5-2ubuntu1", "Malicious backdoor in xz/liblzma affecting sshd.", 1),
    ("CVE-2021-44228", "Critical", 10.0, "log4j2", "2.14.1", "Log4Shell remote code execution via JNDI lookup.", 2),
    ("CVE-2024-0001", "Critical", 9.8, "openssl", "3.0.2-0ubuntu1.10", "Remote code execution in TLS handshake handling.", 2),
    ("CVE-2023-4911", "Critical", 9.8, "libc6", "2.35-0ubuntu3.1", "Looney Tunables local privilege escalation in glibc.", 4),
    ("CVE-2023-38545", "High", 8.8, "curl", "7.81.0-1ubuntu1.14", "SOCKS5 heap buffer overflow in curl.", 3),
    ("CVE-2024-6387", "High", 8.1, "openssh-server", "8.9p1-3ubuntu0.6", "regreSSHion: unauthenticated RCE in OpenSSH.", 2),
    ("CVE-2023-44487", "High", 7.5, "nginx", "1.18.0-6ubuntu14.4", "HTTP/2 rapid reset denial of service.", 3),
    ("CVE-2022-37434", "High", 7.5, "zlib1g", "1.2.11.dfsg-2ubuntu9.2", "Heap over-read in zlib inflate.", 4),
    ("CVE-2023-29491", "High", 7.8, "libtinfo6", "6.3-2ubuntu0.1", "Local privilege escalation via ncurses.", 1),
    ("CVE-2024-2961", "Medium", 6.5, "libc6", "2.35-0ubuntu3.4", "iconv buffer overflow in glibc.", 3),
    ("CVE-2023-5678", "Medium", 5.3, "openssl", "3.0.2-0ubuntu1.12", "Excessive time in DH key check.", 1),
    ("CVE-2023-27536", "Medium", 5.9, "curl", "7.81.0-1ubuntu1.10", "GSS credential delegation bypass.", 2),
    ("CVE-2022-3821", "Medium", 5.5, "libsystemd0", "249.11-0ubuntu3.6", "Out-of-bounds read in systemd.", 4),
    ("CVE-2023-1234", "Low", 3.3, "vim", "8.2.3995-1ubuntu2.15", "Denial of service in vim regex handling.", 1),
    ("CVE-2022-48174", "Low", 3.1, "busybox", "1.30.1-7ubuntu3", "Stack overflow in busybox shell.", 3),
    ("CVE-2021-3999", "Low", 2.5, "libc-bin", "2.35-0ubuntu3", "Off-by-one in glibc getcwd.", 4),
]


def bulk_vulns():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    lines = []
    for cve, sev, score, pkg, ver, desc, agent_idx in VULNS:
        aid, aname, osname, osver, osplat = AGENTS[agent_idx]
        doc = {
            "wazuh": {"agent": {"id": aid, "name": aname, "groups": ["default", SEED_MARK]},
                      "cluster": {"name": "wazuh", "node": "master"}, "schema": {"version": "1.0"}},
            "vulnerability": {"id": cve, "severity": sev, "description": desc, "category": "Packages",
                              "classification": "CVSS", "detected_at": now,
                              "score": {"base": score, "version": "3.1"},
                              "enumeration": "CVE", "scanner": {"vendor": "Wazuh"}},
            "package": {"name": pkg, "version": ver, "architecture": "amd64", "type": "deb"},
            "host": {"os": {"name": osname, "version": osver, "platform": osplat}},
            "state": {"modified_at": now, "document_version": 1},
        }
        lines.append(json.dumps({"index": {"_index": "wazuh-states-vulnerabilities",
                                           "_id": f"{SEED_MARK}-{cve}-{pkg}"}}))
        lines.append(json.dumps(doc))
    res = req("POST", "/_bulk?refresh=true", "\n".join(lines) + "\n", ndjson=True)
    errs = [i for i in res.get("items", []) if i.get("index", {}).get("status", 500) not in (200, 201)]
    print(f"vulnerabilities: sent {len(VULNS)}, errors={res.get('errors')}, rejected={len(errs)}")
    for e in errs[:3]:
        print("   REJECT:", json.dumps(e)[:300])


FIM = [
    ("/etc/passwd", 2941, "root", "rw-r--r--", 1),
    ("/etc/shadow", 1802, "root", "rw-------", 1),
    ("/etc/ssh/sshd_config", 3402, "root", "rw-------", 2),
    ("/var/www/html/index.php", 8210, "www-data", "rw-r--r--", 2),
    ("/etc/crontab", 1136, "root", "rw-r--r--", 4),
]


def bulk_fim():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    lines = []
    for path, size, owner, perms, agent_idx in FIM:
        aid, aname, _o, _v, _p = AGENTS[agent_idx]
        doc = {
            "wazuh": {"agent": {"id": aid, "name": aname, "groups": ["default", SEED_MARK]},
                      "cluster": {"name": "wazuh", "node": "master"}, "schema": {"version": "1.0"}},
            "file": {"path": path, "size": size, "owner": owner, "group": owner,
                     "permissions": perms, "mtime": now,
                     "hash": {"md5": "0" * 32, "sha1": "1" * 40, "sha256": "2" * 64},
                     "inode": str(random.randint(100000, 999999))},
            "state": {"modified_at": now, "document_version": 1},
        }
        # sha1 of the path, not hash(): Python salts str hashing per process, so hash() would mint
        # a new _id on every run and re-seeding would multiply the documents instead of upserting.
        path_id = hashlib.sha1(path.encode("utf-8")).hexdigest()[:12]
        lines.append(json.dumps({"index": {"_index": "wazuh-states-fim-files",
                                           "_id": f"{SEED_MARK}-fim-{path_id}"}}))
        lines.append(json.dumps(doc))
    res = req("POST", "/_bulk?refresh=true", "\n".join(lines) + "\n", ndjson=True)
    errs = [i for i in res.get("items", []) if i.get("index", {}).get("status", 500) not in (200, 201)]
    print(f"fim files: sent {len(FIM)}, errors={res.get('errors')}, rejected={len(errs)}")



EVENT_KINDS = [
    ("authentication", "session_opened", "success", "sshd"),
    ("authentication", "session_closed", "success", "sshd"),
    ("authentication", "logon_failed", "failure", "sshd"),
    ("process", "process_started", "success", "auditd"),
    ("network", "connection_attempted", "success", "netflow"),
    ("file", "file_modified", "success", "fim"),
]


def bulk_events(count=60):
    """Seeds the wazuh-events-v5-security data stream.

    Deliberately minimal-but-valid ECS rather than a rich fabricated event: the index template
    spans a very large ECS field set, and inventing detailed fake telemetry would produce
    documents that look real without being real. These documents exist so the events family is
    non-empty, which is what lets the search_wazuh_data escape hatch be exercised against it --
    every typed tool targets the findings and states families instead.
    """
    now = datetime.now(timezone.utc)
    lines = []
    for i in range(count):
        ts = now - timedelta(hours=random.randint(0, 24 * 7))
        aid, aname, osname, osver, osplat = random.choice(AGENTS)
        cat, action, outcome, module = random.choice(EVENT_KINDS)
        user = random.choice(USERS)
        doc = {
            "@timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "agent": {"id": aid, "name": aname},
            "event": {"kind": "event", "category": [cat], "action": action,
                      "outcome": outcome, "module": module},
            "host": {"os": {"name": osname, "version": osver, "platform": osplat}},
            "source": {"ip": random.choice(SRC_IPS), "user": {"name": user}},
            "message": f"{SEED_MARK} {action} for {user} on {aname}",
        }
        lines.append(json.dumps({"create": {"_index": "wazuh-events-v5-security"}}))
        lines.append(json.dumps(doc))
    res = req("POST", "/_bulk?refresh=true", "\n".join(lines) + "\n", ndjson=True)
    errs = [i for i in res.get("items", []) if (i.get("create") or i.get("index", {})).get("status", 500) not in (200, 201)]
    print(f"events: sent {count}, errors={res.get('errors')}, rejected={len(errs)}")
    for e in errs[:3]:
        print("   REJECT:", json.dumps(e)[:300])

def purge():
    # Two queries because the two document shapes carry the marker differently: the findings and
    # states docs are seeded with SEED_MARK in wazuh.agent.groups, while the ECS event docs only
    # embed it in the free-text `message` (adding a non-ECS marker field to a data stream risks
    # being rejected by its template), which a term query cannot match.
    by_group = {"query": {"term": {"wazuh.agent.groups": SEED_MARK}}}
    by_message = {"query": {"match_phrase": {"message": SEED_MARK}}}
    targets = (
        (FINDINGS, by_group),
        ("wazuh-states-vulnerabilities", by_group),
        ("wazuh-states-fim-files", by_group),
        ("wazuh-events-v5-security", by_message),
    )
    for idx, q in targets:
        try:
            res = req("POST", f"/{idx}/_delete_by_query?refresh=true&conflicts=proceed", q)
            print(f"purged {res.get('deleted', 0)} from {idx}")
        except Exception as exc:  # noqa: BLE001 - best-effort cleanup
            print(f"purge {idx}: {exc}")


def summarise():
    print("\n=== what the AI Assistant can now see ===")
    c = req("GET", f"/{FINDINGS}/_count")["count"]
    print(f"findings total: {c}")
    body = {"size": 0, "aggs": {
        "sev": {"terms": {"field": "wazuh.rule.level"}},
        "agents": {"terms": {"field": "wazuh.agent.name", "size": 10}},
        "rules": {"terms": {"field": "wazuh.rule.id", "size": 5}},
    }}
    res = req("POST", f"/{FINDINGS}/_search", body)
    for name in ("sev", "agents", "rules"):
        buckets = res["aggregations"][name]["buckets"]
        print(f"  {name}: " + ", ".join(f"{b['key']}={b['doc_count']}" for b in buckets))
    v = req("POST", "/wazuh-states-vulnerabilities/_search",
            {"size": 0, "aggs": {"sev": {"terms": {"field": "vulnerability.severity"}}}})
    print("  vulns: " + ", ".join(f"{b['key']}={b['doc_count']}" for b in v["aggregations"]["sev"]["buckets"]))
    ev = req("GET", "/wazuh-events-v5-security/_count")["count"]
    print(f"  events: {ev}")
    f = req("GET", "/wazuh-states-fim-files/_count")["count"]
    print(f"  fim files: {f}")


if __name__ == "__main__":
    if PURGE:
        purge()
        summarise()
        sys.exit(0)
    if EVENTS_ONLY:
        bulk_events()
        summarise()
        sys.exit(0)
    ok = bulk_findings(build_findings())
    bulk_vulns()
    bulk_fim()
    bulk_events()
    summarise()
    print("\nSEED_UAT_DONE" if ok else "\nSEED_UAT_DONE_WITH_REJECTS")
