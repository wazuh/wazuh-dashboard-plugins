# Análisis de Dependencias: currentPattern Cookie

## Resumen Ejecutivo

Este documento analiza las dependencias de la cookie `currentPattern` y las funciones relacionadas (`getCurrentPattern`, `setCurrentPattern`, `removeCurrentPattern`) en el código base de Wazuh Dashboard Plugins.

---

## 1. Definición de Funciones Base

### Ubicación: `plugins/main/public/react-services/app-state.js`

#### `AppState.getCurrentPattern()` (Líneas 260-276)

- **Función**: Obtiene el valor de la cookie `currentPattern`
- **Comportamiento**:
  - Lee la cookie y la decodifica
  - Maneja formato legacy (versiones 3.11 y anteriores) que incluía comillas dobles
  - Retorna string vacío si no existe

#### `AppState.setCurrentPattern(newPattern)` (Líneas 246-255)

- **Función**: Establece un nuevo valor en la cookie `currentPattern`
- **Comportamiento**:
  - Codifica el valor con `encodeURI`
  - Establece expiración de 365 días
  - Solo establece si `newPattern` es truthy

#### `AppState.removeCurrentPattern()` (Líneas 281-283)

- **Función**: Elimina la cookie `currentPattern`
- **Estado**: ⚠️ **NO UTILIZADA** - Solo está definida pero nunca se llama en el código

---

## 2. Jerarquía de Dependencias

### Nivel 0: Funciones Base (AppState)

```
app-state.js
├── getCurrentPattern() ✓
├── setCurrentPattern() ✓
└── removeCurrentPattern() ⚠️ NO USADA
```

### Nivel 1: Servicios y Utilidades que usan directamente AppState

#### 1.1 `pattern-handler.js` (Servicio de manejo de patrones)

- **Usa**: `getCurrentPattern()` (líneas 25, 48, 60), `setCurrentPattern()` (línea 46)
- **Propósito**: Gestiona la lista de patrones y cambios de patrón
- **Funciones**:
  - `getPatternList()` → usa `getCurrentPattern()`
  - `changePattern()` → usa `setCurrentPattern()` y `getCurrentPattern()`
  - `refreshIndexPattern()` → usa `getCurrentPattern()`

#### 1.2 `generic-request.js` (Servicio de peticiones genéricas)

- **Usa**: `getCurrentPattern()` (línea 45)
- **Propósito**: Obtiene el patrón actual para incluir en headers de peticiones HTTP
- **Uso**: Dentro de `request()` para establecer header `pattern`

#### 1.3 `elastic_helpers.ts` (Helpers de Elasticsearch)

- **Usa**: `getCurrentPattern()` (línea 25)
- **Propósito**: Obtiene el index pattern para consultas
- **Función**: `getIndexPattern()` → usa `getCurrentPattern()`

#### 1.4 `events-data-source-repository.ts` (Repositorio de eventos)

- **Usa**: `getCurrentPattern()` (líneas 95, 118), `setCurrentPattern()` (líneas 91, 106)
- **Propósito**: Gestiona el patrón de índice de eventos por defecto
- **Funciones**:
  - `getStoreIndexPatternId()` → usa `getCurrentPattern()`
  - `setDefault()` → usa `setCurrentPattern()`
  - `setupDefault()` → usa `setCurrentPattern()`
  - `EventsDataSourceSetup()` → usa `getCurrentPattern()` (función exportada)

### Nivel 2: Componentes y Hooks que usan los servicios del Nivel 1

#### 2.1 Hooks

##### `use-index-pattern.ts`

- **Usa**: `getCurrentPattern()` (línea 21)
- **Depende de**: AppState directamente
- **Propósito**: Hook de React para obtener el index pattern actual
- **Uso**: Retorna `IIndexPattern | undefined`

##### `use-es-search.ts` ⚠️ **REFERENCIA INDIRECTA**

