# Ejemplo de Migración - Módulo FIM (File Integrity Monitoring)

## Código Actual (Legacy)

```javascript
if (params.syscheck) {
  alert.rule.groups.push('syscheck');
  alert.syscheck = {};
  alert.syscheck.event = Random.arrayItem(IntegrityMonitoring.events);
  alert.syscheck.path = Random.arrayItem(
    alert.agent.name === 'Windows'
      ? IntegrityMonitoring.pathsWindows
      : IntegrityMonitoring.pathsLinux,
  );
  alert.syscheck.uname_after = Random.arrayItem(USERS);
  alert.syscheck.gname_after = 'root';
  alert.syscheck.mtime_after = new Date(Random.date());
  alert.syscheck.size_after = Random.number(0, 65);
  alert.syscheck.uid_after = Random.arrayItem(IntegrityMonitoring.uid_after);
  alert.syscheck.gid_after = Random.arrayItem(IntegrityMonitoring.gid_after);
  alert.syscheck.perm_after = 'rw-r--r--';
  alert.syscheck.inode_after = Random.number(0, 100000);
  
  switch (alert.syscheck.event) {
    case 'added':
      alert.rule = IntegrityMonitoring.regulatory[0];
      break;
    case 'modified':
      alert.rule = IntegrityMonitoring.regulatory[1];
      alert.syscheck.mtime_before = new Date(
        alert.syscheck.mtime_after.getTime() - 1000 * 60,
      );
      alert.syscheck.inode_before = Random.number(0, 100000);
      alert.syscheck.sha1_after = Random.createHash(40);
      alert.syscheck.changed_attributes = [
        Random.arrayItem(IntegrityMonitoring.attributes),
      ];
      alert.syscheck.md5_after = Random.createHash(32);
      alert.syscheck.sha256_after = Random.createHash(64);
      break;
    case 'deleted':
      alert.rule = IntegrityMonitoring.regulatory[2];
      alert.syscheck.tags = [Random.arrayItem(IntegrityMonitoring.tags)];
      alert.syscheck.sha1_after = Random.createHash(40);
      alert.syscheck.audit = {
        process: {
          name: Random.arrayItem(PATHS),
          id: Random.number(0, 100000),
          ppid: Random.number(0, 100000),
        },
        effective_user: {
          name: Random.arrayItem(USERS),
          id: Random.number(0, 100),
        },
        user: {
          name: Random.arrayItem(USERS),
          id: Random.number(0, 100),
        },
        group: {
          name: Random.arrayItem(USERS),
          id: Random.number(0, 100),
        },
      };
      alert.syscheck.md5_after = Random.createHash(32);
      alert.syscheck.sha256_after = Random.createHash(64);
      break;
  }
}
```

## Código Migrado (Wazuh 5.0 ECS)

