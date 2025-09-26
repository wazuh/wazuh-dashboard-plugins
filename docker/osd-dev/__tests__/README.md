# dev.sh Bats Tests

Este directorio contiene la suite de tests automatizados para `dev.sh`, basada en [bats-core](https://github.com/bats-core/bats-core) y ejecutada mediante Docker Compose.

## Requisitos previos

- Docker 24+ y Docker Compose v2 disponibles en tu `PATH`.
- Permisos para construir imágenes locales.

## Cómo ejecutar los tests

Desde `docker/osd-dev`:

```bash
__tests__/run-tests.sh
```

El script construirá la imagen definida en `__tests__/Dockerfile` (si es necesario) y levantará el servicio `dev-sh-tests` descrito en `__tests__/test.yml` para ejecutar `__tests__/dev.sh.bats`.

### Filtrar casos específicos

Pasa argumentos adicionales para que Bats sólo ejecute tests coincidentes:

```bash
__tests__/run-tests.sh --filter "server-local"
```

### Depuración

Para inspeccionar la ejecución dentro del contenedor puedes mantenerlo abierto:

```bash
__tests__/run-tests.sh --keep-going --no-tempdir
```

Tras ejecutar los tests se creará (o limpiará) `dev.override.generated.yml` según corresponda; los scripts de prueba se encargan de borrar artefactos.
