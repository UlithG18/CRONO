# Crono

Sistema administrativo de Crono: agencia y academia de modelaje. Cubre las dos
divisiones del negocio (Crono Agency y Crono Models) con autenticación por JWT,
roles y permisos por recurso, auditoría y un módulo de Reclutamiento.

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `backend/` | API .NET 10, Entity Framework Core y SQL Server |
| `src/` | Aplicación administrativa (React + Vite) |
| `scripts/` | Scripts de verificación automatizada |

## Requisitos

- .NET 10 SDK
- Node.js 18 o superior
- Docker (para SQL Server)

## Configuración

La configuración con credenciales **no se incluye en el repositorio**. Crea el
archivo a partir de la plantilla:

```bash
cd backend
copy appsettings.json.example appsettings.json   # Windows
# cp appsettings.json.example appsettings.json    # macOS / Linux
```

Abre `backend/appsettings.json` y completa la contraseña de la base de datos y
la clave JWT.

## Base de datos

Levanta SQL Server:

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=TU_PASSWORD" \
  -p 1433:1433 -d --name crono-sql mcr.microsoft.com/mssql/server:2022-latest
```

Crea la base y aplica las migraciones:

```bash
cd backend
dotnet ef database update
```

Las migraciones **no** se aplican automáticamente al arrancar: se ejecutan de
forma explícita para que ningún arranque modifique el esquema sin revisión.

## Arranque

Terminal 1 (API):

```bash
cd backend
dotnet run --urls "http://localhost:5000"
```

Terminal 2 (aplicación administrativa):

```bash
npm install
npm run dev
```

La aplicación se abre en `http://localhost:3000` y se conecta al API en
`http://localhost:5000/api`. Ambos valores son configurables con variables de
entorno en tiempo de build:

```bash
# Cambia la URL del API antes de compilar
VITE_API_BASE=https://mi-servidor/api npm run build

# Ruta base para despliegues estáticos (por ejemplo GitHub Pages)
VITE_BASE=/mi-repo/ npm run build
```

## Verificación

Los scripts comprueban permisos, persistencia, relaciones y el flujo de los
formularios públicos contra el API en ejecución:

```bash
node scripts/test-staff-api.mjs
node scripts/test-rbac-and-data.mjs
node scripts/test-crud-admin.mjs
node scripts/test-reclutamiento.mjs
```

## Despliegue

La aplicación administrativa es una aplicación de página única construida con
Vite y puede alojarse en cualquier servicio de archivos estáticos.

Tiene dos limitaciones que debes conocer antes de publicarla:

1. **Necesita el API en ejecución.** Una despliegue estático (GitHub Pages u
   otro) solo sirve los archivos de la interfaz. Sin el API accesible por
   internet, el acceso y todos los datos dejan de funcionar.
2. **Las rutas deben ser de tipo hash.** Se compila con `HashRouter`
   (`/#/ruta`) para que las direcciones internas funcionen en alojamientos
   estáticos sin reglas de reescritura.

## Credenciales

Cada cuenta de prueba usa la misma contraseña, indicada en la documentación
internа del proyecto (no publicada). **Cámbiala antes de exponer el sistema en
ningún entorno accesible desde internet.**