```javascript
if (params.syscheck) {
  // Determine event type
  const eventType = Random.arrayItem(['added', 'modified', 'deleted']);
  
  // Select file path based on OS
  const isWindows = alert.agent.name === 'Windows';
  const filePath = Random.arrayItem(
    isWindows ? IntegrityMonitoring.pathsWindows : IntegrityMonitoring.pathsLinux
  );
  
  // Extract file components
  const fileName = filePath.split(isWindows ? '\\' : '/').pop();
  const fileDirectory = filePath.substring(0, filePath.lastIndexOf(isWindows ? '\\' : '/'));
  
  // Update event categorization
  alert.event = generateEvent({
    kind: EVENT_KINDS.ALERT,
    category: [EVENT_CATEGORIES.FILE],
    type: eventType === 'added' ? [EVENT_TYPES.CREATION] : 
          eventType === 'modified' ? [EVENT_TYPES.CHANGE] : 
          [EVENT_TYPES.DELETION],
    action: `file-${eventType}`,
    outcome: EVENT_OUTCOMES.SUCCESS,
    module: 'fim',
    severity: eventType === 'deleted' ? 7 : (eventType === 'modified' ? 5 : 3),
  });
  
  // Generate file information (ECS)
  alert.file = {
    path: filePath,
    name: fileName,
    directory: fileDirectory,
    size: Random.number(0, 1000000),
    mtime: new Date(alertDate).toISOString(),
    inode: String(Random.number(0, 100000)),
    owner: Random.arrayItem(USERS),
    group: 'root',
    mode: '0644',
    uid: String(Random.arrayItem(IntegrityMonitoring.uid_after)),
    gid: String(Random.arrayItem(IntegrityMonitoring.gid_after)),
  };
  
  // Add hashes for modified/deleted files
  if (eventType === 'modified' || eventType === 'deleted') {
    alert.file.hash = {
      md5: Random.createHash(32),
      sha1: Random.createHash(40),
      sha256: Random.createHash(64),
    };
    
    // For modified files, add changed attributes
    if (eventType === 'modified') {
      alert.file.attributes = [Random.arrayItem(IntegrityMonitoring.attributes)];
    }
  }
  
  // For deleted files, add process information
  if (eventType === 'deleted') {
    const processUser = Random.arrayItem(USERS);
    const processGroup = Random.arrayItem(USERS);
    
    alert.process = {
      pid: Random.number(0, 100000),
      parent: {
        pid: Random.number(0, 100000),
      },
      name: Random.arrayItem(PATHS),
      executable: Random.arrayItem(PATHS),
      user: {
        id: String(Random.number(0, 100)),
        name: processUser,
      },
      group: {
        id: String(Random.number(0, 100)),
        name: processGroup,
      },
    };
    
    alert.user = generateUser({
      name: processUser,
      id: String(Random.number(0, 100)),
      groupName: processGroup,
      groupId: String(Random.number(0, 100)),
    });
  }
  
  // Generate message
  const actionDescriptions = {
    added: 'File created',
    modified: 'File modified',
    deleted: 'File deleted',
  };
  
  alert.message = generateMessage({
    action: actionDescriptions[eventType],
    fileName: filePath,
  });
  
  // Log information
  alert.log = generateLog({
    level: eventType === 'deleted' ? 'warning' : 'info',
    filePath: '/var/ossec/logs/ossec.log',
    originFile: 'syscheck',
  });
  
  // Update wazuh fields
  alert.wazuh.decoders = ['syscheck'];
  alert.wazuh.rules = getRulesForModule('fim', eventType);
  
  // Update rule based on event type
  switch (eventType) {
    case 'added':
      alert.rule = { ...IntegrityMonitoring.regulatory[0] };
      break;
    case 'modified':
      alert.rule = { ...IntegrityMonitoring.regulatory[1] };
      break;
    case 'deleted':
      alert.rule = { ...IntegrityMonitoring.regulatory[2] };
      break;
  }
  alert.rule.groups = ['syscheck', 'fim'];
  
  // Legacy fields (backward compatibility)
  alert.syscheck = {
    event: eventType,
    path: filePath,
    uname_after: alert.file.owner,
    gname_after: alert.file.group,
    mtime_after: new Date(alert.file.mtime),
    size_after: alert.file.size,
    uid_after: alert.file.uid,
    gid_after: alert.file.gid,
    perm_after: alert.file.mode,
    inode_after: parseInt(alert.file.inode, 10),
  };
  
  if (alert.file.hash) {
    alert.syscheck.md5_after = alert.file.hash.md5;
    alert.syscheck.sha1_after = alert.file.hash.sha1;
    alert.syscheck.sha256_after = alert.file.hash.sha256;
  }
  
  if (eventType === 'modified') {
    alert.syscheck.mtime_before = new Date(
      new Date(alert.file.mtime).getTime() - 60000,
    );
    alert.syscheck.inode_before = Random.number(0, 100000);
    alert.syscheck.changed_attributes = alert.file.attributes || [];
  }
  
  if (eventType === 'deleted' && alert.process) {
    alert.syscheck.audit = {
      process: {
        name: alert.process.name,
        id: alert.process.pid,
        ppid: alert.process.parent.pid,
      },
      effective_user: {
        name: alert.process.user.name,
        id: parseInt(alert.process.user.id, 10),
      },
      user: {
        name: alert.user.name,
        id: parseInt(alert.user.id, 10),
      },
      group: {
        name: alert.user.group.name,
        id: parseInt(alert.user.group.id, 10),
      },
    };
    alert.syscheck.tags = [Random.arrayItem(IntegrityMonitoring.tags)];
  }
}
```

## Cambios Clave

