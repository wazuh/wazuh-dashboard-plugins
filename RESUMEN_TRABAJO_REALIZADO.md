# Resumen del Trabajo Realizado - Migración a Wazuh 5.0 ECS

## 🎯 Objetivo

Migrar el generador de alerts de Wazuh Dashboard a formato ECS compliant de Wazuh 5.0, siguiendo los templates oficiales del repositorio `wazuh-indexer-plugins`.

## ✅ Trabajo Completado

### 1. Análisis y Documentación ✅

**Archivos creados:**
- `/tmp/analisis_generador.md` - Análisis completo de la estructura actual vs esperada
- `MIGRATION_PROGRESS_ALERTS.md` - Guía completa con ejemplos de código para cada módulo

**Contenido:**
- Mapeo completo de campos legacy → ECS
- 17 módulos identificados para migración
- Plan de fases detallado
- Ejemplos de código para cada tipo de alert

### 2. Módulos Helper Creados ✅

#### `helpers/ecs-generator.js`
Generador completo de campos ECS (Elastic Common Schema):

**Funciones:**
- `generateEvent(options)` - Genera campos `event.*`
  - kind: alert, event, metric, state
  - category: authentication, file, network, process, etc.
  - type: start, end, denied, creation, change, deletion
  - action, outcome, severity, module
  
- `generateLog(options)` - Genera campos `log.*`
  - level, file.path, origin.file.name
  
- `generateMessage(options)` - Genera mensajes humanamente legibles
  - Interpolación automática de action, user, sourceIp, fileName, etc.
  
- `generateHost(hostData)` - Genera información completa del host
  - IP arrays, MAC addresses
  - OS mapping automático (RHEL, Ubuntu, CentOS, Windows, etc.)
  - arquitectura, hostname, type
  
- `generateUser(userData)` - Genera campos `user.*`
  - name, id, domain, email, roles, group
  
- `generateNetworkEndpoint(options)` - Genera `source.*` / `destination.*`
  - ip, port, domain, geo, AS (Autonomous System)

**Constantes exportadas:**
- `EVENT_CATEGORIES`, `EVENT_TYPES`, `EVENT_KINDS`, `EVENT_OUTCOMES`

#### `helpers/wazuh-generator.js`
Generador de campos específicos de Wazuh 5.0:

**Funciones:**
- `generateWazuhField(options)` - Genera campo `wazuh.*`
  - cluster.name, cluster.node
  - decoders[] (array de strings)
  - rules[] (array de rule IDs)
  - schema.version (1.7.0)
  
- `getDecodersForModule(module)` - Decoders automáticos por módulo
  - authentication → ['sshd', 'pam']
  - fim → ['syscheck']
  - aws → ['json', 'aws-cloudtrail']
  - etc.
  
- `getRulesForModule(module, action)` - Rule IDs por módulo
  - authentication.success → ['5501', '5502', ...]
  - authentication.failure → ['5503', '5551', ...]
  - fim.added → ['550', '554']
  - etc.
  
- `generateAgent(agentData, options)` - Agent completo con host
  - id, name, version, groups[]
  - host.* completo (usa generateHost de ecs-generator)
  
- `generateRule(options)` - Rule con regulatory compliance
  - id, name, description, level, firedtimes
  - pci_dss, gdpr, hipaa, nist_800_53, tsc

**Datos incluidos:**
- `WAZUH_SCHEMA_VERSION = '1.7.0'`
- `WAZUH_DECODERS[]` - 20+ decoders comunes
- `WAZUH_RULE_IDS{}` - Rule IDs por módulo y acción

### 3. Datos Comunes Actualizados ✅

#### `sample-data/common.js`

**Nuevos campos añadidos:**

