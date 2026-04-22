<!--
Outline (guión maestro) para la User Guide del módulo Active Response del
Wazuh Dashboard 5.0. NO es la guía redactada: las secciones mantienen bullets
y notas `<!-- VERIFY: ... -->` / `<!-- COPY-UI: ... -->` / `<!-- BUG-UI: ... -->`
para que redacción y QA cierren huecos antes de publicar.

Estilo: mismo esqueleto que detection.md y normalization.md (intro →
Concepts → Use Cases → Related Sections). Idioma de la guía: español
(decisión editorial pendiente si se traducen también detection.md y
normalization.md). Strings de UI se mantienen entre comillas en inglés,
tal como aparecen en el producto.

Fuentes:
  F2 — wazuh-dashboard-security-analytics/docs/active-response-5.0-guide.md
  F3 — wazuh-dashboard-plugins/docs/dev/modules/active-responses.md
  F4 — wazuh-dashboard-plugins/plugins/main/common/known-fields/active-responses.json
  F5 — repo wazuh-dashboard-notifications (app Active Responses)
  F6 — repo wazuh-dashboard-alerting (trigger Per-document)
  F7 — issue wazuh/wazuh#34606 y sub-tareas
-->

# Active Response

El módulo **Active Response** forma parte de la sección **Security Analytics** del Wazuh Dashboard. Permite automatizar acciones de remediación sobre los agentes cuando una alerta cumple una condición: bloquear una IP, aislar un host, matar un proceso o ejecutar un script personalizado. En Wazuh 5.0 la feature está rediseñada sobre el flujo de Alerting + Notifications del indexer; el endpoint `PUT /active-response` clásico se retiró.

Este módulo expone las siguientes secciones:

- **Active responses** — Lista los canales de respuesta activa disponibles, con filtros por estado, ubicación y tipo.
- **Create / Edit active response** — Formulario para definir un canal (ejecutable, tipo, ubicación, timeout).
- **Active response details** — Vista por canal: inspecciona la configuración, envía un mensaje de prueba, muteado y desmuteado.
- **Alerting integration** — Acción **Add active response** dentro de los triggers de un monitor *Per document*.

---

## Concepts

### Active response channels

Un **active response channel** es la unidad gestionable en esta app. Se almacena como un registro con `config_type: "active_response"` en el índice `.opensearch-notifications-config`, por lo que convive pero no se mezcla con los canales de notificación (Slack, Email, Webhook). La UI y las queries del backend fuerzan esa separación: el selector de canales en un trigger de Alerting muestra o canales de notificación o canales de Active Response, nunca ambos.

Un canal encapsula:

| Campo                | Descripción                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------- |
| **Name**             | Identificador visible del canal. Obligatorio, no vacío.                                       |
| **Description**      | Descripción libre, opcional.                                                                 |
| **Executable**       | Nombre del script en `/var/ossec/active-response/bin/` del agente. Obligatorio.              |
| **Extra arguments**  | String libre pasado al ejecutable. Opcional.                                                 |
| **Type**             | `stateless` (ejecuta una vez) o `stateful` (ejecuta y revierte tras un timeout).             |
| **Stateful timeout** | Entero en segundos. Solo aplica cuando `Type = stateful`. Debe ser `> 0`. Default `180`.     |
| **Location**         | `all`, `defined-agent` o `local`. Default `local`.                                           |
| **Agent ID**         | Identificador numérico del agente destino. Solo aplica cuando `Location = defined-agent`.    |

<!-- VERIFY: confirmar que los defaults del formulario siguen siendo stateless/local/180 en la versión productiva -->

### Stateful vs stateless

Un canal **stateless** dispara el ejecutable una única vez y no revierte nada. Un canal **stateful** dispara el ejecutable, espera `Stateful timeout` segundos y luego solicita al agente que **revierta** la acción. Para que el modo stateful funcione, el script tiene que implementar la operación inversa (típicamente `delete` frente a `add`).

| Modo          | Cuándo usarlo                                                                  | Riesgo principal                                                          |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **Stateless** | Acciones definitivas o idempotentes (matar proceso, notificar, reiniciar).     | Si se dispara por falso positivo, no hay reversión automática.            |
| **Stateful**  | Bloqueos temporales con reversión automática (bloquear IP durante 10 minutos). | Si el script no implementa la operación inversa, el estado queda pegado.  |

