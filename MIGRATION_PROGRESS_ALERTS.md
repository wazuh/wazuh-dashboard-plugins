# Migración del Generador de Alerts a Wazuh 5.0 - Progreso

## ✅ Trabajo Completado

### 1. Análisis y Documentación
- ✅ Análisis completo de la estructura actual vs esperada
- ✅ Documentación de todos los cambios necesarios
- ✅ Identificación de campos legacy a eliminar
- ✅ Plan de migración por fases

### 2. Módulos Helper Creados

#### `helpers/ecs-generator.js` ✅
Generador de campos ECS (Elastic Common Schema):
- `generateEvent()` - Campos event.* (kind, category, type, action, outcome, severity)
- `generateLog()` - Campos log.* (level, file.path, origin)
- `generateMessage()` - Mensajes humanamente legibles
- `generateHost()` - Información completa del host con OS mapping
- `generateUser()` - Campos user.* (name, id, domain, email, roles, group)
- `generateNetworkEndpoint()` - Campos source/destination con geo y AS

**Características:**
- Soporte completo de ECS 9.1.0
- Constantes para EVENT_CATEGORIES, EVENT_TYPES, EVENT_KINDS, EVENT_OUTCOMES
- Generación de IPs múltiples (arrays)
- Generación de MACs
- Mapeo automático de OS por agent name

#### `helpers/wazuh-generator.js` ✅
Generador de campos específicos de Wazuh:
- `generateWazuhField()` - wazuh.* (cluster, decoders[], rules[], schema.version)
- `getDecodersForModule()` - Decoders automáticos por módulo
- `getRulesForModule()` - Rule IDs por módulo y acción
- `generateAgent()` - Agent completo ECS + host
- `generateRule()` - Rule con regulatory compliance

**Características:**
- Schema version 1.7.0
- Decoders como arrays (no objetos)
- Rules como arrays de IDs
- Mapeo automático decoder/rules por módulo

### 3. Datos Comunes Actualizados

#### `sample-data/common.js` ✅
Añadidos campos ECS:
- `AS_DATA` - Autonomous System numbers y organizaciones (Google, AWS, Microsoft, etc.)
- `DOMAINS` - Dominios para eventos URL y HTTP
- `USER_GROUPS` - Grupos de usuario con ID
- `USER_ROLES` - Roles de usuario
- `GEO_LOCATION` - Actualizado con country_iso_code y continent_code

### 4. Script Principal Actualizado

#### `generate-alerts-script.js` ✅ (Parcial)
**Completado:**
- ✅ Imports actualizados (ECS y Wazuh generators)
- ✅ Estructura base del alert migrada a ECS:
  - `@timestamp` (formato ISO)
  - `event.*` (kind, category, type, outcome, created)
  - `message` (campo nuevo)
  - `agent.*` con host completo (ip[], mac[], os.*)
  - `wazuh.*` (cluster, decoders[], rules[], schema)
  - `rule.*` simplificado
  - `tags[]` array

**Conservado temporalmente (backward compatibility):**
- `timestamp` (legacy, para dashboards antiguos)
- `@sampledata` (marcador)

## ⚠️ Trabajo Pendiente

### Módulos Específicos a Migrar

Cada uno de estos módulos necesita actualización para usar los helpers ECS:

#### 1. Authentication (Líneas ~766-989) 🔄
**Campos a transformar:**
- `data.srcip` → `source.ip` + `source.geo`
- `data.srcuser` → `user.name`
- `data.srcport` → `source.port`
- `data.dstuser` → `destination.user.name`
- `predecoder.*` → eliminar o convertir a `log.*`
- `decoder.*` → `wazuh.decoders[]`
- `location` → `log.file.path`
- `full_log` → `event.original` o `message`
- `GeoLocation` → `source.geo`

**Event categorization:**
- kind: `alert`
- category: `['authentication']`
- type: depende del evento (`['start']`, `['end']`, `['denied']`)
- outcome: `'success'` o `'failure'`

**Ejemplo código:**
```javascript
if (params.authentication) {
  // Update event categorization
  alert.event = generateEvent({
    kind: EVENT_KINDS.ALERT,
    category: [EVENT_CATEGORIES.AUTHENTICATION],
    type: [EVENT_TYPES.START],
    action: 'user-login',
    outcome: EVENT_OUTCOMES.SUCCESS,
    module: 'authentication',
  });

  // User field
  alert.user = generateUser({
    name: Random.arrayItem(USERS),
    id: String(Random.number(0, 1000)),
  });

  // Source network
  const sourceGeo = Random.arrayItem(GEO_LOCATION);
  const sourceAs = Random.arrayItem(AS_DATA);
  alert.source = generateNetworkEndpoint({
    ip: Random.arrayItem(IPs),
    port: Random.arrayItem(PORTS),
    geo: sourceGeo,
    as: sourceAs,
  });

  // Destination (agent)
  alert.destination = generateNetworkEndpoint({
    ip: alert.agent.host.ip[0],
    port: 22,
  });

  // Log information
  alert.log = generateLog({
    level: 'info',
    filePath: '/var/log/auth.log',
    originFile: 'sshd',
  });

  // Message
  alert.message = generateMessage({
    action: 'SSH authentication successful',
    user: alert.user.name,
    sourceIp: alert.source.ip,
  });

  // Update wazuh decoders and rules
  alert.wazuh.decoders = getDecodersForModule('authentication');
  alert.wazuh.rules = getRulesForModule('authentication', 'success');
}
```