```javascript
// Autonomous System (para source.as y destination.as)
AS_DATA = [
  { number: 15169, organization: 'Google LLC' },
  { number: 16509, organization: 'Amazon.com, Inc.' },
  { number: 8075, organization: 'Microsoft Corporation' },
  // ... 7 más
]

// Dominios para eventos URL y HTTP
DOMAINS = [
  'example.com',
  'test.com',
  'internal.local',
  // ... 5 más
]

// Grupos de usuario con ID
USER_GROUPS = [
  { name: 'wheel', id: '10' },
  { name: 'sudo', id: '27' },
  // ... 5 más
]

// Roles de usuario
USER_ROLES = [
  ['admin'],
  ['user'],
  ['developer'],
  // ... 4 más
]
```

**Campos actualizados:**

```javascript
// GEO_LOCATION ahora incluye:
{
  country_name: 'Spain',
  country_iso_code: 'ES',        // NUEVO
  continent_code: 'EU',          // NUEVO
  location: { lat: 37.18, lon: -3.60 },
  region_name: 'Andalucía',
  city_name: 'Granada',
}
```

### 4. Script Principal Actualizado ✅

#### `generate-alerts-script.js`

**Imports añadidos:**
```javascript
// Nuevos exports de common
const {
  IPs, USERS, PORTS, ...,
  AS_DATA,          // NUEVO
  DOMAINS,          // NUEVO
  USER_GROUPS,      // NUEVO
  USER_ROLES,       // NUEVO
} = require('./sample-data/common');

// Helpers ECS
const {
  EVENT_CATEGORIES,
  EVENT_TYPES,
  EVENT_KINDS,
  EVENT_OUTCOMES,
  generateEvent,
  generateLog,
  generateMessage,
  generateHost,
  generateUser,
  generateNetworkEndpoint,
} = require('./helpers/ecs-generator');

// Helpers Wazuh
const {
  generateWazuhField,
  getDecodersForModule,
  getRulesForModule,
  generateAgent,
  generateRule,
} = require('./helpers/wazuh-generator');
```

**Estructura base del alert migrada:**

```javascript
function generateAlert(params) {
  const alertDate = Random.date();
  const timestamp = DateFormatter.format(alertDate, DateFormatter.DATE_FORMAT.ISO_TIMESTAMP);
  const selectedAgent = Random.arrayItem(AGENTS);

  let alert = {
    // ECS Core Fields ✅
    '@timestamp': timestamp,
    tags: ['wazuh', '@sampledata'],
    
    // Event categorization ✅
    event: generateEvent({
      kind: EVENT_KINDS.ALERT,
      category: [EVENT_CATEGORIES.AUTHENTICATION],
      type: [EVENT_TYPES.INFO],
      outcome: EVENT_OUTCOMES.UNKNOWN,
      created: alertDate,
    }),

    // Message ✅
    message: 'Sample security alert',

    // Agent ECS-compliant ✅
    agent: generateAgent(selectedAgent, {
      groups: ['default'],
      version: 'v5.0.0',
    }),

    // Wazuh fields ✅
    wazuh: generateWazuhField({
      clusterName: params.cluster?.name || 'wazuh-cluster',
      clusterNode: params.cluster?.node || null,
    }),

    // Rule ✅
    rule: generateRule({
      id: `${Random.number(1, ALERT_ID_MAX)}`,
      description: Random.arrayItem(RULE_DESCRIPTION),
      level: Random.number(1, RULE_MAX_LEVEL),
    }),
  };

  // Legacy fields (backward compatibility)
  alert.timestamp = timestamp;
  alert['@sampledata'] = true;
  
  // ... módulos específicos ...
}
```

### 5. Módulo Authentication Migrado ✅

**Sección `if (params.authentication)` completamente actualizada:**