> **Important:** el valor de `Stateful timeout` se expresa en **segundos**, no en milisegundos. Antes de promover un canal a producción, ejecute manualmente el script en el agente con ambas operaciones (`add` y `delete`) para confirmar que la reversión es real.

<!-- IMAGE: Timeline comparativa stateful vs stateless -->
<!-- Suggested filename: images/active-response/01-stateful-vs-stateless-timeline.png -->
<!-- Qué debe mostrar: dos líneas de tiempo paralelas. A) stateful: t=0 disparo → acción
     aplicada → t=stateful_timeout reversión automática, anotación "default 180s". B)
     stateless: t=0 disparo → acción aplicada → sin reversión. -->

![Stateful vs stateless timeline](images/active-response/01-stateful-vs-stateless-timeline.png)

### Location and targeting

El campo **Location** define dónde se ejecuta el comando:

- **All** — El manager propaga el comando al agente que reportó la alerta disparadora, resolviendo el agente a partir de `ctx.alerts.0.related_doc_ids` (`event.doc_id` + `event.index`).
- **Defined agent** — Se ejecuta siempre en el agente cuyo ID se fija en el canal (`Agent ID`). El ID debe ser numérico.
- **Local** — Se ejecuta en el manager, no en un agente.

> **Important:** `Location = All` no significa "todos los agentes". Significa "el agente asociado al documento que disparó la alerta". Para actuar sobre varios agentes hay que diseñar la query del monitor de modo que genere un documento por agente, o crear varios canales con `Defined agent`.

<!-- VERIFY: confirmar el comportamiento exacto de Location=All en la versión productiva frente a la descripción de F2§2.2 -->

### Alerting integration

Un canal de Active Response no ejecuta por sí solo: es disparado desde un **trigger** de un monitor de Alerting. El tipo de monitor **debe** ser *Per document*; en cualquier otro tipo (Per query, Bucket-level, etc.) el botón **Add active response** no aparece.

Cuando el trigger se cumple, la acción de Active Response:

1. Crea un documento en el índice `wazuh-active-responses-*` con el esquema WCS (Wazuh Common Schema).
2. El manager hace *pull* de ese índice cada ~1 minuto mediante una tarea programada con bookmark persistente.
3. El manager envía el comando al agente (`wazuh-execd`), que ejecuta el script correspondiente.

El índice `wazuh-active-responses-*` tiene una ISM policy (`stream-active-responses-policy`) que elimina documentos tras 3 días. Para evidencia más allá de ese plazo, hay que ajustar la policy o exportar a otro índice.

<!-- IMAGE: Diagrama de arquitectura de alto nivel -->
<!-- Suggested filename: images/active-response/02-architecture-overview.png -->
<!-- Qué debe mostrar: 5 cajas con flechas numeradas - 1) Dashboard (app Active Responses) crea el canal en .opensearch-notifications-config, 2) Alerting (Per-document monitor) añade acción Add active response, 3) Indexer Notifications escribe documento WCS en wazuh-active-responses-*, 4) Manager pull ~1 min con bookmark, 5) Agente ejecuta script en /var/ossec/active-response/bin/. Sobre cada flecha, el artefacto que viaja. -->

![Active response architecture overview](images/active-response/02-architecture-overview.png)

---

## Use Case: Creating an active response channel

Este walkthrough muestra cómo crear un canal que, ante un evento de *brute-force SSH*, bloquea la IP atacante durante 10 minutos y la desbloquea automáticamente.

**Prerequisites:**

- Wazuh indexer, manager y dashboard en versión **5.0.0** o superior.
- Plugins `wazuh-indexer-notifications`, `wazuh-dashboard-notifications` y `wazuh-dashboard-alerting` instalados.
- Script `firewalld-drop` presente y ejecutable en `/var/ossec/active-response/bin/` del agente destino, propietario `root:wazuh`.
- Index pattern `wazuh-active-responses-*` disponible en **Stack Management → Index Patterns** (el health-check del dashboard lo crea automáticamente al arrancar).

---