#### 2. SSH (Líneas ~991-1016) 🔄
Similar a authentication, usar los mismos helpers.

#### 3. FIM / Syscheck (Líneas ~607-671) 🔄
**Campos a transformar:**
- `syscheck.*` → `file.*`
- `syscheck.path` → `file.path`
- `syscheck.md5_after` → `file.hash.md5`
- `syscheck.sha1_after` → `file.hash.sha1`
- `syscheck.sha256_after` → `file.hash.sha256`
- `syscheck.size_after` → `file.size`
- `syscheck.mtime_after` → `file.mtime`
- `syscheck.uname_after` → `file.owner`
- `syscheck.gname_after` → `file.group`
- `syscheck.perm_after` → `file.mode`
- `syscheck.inode_after` → `file.inode`

**Event categorization:**
- category: `['file']`
- type: `['creation']`, `['change']`, `['deletion']`
- action: 'file-created', 'file-modified', 'file-deleted'

**Ejemplo código:**
```javascript
if (params.syscheck) {
  const event_type = Random.arrayItem(['added', 'modified', 'deleted']);
  
  alert.event = generateEvent({
    kind: EVENT_KINDS.ALERT,
    category: [EVENT_CATEGORIES.FILE],
    type: event_type === 'added' ? [EVENT_TYPES.CREATION] : 
          event_type === 'modified' ? [EVENT_TYPES.CHANGE] : 
          [EVENT_TYPES.DELETION],
    action: `file-${event_type}`,
    outcome: EVENT_OUTCOMES.SUCCESS,
    module: 'fim',
  });

  // File information
  const filePath = Random.arrayItem(IntegrityMonitoring.pathsLinux);
  alert.file = {
    path: filePath,
    name: filePath.split('/').pop(),
    directory: filePath.substring(0, filePath.lastIndexOf('/')),
    size: Random.number(0, 1000000),
    mtime: alertDate.toISOString(),
    inode: String(Random.number(0, 100000)),
    owner: Random.arrayItem(USERS),
    group: 'root',
    mode: '0644',
    hash: {
      md5: Random.createHash(32),
      sha1: Random.createHash(40),
      sha256: Random.createHash(64),
    },
  };

  alert.message = generateMessage({
    action: `File ${event_type}`,
    fileName: alert.file.path,
  });

  alert.wazuh.decoders = ['syscheck'];
  alert.wazuh.rules = getRulesForModule('fim', event_type);
}
```

#### 4. AWS (Líneas ~115-360) 🔄
**Campos a transformar:**
- `data.aws.*` → `cloud.*`
- `data.integration` → `event.module`

**Cloud field:**
```javascript
alert.cloud = {
  provider: 'aws',
  region: Random.arrayItem(AWS.region),
  account: {
    id: Random.arrayItem(AWS.accountId),
  },
  service: {
    name: 'guardduty', // o 'cloudtrail', 'macie', etc.
  },
};
```

#### 5. Azure (Líneas ~362-414) 🔄
Similar a AWS, usar `cloud.provider = 'azure'`.

#### 6. GCP (Líneas ~468-527) 🔄
Similar a AWS, usar `cloud.provider = 'gcp'`.

#### 7. Office 365 (Líneas ~416-466) 🔄
Usar `event.module = 'office365'`.

#### 8. Docker (Líneas ~540-545) 🔄
**Campos a transformar:**
- Añadir `container.*` fields

```javascript
alert.container = {
  id: Random.createHash(12),
  name: `container-${Random.number(1, 100)}`,
  image: {
    name: 'nginx:latest',
  },
};
```

#### 9. Web / Apache (Líneas ~1056-1126) 🔄
**Campos a transformar:**
- `data.protocol` → `http.request.method`
- `data.id` → `http.response.status_code`
- `data.url` → `url.path`
- Añadir `http.*` y `url.*` completos