- **Usa**: `useIndexPattern()` (línea 45) → que usa `getCurrentPattern()` indirectamente
- **Depende de**: `use-index-pattern.ts` (Nivel 2.1)
- **Propósito**: Hook para realizar búsquedas en Elasticsearch
- **Uso**: Retorna resultados de búsqueda, estado de carga y paginación
- **Nota**: Cualquier componente que use `useEsSearch` depende indirectamente de `getCurrentPattern()`

##### `withPluginPlatformContext.tsx` ⚠️ **REFERENCIA INDIRECTA**

- **Usa**: `useIndexPattern()` (línea 37) → que usa `getCurrentPattern()` indirectamente
- **Depende de**: `use-index-pattern.ts` (Nivel 2.1)
- **Propósito**: HOC (Higher Order Component) que inyecta contexto de plataforma (indexPattern, filterManager, query, timeFilter)
- **Uso**: Cualquier componente envuelto con este HOC depende indirectamente de `getCurrentPattern()`

#### 2.2 Componentes de Overview

##### `last-alerts-service.ts`

- **Usa**: `getCurrentPattern()` (línea 24)
- **Depende de**: AppState directamente
- **Propósito**: Obtiene alertas de las últimas 24 horas
- **Función**: `getLast24HoursAlerts()` → usa `getCurrentPattern()`

##### `subrequirements.tsx` (Compliance Table)

- **Usa**: `getCurrentPattern()` (línea 74)
- **Depende de**: AppState directamente
- **Propósito**: Filtros de compliance (PCI, GDPR, NIST, HIPAA, TSC)
- **Función**: `addFilter()` → usa `getCurrentPattern()`

##### `flyout-technique.tsx` (MITRE Framework)

- **Usa**: `getCurrentPattern()` (líneas 268, 286)
- **Depende de**: AppState directamente
- **Propósito**: Navegación a técnicas MITRE
- **Funciones**:
  - `goToTechniqueInIntelligence()` → usa `getCurrentPattern()`
  - `goToTacticInIntelligence()` → usa `getCurrentPattern()`

##### `requirement_vis.tsx` (Welcome/Requirement Visualization)

- **Usa**: `getCurrentPattern()` (línea 105)
- **Depende de**: AppState directamente
- **Propósito**: Visualización de requisitos
- **Función**: `goToDashboardWithFilter()` → usa `getCurrentPattern()`

#### 2.3 Componentes Comunes

##### `recent-events.tsx` (Wazuh Data Grid)

- **Usa**: `getCurrentPattern()` (línea 54)
- **Depende de**: AppState directamente
- **Propósito**: Generación de enlaces para eventos recientes
- **Uso**: En `generatePathNavigate()` para crear URLs de navegación

### Nivel 3: Inicialización de la Aplicación

#### `app-router.tsx`

- **Usa**: `EventsDataSourceSetup()` (línea 40)
- **Depende de**: `events-data-source-repository.ts` (Nivel 1)
- **Propósito**: Configuración inicial del patrón de eventos al iniciar la app
- **Función**: `Application` (componente con guard async) → llama `EventsDataSourceSetup()`

---

## 3. Diagrama de Dependencias Jerárquico