### Step 1: Open the Active Responses app

En el menú lateral, desplegar **Explore** y seleccionar **Active Responses**. URL directa: `/app/active-responses`.

<!-- IMAGE: Menú Explore con la entrada Active Responses resaltada -->
<!-- Suggested filename: images/active-response/03-explore-menu-entry.png -->
<!-- Qué debe mostrar: menú lateral del dashboard expandido, grupo Explore desplegado,
     entrada "Active Responses" resaltada. Anotación: "Ruta: Explore → Active Responses". -->

![Explore menu - Active Responses](images/active-response/03-explore-menu-entry.png)

Si no hay canales creados, la aplicación muestra un empty state con el botón **Create active response**. Si ya existen canales, la pantalla principal es la tabla de listado (ver [Step 5](#step-5-verify-the-channel-in-the-list)).

<!-- IMAGE: Empty state de la app -->
<!-- Suggested filename: images/active-response/04-empty-state.png -->
<!-- Qué debe mostrar: empty state con título "No active responses to display",
     subtítulo "To response to events, you will need to create an active response."
     y CTA "Create active response". -->
<!-- BUG-UI: el subtítulo del empty state dice "To response to events" (F5 Channels.tsx:283);
     debería ser "To respond to events". Reportar antes de publicar. -->

![Active Responses empty state](images/active-response/04-empty-state.png)

---

### Step 2: Open the creation form

Pulsar **Create active response** (botón superior derecho en la tabla o CTA del empty state). El formulario abre en `/app/active-responses#/create-active-response` y se organiza en dos paneles: **Name and description** y **Configurations**.

<!-- IMAGE: Formulario de creación sin datos -->
<!-- Suggested filename: images/active-response/05-create-form-overview.png -->
<!-- Qué debe mostrar: formulario completo recién abierto, con los dos paneles
     plegables visibles y vacíos. Anotaciones 1) Panel Name and description, 2) Panel Configurations. -->

![Create active response - Empty form](images/active-response/05-create-form-overview.png)

---

### Step 3: Fill the **Name and description** panel

- **Name** — obligatorio. Para este caso: `block-ip-10min`. Validación: vacío muestra `"Active response name cannot be empty."`.
- **Description** — opcional. Para este caso: `Blocks the offending IP for 10 minutes via firewalld`.

<!-- IMAGE: Panel Name and description completado -->
<!-- Suggested filename: images/active-response/06-create-form-name-panel.png -->
<!-- Qué debe mostrar: panel Name and description lleno con los valores de ejemplo.
     Anotaciones: callout sobre el label "Description - optional". -->

![Create active response - Name and description](images/active-response/06-create-form-name-panel.png)

---

### Step 4: Fill the **Configurations** panel

Completar, en orden:

- **Executable**: `firewalld-drop`. Obligatorio. Validación: vacío muestra `"Executable name cannot be empty."`.
- **Extra arguments**: dejar vacío. Opcional.
- **Type**: seleccionar `Stateful`. Al hacerlo aparece el campo **Stateful timeout (seconds)**.
- **Stateful timeout (seconds)**: `600` (diez minutos). Default del formulario: `180`. Validaciones: no numérico → `"Stateful timeout must be a number."`; `≤ 0` → `"Stateful timeout must be greater than 0."`.
- **Location**: seleccionar `All`. Default: `Local`. Con `Defined agent` aparece el campo **Agent ID**, que acepta solo dígitos (regex `/^\d+$/`).

> **Important:** los campos **Stateful timeout** y **Agent ID** son condicionales. Si no aparecen, revise el valor de **Type** o de **Location**, respectivamente.

<!-- IMAGE: Panel Configurations con Type=Stateful y Stateful timeout visible -->
<!-- Suggested filename: images/active-response/07-create-form-stateful-timeout-visible.png -->
<!-- Qué debe mostrar: panel Configurations con Executable=firewalld-drop, Type=Stateful y
     Stateful timeout=600. Flecha indicando la aparición condicional del timeout. -->

![Create active response - Stateful timeout visible](images/active-response/07-create-form-stateful-timeout-visible.png)