```javascript
if (params.authentication) {
  // Genera user.* ✅
  alert.user = generateUser({
    name: userName,
    id: String(Random.number(0, 1000)),
  });

  // Genera source.* con geo y AS ✅
  alert.source = generateNetworkEndpoint({
    ip: sourceIp,
    port: sourcePort,
    geo: Random.arrayItem(GEO_LOCATION),
    as: Random.arrayItem(AS_DATA),
  });

  // Genera destination.* ✅
  alert.destination = generateNetworkEndpoint({
    ip: alert.agent.host.ip[0],
    port: 22,
  });

  // Actualiza event.* ✅
  alert.event = generateEvent({
    kind: EVENT_KINDS.ALERT,
    category: [EVENT_CATEGORIES.AUTHENTICATION],
    type: isSuccess ? [EVENT_TYPES.START] : [EVENT_TYPES.DENIED],
    action: isSuccess ? 'ssh-login-success' : 'ssh-login-failure',
    outcome: isSuccess ? EVENT_OUTCOMES.SUCCESS : EVENT_OUTCOMES.FAILURE,
    module: 'authentication',
    severity: isBruteForce ? 8 : (isSuccess ? 3 : 5),
  });

  // Genera log.* ✅
  alert.log = generateLog({
    level: isSuccess ? 'info' : 'warning',
    filePath: '/var/log/auth.log',
    originFile: 'sshd',
  });

  // Actualiza wazuh.* ✅
  alert.wazuh.decoders = getDecodersForModule('authentication');
  alert.wazuh.rules = getRulesForModule('authentication', isSuccess ? 'success' : 'failure');

  // Genera message ✅
  alert.message = generateMessage({
    action: 'SSH authentication successful',
    user: userName,
    sourceIp: sourceIp,
  });

  // Mantiene campos legacy para backward compatibility
  alert.data = { srcip, srcuser, srcport };
  alert.GeoLocation = sourceGeo;
  alert.decoder = DECODER.SSHD;
  alert.predecoder = { ... };
  alert.full_log = ...;
}
```

## ⚠️ Trabajo Pendiente

### Módulos a Migrar (16 restantes)

1. **SSH** (similar a authentication)
2. **FIM/Syscheck** - Transformar `syscheck.*` → `file.*`
3. **AWS** - Transformar `data.aws.*` → `cloud.*`
4. **Azure** - Similar a AWS
5. **GCP** - Similar a AWS
6. **Office 365** - Mantener estructura, añadir ECS
7. **Docker** - Añadir `container.*`
8. **Web/Apache** - Añadir `http.*` y `url.*`
9. **Virustotal** - Añadir `threat.indicator.*`
10. **Vulnerability** - Expandir `vulnerability.*`
11. **Rootcheck** - Categorizar evento
12. **Audit** - Categorizar evento
13. **Windows** - Similar a authentication
14. **GitHub** - Mantener, añadir ECS
15. **Yara** - Categorizar como malware
16. **MITRE** - ✅ Ya migrado

### Cleanup Final

Después de migrar todos los módulos, eliminar campos legacy:
- `alert.timestamp` → solo `@timestamp`
- `alert.manager` → eliminado
- `alert.cluster` → `wazuh.cluster`
- `alert.id` → `event.id` (opcional)
- `alert.predecoder` → eliminado
- `alert.decoder` → `wazuh.decoders`
- `alert.data` → campos ECS específicos
- `alert.location` → `log.file.path`
- `alert.input` → eliminado
- `alert.GeoLocation` → `source.geo` / `destination.geo`
- `alert.full_log` → `event.original` o `message`

## 📊 Métricas

- **Helpers:** 2/2 (100%) ✅
- **Datos comunes:** Actualizados ✅
- **Estructura base:** Migrada ✅
- **Módulo Authentication:** Migrado ✅
- **Módulos restantes:** 16/17 (94%) ⏳
- **Cleanup:** Pendiente ⏳

## 🚀 Cómo Continuar

### Opción A: Migrar módulo por módulo

Sigue el orden recomendado en `MIGRATION_PROGRESS_ALERTS.md`:
1. SSH (fácil, similar a authentication)
2. FIM (importante, mucha lógica)
3. Módulos cloud (AWS, Azure, GCP)
4. Resto de módulos

### Opción B: Usar pattern matching

Todos los módulos siguen un patrón similar:

