The filebeat.*.yml files needs the next permissions:
UID:GID=0:0
rwxr-x-r-x

Reasons:
- The user to run filebeat is root with UID=0 and GID=0.
- Only the owner can have the write permission