**Ejemplo:**
```javascript
alert.http = {
  request: {
    method: Random.arrayItem(['GET', 'POST', 'PUT', 'DELETE']),
  },
  response: {
    status_code: parseInt(Random.arrayItem(['200', '404', '403', '500'])),
  },
  version: '1.1',
};

alert.url = {
  domain: Random.arrayItem(DOMAINS),
  path: Random.arrayItem(Web.urls),
  full: `https://${alert.url.domain}${alert.url.path}`,
};
```

#### 10. Virustotal (Líneas ~673-705) 🔄
Añadir `threat.indicator.*` fields.

#### 11. Vulnerability (Líneas ~707-722) 🔄
**Campos a transformar:**
- Añadir `vulnerability.*` completo (id, severity, score, reference)
- Ya existe código para esto, solo refactorizar

#### 12. MITRE (Líneas ~547-550) ✅
**Ya migrado** - usa `threat.*` field correctamente.

#### 13. Rootcheck (Líneas ~552-605) 🔄
Event category: `['malware']` o `['intrusion_detection']`.

#### 14. Audit (Líneas ~529-538) 🔄
Event category: `['process']` o `['configuration']`.

#### 15. Windows (Líneas ~1018-1054) 🔄
Similar a authentication, con campos Windows específicos.

#### 16. GitHub (Líneas ~1128-1162) 🔄
Event module: 'github', conservar estructura actual.

#### 17. Yara (Líneas ~1164-1166) 🔄
Event category: `['malware']`.

### Fase de Cleanup (Breaking Changes)

Después de migrar todos los módulos:

1. **Eliminar campos legacy:**
   ```javascript
   // Eliminar:
   - alert.timestamp (mantener solo @timestamp)
   - alert.manager
   - alert.cluster (movido a wazuh.cluster)
   - alert.id (opcional: mover a event.id)
   - alert.predecoder
   - alert.decoder (movido a wazuh.decoders)
   - alert.data (transformado a campos ECS)
   - alert.location (movido a log.file.path)
   - alert.input
   - alert.GeoLocation (movido a source.geo/destination.geo)
   - alert.full_log (movido a event.original o message)
   ```

2. **Validar con template:**
   - Comparar campos generados con `index-template-alerts.json`
   - Verificar que todos los campos son compatibles
   - Comprobar tipos de datos

3. **Actualizar dashboards si es necesario:**
   - Revisar si hay dashboards que usen campos legacy
   - Actualizar queries para usar nuevos campos ECS

## 📊 Métricas de Progreso

- **Helpers creados:** 2/2 (100%) ✅
- **Estructura base:** Completada ✅
- **Módulos específicos:** 1/17 (6%) - Solo MITRE completo
- **Cleanup:** No iniciado ⏳

## 🔧 Herramientas Disponibles

### Helpers
- `ecs-generator.js` - Todos los campos ECS
- `wazuh-generator.js` - Campos específicos de Wazuh
- `date-formatter.js` - Formateo de fechas
- `random.js` - Generación aleatoria
- `interpolate-alert-props.js` - Interpolación de variables

### Datos
- `sample-data/common.js` - Datos comunes (IPs, users, GeoIP, AS, etc.)
- `sample-data/*` - Datos específicos por módulo

## 📝 Siguiente Paso Recomendado

**Opción 1: Migración módulo por módulo (Recomendado)**
1. Comenzar con Authentication (más común)
2. Continuar con SSH
3. Luego FIM/Syscheck
4. Después módulos de cloud (AWS, Azure, GCP)
5. Finalmente módulos menos comunes

**Opción 2: Enfoque híbrido**
1. Mantener ambos formatos temporalmente
2. Añadir flag de compatibilidad en params
3. Migrar módulos progresivamente
4. Deprecar formato legacy en versión futura

## 💡 Tips de Implementación

1. **Usar los helpers:** No reinventar la rueda, usar `generateEvent()`, `generateUser()`, etc.
2. **Mantener mensaje legible:** `message` debe ser humanamente comprensible
3. **Event categorization correcta:** Consultar documentación ECS para elegir category/type
4. **Arrays donde corresponde:** `event.category`, `event.type`, `agent.host.ip`, `wazuh.decoders`, `wazuh.rules`
5. **Outcome consistente:** `success` para eventos exitosos, `failure` para fallidos, `unknown` si no aplica
6. **Testing continuo:** Validar cada módulo después de migrar

## 📚 Referencias

- [ECS Documentation](https://www.elastic.co/guide/en/ecs/current/index.html)
- [Wazuh 5.0 Schema](https://github.com/wazuh/wazuh-indexer-plugins)
- Template: `/home/felipe/wazuh/wazuh-indexer-plugins/plugins/setup/src/main/resources/index-template-alerts.json`
- Fields CSV: `/home/felipe/wazuh/wazuh-indexer-plugins/ecs/stateless/docs/fields.csv`