<!-- IMAGE: Panel Configurations con Type=Stateless (timeout oculto) -->
<!-- Suggested filename: images/active-response/08-create-form-stateless-no-timeout.png -->
<!-- Qué debe mostrar: el mismo panel con Type=Stateless y el campo Stateful timeout ausente.
     Callout comparativo con la imagen anterior. -->

![Create active response - Stateless (no timeout)](images/active-response/08-create-form-stateless-no-timeout.png)

<!-- IMAGE: Location=Defined agent con Agent ID visible -->
<!-- Suggested filename: images/active-response/09-create-form-defined-agent.png -->
<!-- Qué debe mostrar: el panel con Location=Defined agent y el campo Agent ID con "003".
     Callout sobre la aparición condicional. -->

![Create active response - Defined agent](images/active-response/09-create-form-defined-agent.png)

La representación JSON equivalente del canal (lo que se persiste en `.opensearch-notifications-config`):

<details>
<summary>Channel JSON</summary>

```json
{
  "config_type": "active_response",
  "name": "block-ip-10min",
  "description": "Blocks the offending IP for 10 minutes via firewalld",
  "is_enabled": true,
  "active_response": {
    "executable": "firewalld-drop",
    "extra_args": "",
    "type": "stateful",
    "stateful_timeout": 600,
    "location": "all"
  }
}
```

</details>

> **Note:** el campo se llama **Extra arguments** en el formulario, **Extra args** en la página de detalle, `extra_args` en el payload del canal y `extra_arguments` en el documento indexado. Son el mismo campo; la guía unifica la mención bajo "Extra arguments" y señala la inconsistencia cuando sea relevante.

<!-- BUG-UI / inconsistencia: Extra arguments vs Extra args vs extra_args vs extra_arguments.
     Decidir con Producto si se normaliza un solo nombre. -->

---

### Step 5: Verify the channel in the list

Pulsar **Create**. Si algún campo falla, aparece el toast `"Some fields are invalid. Fix all highlighted error(s) before continuing."`. Cuando la validación pasa, un toast de éxito confirma `"Active response <name> successfully created."` y la vuelve a la tabla de listado.

La tabla muestra cinco columnas: **Name**, **Status**, **Location**, **Type** y **Description**. Los filtros superiores permiten acotar por **Status** (`Active` o `Muted`), **Location** (`All` / `Defined agent` / `Local`) y **Type** (`Stateful` / `Stateless`). La columna **Status** reporta el estado de *mute*: un canal con `Status = Muted` sigue siendo seleccionable en los triggers pero no ejecuta.

<!-- IMAGE: Lista de canales tras la creación -->
<!-- Suggested filename: images/active-response/10-channels-list.png -->
<!-- Qué debe mostrar: tabla con al menos 4 canales cubriendo combos (stateful/all,
     stateless/defined-agent, stateless/local y uno muteado). Anotaciones numeradas:
     1) título "Active responses", 2) botón "Create active response", 3) filtros
     Status/Location/Type, 4) badge Muted en una fila, 5) menú Actions desplegado. -->

![Active responses - Channels list](images/active-response/10-channels-list.png)

---

### Step 6: Inspect, test, edit, mute or delete a channel

Al hacer click sobre el **Name** en la tabla, se abre la página de detalle del canal. Ofrece:

- Re-lectura de los paneles **Name and description** y **Configurations** en modo sólo lectura.
- **Send test message** — valida la ruta de entrega del canal. Éxito: toast `"Successfully sent a test message."`; fallo: toast `"Failed to send the test message."` con enlace `"View error details and adjust the active response settings."`.
- **Mute active response / Unmute active response** — el botón alterna el estado y abre un modal de confirmación: `"This active response will stop sending responses to its recipients. However, the active response will remain available for selection."`
- Menú de acciones con **Edit** y **Delete**. El modal de **Delete** exige tipear literalmente `delete` para habilitar el botón.

<!-- VERIFY: ¿"Send test message" ejecuta el script en el agente, o solo valida la entrega del canal?
     Confirmar con Producto y reflejarlo explícitamente para que el usuario no espere cambios en el host. -->