### 1. Event Categorization ✅
```javascript
// Antes: No existía
// Ahora:
alert.event = {
  kind: 'alert',
  category: ['file'],
  type: ['creation' | 'change' | 'deletion'],
  action: 'file-added' | 'file-modified' | 'file-deleted',
  outcome: 'success',
  module: 'fim',
  severity: 3-7 (según tipo),
}
```

### 2. File Fields (ECS) ✅
```javascript
// Antes: alert.syscheck.path, alert.syscheck.size_after, etc.
// Ahora:
alert.file = {
  path: '/etc/passwd',
  name: 'passwd',
  directory: '/etc',
  size: 2048,
  mtime: '2024-01-27T10:00:00.000Z',
  inode: '12345',
  owner: 'root',
  group: 'root',
  mode: '0644',
  uid: '0',
  gid: '0',
  hash: {
    md5: 'abc123...',
    sha1: 'def456...',
    sha256: 'ghi789...',
  },
  attributes: ['readonly'],  // para modified
}
```

### 3. Process Fields (para deleted) ✅
```javascript
// Antes: alert.syscheck.audit.process
// Ahora:
alert.process = {
  pid: 1234,
  parent: { pid: 1 },
  name: 'vim',
  executable: '/usr/bin/vim',
  user: {
    id: '0',
    name: 'root',
  },
  group: {
    id: '0',
    name: 'root',
  },
}
```

### 4. User Fields (para deleted) ✅
```javascript
// Antes: alert.syscheck.audit.user
// Ahora:
alert.user = {
  name: 'root',
  id: '0',
  group: {
    name: 'root',
    id: '0',
  },
}
```

### 5. Message ✅
```javascript
// Antes: No existía
// Ahora:
alert.message = 'File modified on file /etc/passwd'
```

### 6. Log Information ✅
```javascript
// Antes: No existía estructurado
// Ahora:
alert.log = {
  level: 'info' | 'warning',
  file: {
    path: '/var/ossec/logs/ossec.log',
  },
  origin: {
    file: {
      name: 'syscheck',
    },
  },
}
```

### 7. Wazuh Fields ✅
```javascript
// Antes: alert.decoder = { name: 'syscheck' }
// Ahora:
alert.wazuh.decoders = ['syscheck'];  // array
alert.wazuh.rules = ['550', '553'];   // array
```

## Validación

Después de implementar, validar que se generen estos campos:

```javascript
{
  "@timestamp": "2024-01-27T10:00:00.000Z",
  "event": {
    "kind": "alert",
    "category": ["file"],
    "type": ["change"],
    "action": "file-modified",
    "outcome": "success",
    "module": "fim",
    "severity": 5
  },
  "message": "File modified on file /etc/passwd",
  "file": {
    "path": "/etc/passwd",
    "name": "passwd",
    "directory": "/etc",
    "size": 2048,
    "mtime": "2024-01-27T09:55:00.000Z",
    "inode": "12345",
    "owner": "root",
    "group": "root",
    "mode": "0644",
    "hash": {
      "md5": "abc123...",
      "sha1": "def456...",
      "sha256": "ghi789..."
    }
  },
  "agent": {
    "id": "001",
    "name": "RHEL7",
    "version": "v5.0.0",
    "groups": ["default"],
    "host": { ... }
  },
  "wazuh": {
    "cluster": { "name": "wazuh-cluster" },
    "decoders": ["syscheck"],
    "rules": ["553"],
    "schema": { "version": "1.7.0" }
  },
  "rule": {
    "id": "553",
    "description": "File integrity monitoring: File modified",
    "level": 7,
    "groups": ["syscheck", "fim"]
  },
  "log": {
    "level": "info",
    "file": { "path": "/var/ossec/logs/ossec.log" },
    "origin": { "file": { "name": "syscheck" } }
  },
  // Legacy fields (backward compatibility)
  "syscheck": { ... }
}
```

## Testing

```bash
# 1. Restart server
npm run dev

# 2. Generate FIM alerts
# Via API or Dashboard

# 3. Verify in Dev Tools
GET wazuh-alerts-v5-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "event.module": "fim" } },
        { "exists": { "field": "file.path" } }
      ]
    }
  }
}

# 4. Check fields
GET wazuh-alerts-v5-*/_mapping
```

## Próximo Módulo

Siguiente recomendado: **SSH** (similar a authentication, fácil de migrar)