```
┌─────────────────────────────────────────────────────────────┐
│                    Nivel 0: Base                            │
│              app-state.js (AppState)                         │
│  • getCurrentPattern() ✓                                    │
│  • setCurrentPattern() ✓                                    │
│  • removeCurrentPattern() ⚠️ NO USADA                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├──────────────────────────────────┐
                            │                                  │
        ┌───────────────────┴──────────┐      ┌───────────────┴──────────────┐
        │                                │      │                                │
┌───────▼───────────────────┐  ┌─────────▼──────┐  ┌───────────▼──────────────┐
│  Nivel 1: Servicios       │  │  Nivel 1:      │  │  Nivel 1: Repositorio   │
│                           │  │  Utilidades   │  │                          │
│  • pattern-handler.js     │  │  • generic-   │  │  • events-data-source-   │
│    - getPatternList()     │  │    request.js │  │    repository.ts          │
│    - changePattern()       │  │               │  │    - getStoreIndex...()  │
│    - refreshIndex...()    │  │               │  │    - setDefault()         │
│                           │  │               │  │    - setupDefault()       │
│                           │  │               │  │    - EventsDataSource... │
└───────────────────────────┘  └───────────────┘  └──────────────────────────┘
        │                                │                  │
        │                                │                  │
        ├────────────────────────────────┼──────────────────┤
        │                                │                  │
┌───────▼───────────────────────────────────────────────────▼───────────────┐
│                    Nivel 2: Componentes y Hooks                           │
│                                                                           │
│  Hooks:                                                                   │
│  • use-index-pattern.ts                                                  │
│                                                                           │
│  Componentes Overview:                                                    │
│  • last-alerts-service.ts                                                 │
│  • subrequirements.tsx (Compliance)                                      │
│  • flyout-technique.tsx (MITRE)                                          │
│  • requirement_vis.tsx (Welcome)                                         │
│                                                                           │
│  Componentes Comunes:                                                     │
│  • recent-events.tsx (Data Grid)                                         │
│                                                                           │
│  Hooks Indirectos (Nivel 2.1.1):                                         │
│  • use-es-search.ts → usa useIndexPattern()                              │
│  • withPluginPlatformContext.tsx → usa useIndexPattern()                 │
│                                                                           │
│  Componentes que usan hooks indirectos:                                  │
│  • Cualquier componente que use useEsSearch                              │
│  • Cualquier componente envuelto con withPluginPlatformContext           │
└───────────────────────────────────────────────────────────────────────────┘
                            │
                            │
┌───────────────────────────▼───────────────────────────────────────────────┐
│                    Nivel 3: Inicialización                                │
│                                                                           │
│  • app-router.tsx                                                        │
│    - Application (withGuardAsync)                                        │
│      → EventsDataSourceSetup()                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Archivos que Usan currentPattern (Lista Completa)

### 4.1 Archivos de Producción

| Archivo                            | Función Usada                                                    | Línea            | Tipo de Uso            |
| ---------------------------------- | ---------------------------------------------------------------- | ---------------- | ---------------------- |
| `app-state.js`                     | `getCurrentPattern`, `setCurrentPattern`, `removeCurrentPattern` | 260, 246, 281    | Definición             |
| `pattern-handler.js`               | `getCurrentPattern`, `setCurrentPattern`                         | 25, 46, 48, 60   | Servicio               |
| `generic-request.js`               | `getCurrentPattern`                                              | 45               | Servicio HTTP          |
| `elastic_helpers.ts`               | `getCurrentPattern`                                              | 25               | Helper                 |
| `events-data-source-repository.ts` | `getCurrentPattern`, `setCurrentPattern`                         | 91, 95, 106, 118 | Repositorio            |
| `use-index-pattern.ts`             | `getCurrentPattern`                                              | 21               | Hook React             |
| `use-es-search.ts`                 | `getCurrentPattern` (vía useIndexPattern)                        | 45               | Hook React (indirecto) |
| `withPluginPlatformContext.tsx`    | `getCurrentPattern` (vía useIndexPattern)                        | 37               | HOC (indirecto)        |
| `last-alerts-service.ts`           | `getCurrentPattern`                                              | 24               | Servicio               |
| `subrequirements.tsx`              | `getCurrentPattern`                                              | 74               | Componente             |
| `flyout-technique.tsx`             | `getCurrentPattern`                                              | 268, 286         | Componente             |
| `requirement_vis.tsx`              | `getCurrentPattern`                                              | 105              | Componente             |
| `recent-events.tsx`                | `getCurrentPattern`                                              | 54               | Componente             |
| `app-router.tsx`                   | `EventsDataSourceSetup` (indirecto)                              | 40               | Inicialización         |

### 4.2 Archivos de Prueba (Tests)

| Archivo                                 | Función Mockeada                         | Propósito                   |
| --------------------------------------- | ---------------------------------------- | --------------------------- |
| `events-data-source-repository.test.ts` | `getCurrentPattern`, `setCurrentPattern` | Tests del repositorio       |
| `use-search-bar.test.ts`                | `getCurrentPattern`, `setCurrentPattern` | Tests del hook search bar   |
| `intelligence.test.tsx`                 | `getCurrentPattern`                      | Tests de MITRE intelligence |
| `navigation-service.test.ts`            | `getCurrentPattern`                      | Tests de navegación         |

### 4.3 Archivos de Documentación

| Archivo                   | Contenido                                      |
| ------------------------- | ---------------------------------------------- |
| `docs/diag/diagnostic.md` | Documentación sobre la cookie `currentPattern` |

### 4.4 Archivos de Configuración

| Archivo                                  | Contenido                        |
| ---------------------------------------- | -------------------------------- |
| `plugins/main/test/cypress/cookies.json` | Cookie de ejemplo para tests E2E |

---

## 5. Funciones No Utilizadas

### ⚠️ `AppState.removeCurrentPattern()`

**Ubicación**: `plugins/main/public/react-services/app-state.js:281-283`

**Estado**: **DEFINIDA PERO NUNCA LLAMADA**

**Análisis**:

- La función está definida en `AppState`
- No se encontró ninguna llamada a esta función en todo el código base
- No hay tests que la utilicen
- No hay documentación sobre cuándo debería usarse

**Recomendación**:

- Si no se planea usar, considerar eliminarla para mantener el código limpio
- Si se planea usar en el futuro, documentar su propósito y casos de uso

---

## 6. Flujo de Inicialización

### Secuencia de Inicialización al Iniciar la Aplicación:

```
1. plugin.ts (setup)
   └─> Inicializa cookies y AppState