<!-- IMAGE: Página de detalle del canal -->
<!-- Suggested filename: images/active-response/11-channel-details.png -->
<!-- Qué debe mostrar: página de detalle completa. Anotaciones 1) cabecera con badge Status,
     2) panel Name and description, 3) panel Configurations, 4) botón Send test message,
     5) botón Mute active response. -->

![Active response details](images/active-response/11-channel-details.png)

<!-- IMAGE: Modal de confirmación de Delete con "delete" tipeado -->
<!-- Suggested filename: images/active-response/12-delete-modal.png -->
<!-- Qué debe mostrar: modal "Delete <name>?" con el input que exige escribir "delete",
     con la palabra ya tipeada y el botón Delete habilitado. -->

![Delete active response - Confirmation](images/active-response/12-delete-modal.png)

> **Important:** eliminar un canal **no** elimina los triggers de Alerting que lo referencian: esos triggers quedan con una acción rota. Revisar Alerting después de cada `Delete` o preferir `Mute` para pausas cortas.

---

## Use Case: Attaching an active response to a monitor trigger

El canal creado en el use case anterior solo ejecuta si un trigger de Alerting lo invoca. Este walkthrough muestra cómo conectar el canal `block-ip-10min` a un monitor que detecta intentos de brute-force SSH.

**Prerequisites:** el canal `block-ip-10min` existe y tiene `Status = Active`.

---

### Step 1: Create a Per document monitor

Navegar a **Alerting → Monitors → Create monitor** y seleccionar **Monitor type = Per document monitor**. Cualquier otro tipo (Per query, Bucket-level, etc.) ocultará el botón **Add active response** en el paso 3.

<!-- VERIFY: ruta exacta del menú Alerting en Wazuh 5.0 -->

<!-- IMAGE: Selector del tipo de monitor con Per document resaltado -->
<!-- Suggested filename: images/active-response/13-monitor-type-per-document.png -->
<!-- Qué debe mostrar: paso de creación de monitor con el selector en "Per document monitor".
     Callout: "Required for Active Response actions". -->

![Alerting - Per document monitor type](images/active-response/13-monitor-type-per-document.png)

---

### Step 2: Configure the data source and query