```javascript
if (params.MODULE) {
  // 1. Actualizar event.*
  alert.event = generateEvent({
    kind: EVENT_KINDS.ALERT,
    category: [...],
    type: [...],
    action: '...',
    outcome: EVENT_OUTCOMES...,
    module: 'MODULE',
  });

  // 2. Añadir campos ECS específicos
  alert.user = ...;        // si aplica
  alert.source = ...;      // si aplica
  alert.file = ...;        // si aplica
  alert.process = ...;     // si aplica
  alert.cloud = ...;       // si aplica
  // etc.

  // 3. Actualizar wazuh.*
  alert.wazuh.decoders = getDecodersForModule('MODULE');
  alert.wazuh.rules = getRulesForModule('MODULE', 'action');

  // 4. Añadir log.*
  alert.log = generateLog({...});

  // 5. Generar message
  alert.message = generateMessage({...});

  // 6. Mantener campos legacy (temporal)
  alert.data = ...;
  alert.location = ...;
  alert.decoder = ...;
  alert.full_log = ...;
}
```

## 📚 Referencias Rápidas

### Archivos Clave

- **Helpers:**
  - `plugins/main/server/lib/generate-alerts/helpers/ecs-generator.js`
  - `plugins/main/server/lib/generate-alerts/helpers/wazuh-generator.js`

- **Script Principal:**
  - `plugins/main/server/lib/generate-alerts/generate-alerts-script.js`

- **Datos:**
  - `plugins/main/server/lib/generate-alerts/sample-data/common.js`

- **Documentación:**
  - `MIGRATION_PROGRESS_ALERTS.md` - Guía completa con ejemplos
  - `RESUMEN_TRABAJO_REALIZADO.md` - Este archivo

### Templates de Referencia

- **Wazuh 5.0 Template:**
  `/home/felipe/wazuh/wazuh-indexer-plugins/plugins/setup/src/main/resources/index-template-alerts.json`

- **Fields CSV:**
  `/home/felipe/wazuh/wazuh-indexer-plugins/ecs/stateless/docs/fields.csv`

### Comandos Útiles

```bash
# Ver estructura del template
cat /home/felipe/wazuh/wazuh-indexer-plugins/plugins/setup/src/main/resources/index-template-alerts.json | jq '.mappings.properties | keys'

# Buscar campo específico en template
grep -n "source" /home/felipe/wazuh/wazuh-indexer-plugins/plugins/setup/src/main/resources/index-template-alerts.json

# Ver fields CSV
cat /home/felipe/wazuh/wazuh-indexer-plugins/ecs/stateless/docs/fields.csv | grep "source\."
```

## 💡 Tips Finales

1. **No reinventes la rueda:** Usa los helpers creados, ya tienen toda la lógica ECS.

2. **Mantén backward compatibility:** Los dashboards antiguos pueden usar campos legacy, mantenlos hasta el cleanup final.

3. **Testing incremental:** Después de cada módulo, genera alerts y verifica que los campos sean correctos.

4. **Message siempre legible:** El campo `message` debe ser comprensible por humanos.

5. **Arrays donde corresponde:** 
   - `event.category` → array
   - `event.type` → array
   - `agent.host.ip` → array
   - `wazuh.decoders` → array
   - `wazuh.rules` → array

6. **Consulta ECS docs:** Cuando tengas dudas sobre categorización: https://www.elastic.co/guide/en/ecs/current/index.html

## 🎉 Resumen

**Has creado una infraestructura completa** para migrar a Wazuh 5.0 ECS:
- ✅ 2 helpers modulares y reutilizables
- ✅ Datos comunes actualizados con campos ECS
- ✅ Estructura base migrada
- ✅ Módulo authentication migrado como ejemplo
- ✅ Documentación completa con ejemplos de código

**El resto es aplicar el mismo patrón a los 16 módulos restantes.**

Cada módulo tomará entre 15-30 minutos siguiendo el patrón del módulo authentication ya migrado.

¡Éxito con la migración! 🚀