2. app-router.tsx (Application component)
   └─> withGuardAsync ejecuta:
       ├─> WzRequest.setupAPI()
       ├─> loadAppConfig()
       └─> EventsDataSourceSetup() ← ESTABLECE currentPattern si no existe

3. EventsDataSourceSetup() (events-data-source-repository.ts)
   ├─> AppState.getCurrentPattern() ← LEE cookie
   ├─> Obtiene todos los data sources disponibles
   ├─> Verifica si el patrón seleccionado existe
   └─> Si no existe o no hay selección:
       └─> repository.setupDefault()
           └─> AppState.setCurrentPattern() ← ESTABLECE cookie
```

---

## 7. Patrones de Uso

### 7.1 Lectura (getCurrentPattern)

**Casos de uso principales**:

1. **Obtener ID de patrón para consultas**: Usado en servicios que necesitan el patrón actual para hacer búsquedas
2. **Configuración de filtros**: Usado para establecer el `index` en filtros de Kibana
3. **Navegación**: Usado para generar URLs con el patrón correcto
4. **Fallback**: Muchos lugares usan `getCurrentPattern() || defaultPattern` como fallback

**Ejemplos**:

```typescript
// En last-alerts-service.ts
const currentIndexPattern = await getDataPlugin().indexPatterns.get(
  AppState.getCurrentPattern() ||
    getWazuhCorePlugin().configuration.getSettingValue('pattern'),
);

// En subrequirements.tsx
index: AppState.getCurrentPattern() ||
  getWazuhCorePlugin().configuration.getSettingValue('pattern');
```

### 7.2 Escritura (setCurrentPattern)

**Casos de uso principales**:

1. **Establecer patrón por defecto**: Cuando no hay patrón seleccionado
2. **Cambio de patrón**: Cuando el usuario selecciona un nuevo patrón
3. **Corrección de formato**: Cuando se detecta formato legacy (dentro de `getCurrentPattern`)

**Ejemplos**:

```typescript
// En events-data-source-repository.ts
setDefault(dataSource: tParsedIndexPattern): void {
  AppState.setCurrentPattern(dataSource.id);
}