Definir el índice origen y la query que aísla los eventos de interés. Para el ejemplo de brute-force SSH, el índice es `wazuh-alerts-*` y la query filtra alertas de autenticación fallida asociadas a la integración `custom-ssh-auth` (ver [Detection — Creating a Custom Detection Rule](./detection.md#use-case-creating-a-custom-detection-rule)).

---

### Step 3: Add an active response action to the trigger

En el editor del trigger conviven dos botones: **Add notification** (canales de notificación genéricos) y **Add active response** (canales de respuesta activa). Pulsar **Add active response**.

<!-- IMAGE: Trigger con los dos botones visibles -->
<!-- Suggested filename: images/active-response/14-trigger-two-buttons.png -->
<!-- Qué debe mostrar: editor del trigger con ambos botones en el mismo renglón.
     Anotaciones numeradas sobre los dos botones con nota lateral:
     "Add notification → notifica a personas; Add active response → ejecuta remediación". -->

![Alerting trigger - Two buttons](images/active-response/14-trigger-two-buttons.png)

La acción añadida muestra:

- Label del selector: **Active response**.
- Placeholder: `"Select active response to execute"`.
- Botón lateral **Manage active responses** — abre la app Active Responses en una nueva pestaña.
- Nombre por defecto de la acción: `Active Response <n>` (editable).

Al seleccionar el canal en el dropdown, la UI lo etiqueta como `[Active response] <name>`. Solo aparecen canales de tipo `active_response`.

<!-- IMAGE: Selector de canales AR dentro de la acción -->
<!-- Suggested filename: images/active-response/15-ar-action-selector.png -->
<!-- Qué debe mostrar: acción Active Response añadida, con el dropdown abierto mostrando
     el canal "[Active response] block-ip-10min". Anotaciones sobre el label, el
     placeholder y el botón "Manage active responses". -->

![Alerting trigger - AR channel selector](images/active-response/15-ar-action-selector.png)

> **Important:** si la acción AR no tiene canal seleccionado, Alerting bloquea el guardado con el mensaje `"Please select a active response or remove this notification."` <!-- BUG-UI: F6 enhanced-validate.js:8 usa "a active" y "notification"; debería ser "an active response" y probablemente "remove this active response". Reportar antes de publicar. -->

---

### Step 4: Save and trigger the monitor

Guardar el monitor. Cuando la query se cumple, la acción inyecta automáticamente estos valores en el documento de activación:

<details>
<summary>Valores fijos que inyecta la acción AR (no editables por el usuario)</summary>

```
id:                          activeResponse<hash>
name:                        Active Response <n>     (editable)
subject_template.source:     Alerting Active Response action
message_template.source:     {{ctx.alerts.0.related_doc_ids}}
action_execution_policy.per_alert.actionable_alerts: []
throttle_enabled:            false
throttle:                    { value: 10, unit: 'MINUTES' }
```

</details>

> **Note:** un único trigger puede contener varias acciones **Add active response**. Cada una generará un documento independiente en `wazuh-active-responses-*` y se ejecutará de forma separada.

---

## Use Case: Monitoring active response executions

Una vez el monitor dispara la acción, la ejecución deja rastro en dos lugares: el índice `wazuh-active-responses-*` del indexer y el log `/var/ossec/logs/active-responses.log` del agente.

---

### Step 1: Inspect the document in Discover

Navegar a **Discover** y seleccionar el index pattern `wazuh-active-responses-*`. Aplicar un filtro por `wazuh.active_response.name: "block-ip-10min"` y ordenar por `@timestamp` descendente.

Los campos útiles para investigación son:

| Campo                               | Contenido                                                          |
| ----------------------------------- | ------------------------------------------------------------------ |
| `@timestamp`                        | Momento en que se indexó la acción.                                |
| `event.doc_id`, `event.index`       | Documento original que disparó la alerta.                          |
| `wazuh.active_response.name`        | Nombre del canal.                                                  |
| `wazuh.active_response.type`        | `stateful` / `stateless`.                                          |
| `wazuh.active_response.executable`  | Script ejecutado.                                                  |
| `wazuh.active_response.extra_arguments` | Argumentos (en el documento indexado el campo es plural).      |
| `wazuh.active_response.stateful_timeout` | Timeout en segundos (solo stateful).                          |
| `wazuh.active_response.location`    | `all` / `defined-agent` / `local`.                                 |
| `wazuh.active_response.agent_id`    | ID del agente objetivo (solo defined-agent).                       |
| `wazuh.agent.id`, `.name`, `.groups`| Metadatos del agente reportador.                                   |

<!-- IMAGE: Discover sobre wazuh-active-responses-* -->
<!-- Suggested filename: images/active-response/16-discover-ar-documents.png -->
<!-- Qué debe mostrar: Discover con el index pattern seleccionado, filtro por
     wazuh.active_response.name, tabla con varios hits y un documento expandido
     mostrando el árbol de campos (event.*, wazuh.active_response.*, wazuh.agent.*). -->

![Discover - Active response documents](images/active-response/16-discover-ar-documents.png)

---

### Step 2: Verify execution on the agent

En el agente destino, revisar el log de `wazuh-execd`:

```bash
sudo tail -f /var/ossec/logs/active-responses.log
```

Cada ejecución produce una entrada con timestamp y los argumentos recibidos. El timestamp debe correlacionarse con el `@timestamp` del documento en Discover (con un retardo de hasta ~1 minuto por el intervalo de pull del manager).

<!-- IMAGE: tail del log en el agente -->
<!-- Suggested filename: images/active-response/17-agent-execd-log.png -->
<!-- Qué debe mostrar: terminal en el agente con tail -f /var/ossec/logs/active-responses.log
     y varias líneas correspondientes a las ejecuciones del canal block-ip-10min.
     Anotación: flecha curva correlacionando la línea con el documento en Discover. -->

![Agent execd log](images/active-response/17-agent-execd-log.png)

---

### Step 3: Pivot to the source alert

Desde un documento del índice AR, los campos `event.doc_id` y `event.index` permiten abrir la alerta original que disparó la acción (p. ej. desde Discover, cambiando al índice apuntado por `event.index` y filtrando por `_id == event.doc_id`). Esto cierra el bucle entre detección → activación → ejecución.

> **Note:** la ISM policy `stream-active-responses-policy` elimina los documentos tras **3 días**. Para retención forense mayor, ajustar la policy o indexar los documentos a un destino externo.

---

## Troubleshooting

| Síntoma                                                               | Causa probable                                                                        | Acción                                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| El canal no aparece en el selector del trigger                        | El monitor no es *Per document*, o el canal está muteado                               | Cambiar el tipo del monitor; **Unmute** el canal desde su página de detalle             |
| No se crea documento en `wazuh-active-responses-*`                    | `wazuh-indexer-notifications` no instalado o sin permisos sobre `.opensearch-notifications-config` | Revisar instalación y logs del indexer                                                  |
| El documento se indexa pero el agente no ejecuta                      | La tarea programada del manager está detenida, el agente no conecta con `wazuh-remoted` | Revisar el estado del manager y la comunicación con el agente                           |
| El agente responde `command not found`                                | Script ausente en `/var/ossec/active-response/bin/` o sin permisos                     | Desplegar el script, `chown root:wazuh`, `chmod +x`; probar manualmente con `sudo -u wazuh` |
| Un canal stateful no revierte al expirar el timeout                   | `Stateful timeout` demasiado alto o el script no implementa la operación inversa       | Confirmar el valor del timeout; ejecutar manualmente `script delete <arg>` en el agente |
| El index pattern `wazuh-active-responses-*` no existe                 | El health-check del dashboard falló o está deshabilitado                               | Revisar los logs del dashboard y reiniciar                                              |
| Los documentos AR desaparecen tras 3 días                             | Comportamiento esperado por la ISM policy                                              | Ajustar `stream-active-responses-policy` o exportar los documentos a otro índice        |
| El AR ejecuta en un agente distinto al esperado                       | `Location = All` con una query de monitor demasiado amplia, o `Agent ID` erróneo        | Acotar la query del monitor; revisar el `Agent ID` configurado en el canal              |

---

## FAQ

**¿Puedo seguir usando `<active-response>` clásico en `ossec.conf`?**
Sí, la configuración tradicional sigue funcionando. El flujo indexer-driven descrito aquí es el recomendado a partir de 5.0 y cubre el endpoint `PUT /active-response` que se eliminó.

**¿Cómo cambio la retención de 3 días?**
Editando la ISM policy `stream-active-responses-policy` en el indexer.

**¿Por qué hay dos botones distintos, *Add notification* y *Add active response*?**
Porque los ciclos de vida, permisos y trazabilidad de los canales de notificación y los canales de respuesta activa son distintos. La UI enforza la separación filtrando cada selector por `config_type`.

**¿Puedo encadenar varios AR en un mismo trigger?**
Sí. Cada acción **Add active response** genera un documento independiente en `wazuh-active-responses-*` y se ejecuta por separado.

**¿Qué parte de la alerta viaja al canal?**
Sólo `event.doc_id` y `event.index` (formato `doc_id|index`). El contenido completo se resuelve leyendo el documento original, lo cual evita payloads pesados y mantiene el índice AR ligero.

**¿Qué pasa si cambio el *Executable* de un canal que ya está en uso?**
El cambio aplica a ejecuciones futuras. Las ejecuciones pasadas se conservan en los documentos indexados con el ejecutable anterior.

**El botón *Add active response* no aparece en mi monitor — ¿es un bug?**
No. Solo se muestra cuando **Monitor type = Per document monitor**. Cambiar el tipo del monitor.

**¿Cómo revierto manualmente un AR stateful que debería haber expirado y sigue activo?**
Ejecutar manualmente el script con la operación inversa en el agente, por ejemplo `sudo -u wazuh /var/ossec/active-response/bin/firewalld-drop delete <arg>`.

**¿El AR funciona igual en Windows, macOS y Linux?**
<!-- VERIFY: la matriz de OS soportados no está cerrada en F2/F3. Pendiente de confirmación con Producto. -->
Pendiente de confirmación. Mientras tanto, la guía asume Linux como plataforma de referencia.

---

## Related Sections

- [Detection](./detection.md) — Reglas de detección que generan las alertas que disparan las respuestas activas.
- [Normalization](./normalization.md) — Decoders e integraciones que normalizan los eventos aguas arriba.
