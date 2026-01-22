# Dashboard Provi - Frontend

Dashboard de análisis y visualización de datos de Grupo Provi.

## Descripción

Aplicación web construida con Next.js que muestra métricas y análisis de:
- Leads y conversiones
- Rendimiento de asesores
- Métricas de marketing
- Remarketing
- Walk-ins
- Avance vs metas de ventas

## Requisitos

- Node.js 18+
- npm o yarn
- Credenciales de Supabase (solo lectura)

## Instalación

```bash
npm install
```

## Configuración

Crea un archivo `.env.local` en la raíz con:

```env
# Supabase (público - solo lectura desde el navegador)
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# Supabase (servidor - para API routes)
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Autenticación (opcional)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Build para producción

```bash
npm run build
npm start
```

## Deployment

### Vercel (recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push

### Otros proveedores
Compatible con cualquier proveedor que soporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- etc.

## Estructura del proyecto

```
src/
├── app/
│   ├── api/              # API routes de Next.js
│   ├── dashboard/        # Páginas del dashboard
│   └── login/            # Página de login
├── components/
│   ├── dashboard/        # Componentes de visualización
│   ├── layout/           # Layout principal
│   └── configuracion/    # Componentes de configuración
└── lib/
    ├── data.ts           # Funciones de consulta a Supabase
    ├── supabase.ts       # Cliente de Supabase
    └── utils.ts          # Utilidades
```

## Vistas del Dashboard

- **Dirección**: Vista macro con KPIs generales
- **Ventas**: Rendimiento operativo de asesores
- **Marketing**: Análisis de canales y gastos
- **Remarketing**: Recuperación de leads
- **Brokers**: Gestión de aliados externos
- **Configuración**: Metas de ventas

## Tecnologías

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts (gráficas)
- Supabase (base de datos)
- Lucide React (iconos)