// En pattern-handler.js
static async changePattern(selectedPattern) {
  AppState.setCurrentPattern(selectedPattern);
  await this.refreshIndexPattern();
  return AppState.getCurrentPattern();
}
```

---

## 8. Dependencias Críticas

### Componentes que REQUIEREN currentPattern para funcionar:

1. **GenericRequest**: Todas las peticiones HTTP incluyen el patrón en headers
2. **EventsDataSourceSetup**: Inicialización crítica de la aplicación
3. **Last Alerts Service**: Dashboard de overview depende de esto
4. **Compliance Tables**: Filtros de compliance requieren el patrón
5. **MITRE Framework**: Navegación entre técnicas requiere el patrón

### Impacto si currentPattern no está disponible:

- ❌ Las peticiones HTTP pueden fallar o no incluir el patrón correcto
- ❌ Los filtros de Kibana no funcionarán correctamente
- ❌ La navegación entre vistas puede fallar
- ❌ Los dashboards no mostrarán datos

---

## 9. Recomendaciones

### 9.1 Funciones No Utilizadas

- **Eliminar** `removeCurrentPattern()` si no se planea usar
- **O documentar** su propósito si se planea usar en el futuro

### 9.2 Mejoras de Código

- Considerar crear un hook `useCurrentPattern()` que encapsule la lógica
- Centralizar el manejo de fallbacks (`getCurrentPattern() || defaultPattern`)
- Considerar usar Context API de React para evitar prop drilling

### 9.3 Testing

- Asegurar que todos los componentes que usan `getCurrentPattern` tengan tests
- Crear tests para `removeCurrentPattern` si se decide mantenerla
- Tests de integración para el flujo completo de inicialización

### 9.4 Documentación

- Documentar el propósito de `currentPattern` cookie
- Documentar cuándo y cómo se establece
- Documentar el formato esperado del valor

---

## 10. Archivos que Importan AppState pero NO Usan currentPattern

Los siguientes archivos importan `AppState` pero **NO utilizan** `getCurrentPattern`, `setCurrentPattern` o `removeCurrentPattern`. Esto es normal ya que `AppState` tiene muchas otras funciones (getCurrentAPI, setCurrentAPI, getClusterInfo, etc.).

### Archivos que Importan AppState pero NO Usan Funciones de currentPattern:

| Archivo                                 | Razón de Importación                                                 |
| --------------------------------------- | -------------------------------------------------------------------- |
| `overview.tsx`                          | Usa otras funciones de AppState (no relacionadas con currentPattern) |
| `wz-menu.js`                            | Usa otras funciones de AppState                                      |
| `wz-request.ts`                         | Usa otras funciones de AppState                                      |
| `wz-authentication.ts`                  | Usa otras funciones de AppState                                      |
| `query-config.js`                       | Usa otras funciones de AppState                                      |
| `plugin.ts`                             | Usa `AppState.checkCookies()`                                        |
| `api-table.js`                          | Usa otras funciones de AppState                                      |
| `security/main.tsx`                     | Usa otras funciones de AppState                                      |
| `requirement-flyout.tsx`                | Usa otras funciones de AppState                                      |
| `use-selected-server-api.ts`            | Usa `AppState.selectedServerAPI$` observable                         |
| `statistics-data-source.ts`             | Usa otras funciones de AppState                                      |
| `pattern-data-source-repository.ts`     | Usa otras funciones de AppState                                      |
| `pattern-data-source-filter-manager.ts` | Usa otras funciones de AppState                                      |
| `sample-data.tsx`                       | Usa otras funciones de AppState                                      |
| `state-adapter.ts`                      | Usa otras funciones de AppState                                      |
| `init.ts` (devtools)                    | Usa otras funciones de AppState                                      |
| `main-panel.tsx`                        | Usa otras funciones de AppState                                      |
| `use-setup.ts`                          | Usa otras funciones de AppState                                      |
| `state-storage.ts`                      | Usa otras funciones de AppState                                      |

**Nota**: Estos archivos son válidos y no representan código muerto. Simplemente usan otras funcionalidades de `AppState` que no están relacionadas con `currentPattern`.

---

## 11. Estadísticas

- **Total archivos que usan currentPattern DIRECTAMENTE**: 12 archivos de producción
- **Total archivos que usan currentPattern INDIRECTAMENTE**: 2 archivos (use-es-search.ts, withPluginPlatformContext.tsx)
- **Total archivos de prueba**: 4 archivos
- **Total archivos que importan AppState pero NO usan currentPattern**: ~19 archivos
- **Total llamadas directas a getCurrentPattern**: ~22 llamadas
- **Total llamadas indirectas a getCurrentPattern**: ~2+ (vía hooks)
- **Total llamadas a setCurrentPattern**: ~6 llamadas
- **Total llamadas a removeCurrentPattern**: 0 llamadas ⚠️
- **Niveles de dependencia**: 4 niveles (agregado nivel 2.1.1 para hooks indirectos)
- **Funciones no utilizadas**: 1 (`removeCurrentPattern`)
- **Componentes afectados indirectamente**: Todos los que usan `useEsSearch` o `withPluginPlatformContext`

---

## 12. Dependencias Indirectas Adicionales

### 12.1 Hooks que Dependen Indirectamente

#### `useEsSearch` (use-es-search.ts)

- **Cadena de dependencia**: `useEsSearch` → `useIndexPattern()` → `getCurrentPattern()`
- **Línea**: 45 en `use-es-search.ts`
- **Impacto**: Cualquier componente que use este hook para búsquedas en Elasticsearch depende indirectamente de `currentPattern`
- **Uso**: Hook para realizar búsquedas paginadas en Elasticsearch con filtros y agregaciones

#### `withPluginPlatformContext` (withPluginPlatformContext.tsx)

- **Cadena de dependencia**: `withPluginPlatformContext` → `useIndexPattern()` → `getCurrentPattern()`
- **Línea**: 37 en `withPluginPlatformContext.tsx`
- **Impacto**: Cualquier componente envuelto con este HOC depende indirectamente de `currentPattern`
- **Uso**: HOC que inyecta contexto de plataforma (indexPattern, filterManager, query, timeFilter) a componentes

### 12.2 Componentes que Usan Estos Hooks Indirectamente

Aunque no se encontraron componentes que usen directamente `useEsSearch` en el código actual, el hook está exportado y disponible para uso futuro.

El HOC `withPluginPlatformContext` está exportado y puede ser usado por múltiples componentes, aunque no se encontraron usos directos en la búsqueda actual. Sin embargo, está disponible en el sistema de HOCs y puede ser utilizado por componentes que necesiten el contexto de la plataforma.

### 12.3 Impacto de las Dependencias Indirectas

Las dependencias indirectas significan que:

1. **Cualquier componente que use `useEsSearch`** automáticamente depende de `currentPattern`
2. **Cualquier componente envuelto con `withPluginPlatformContext`** automáticamente depende de `currentPattern`
3. Estos componentes **no necesitan llamar directamente** a `getCurrentPattern()`, pero **requieren que la cookie esté establecida** para funcionar correctamente

---

## 13. Conclusión

La cookie `currentPattern` es un componente crítico del sistema que:

- Se establece durante la inicialización de la aplicación
- Se lee frecuentemente en múltiples componentes y servicios
- Es esencial para el funcionamiento de filtros, navegación y consultas
- **Tiene dependencias indirectas** a través de hooks como `useEsSearch` y HOCs como `withPluginPlatformContext`

**Funciones activas**: `getCurrentPattern()` y `setCurrentPattern()` están ampliamente utilizadas y son críticas, tanto directamente como indirectamente.

**Función inactiva**: `removeCurrentPattern()` está definida pero nunca se utiliza, lo que sugiere código muerto que debería eliminarse o documentarse para uso futuro.

**Dependencias indirectas**: Se identificaron 2 hooks/HOCs que crean dependencias indirectas, lo que aumenta el alcance del impacto de `currentPattern` en el sistema.
