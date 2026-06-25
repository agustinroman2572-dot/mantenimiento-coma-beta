# Mantenimiento COMA SA - V13 Rebuild

Base visual: el index V11.4 aprobado por Agustín.

Incluye backend para Vercel + Supabase:
- /api/diag
- /api/login
- /api/bootstrap
- /api/equipos
- /api/novedades
- /api/ot-directa
- /api/ot-asignar
- /api/ot-cerrar
- /api/horometros

## Orden correcto

1. Ejecutar SQL en Supabase: sql/01_supabase_v13_rebuild.sql
2. Subir este proyecto a GitHub.
3. Crear proyecto nuevo en Vercel.
4. Cargar variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SECRET_KEY
   - APP_PASSWORD=coma2026
5. Deploy.
6. Probar: /api/diag
7. Luego conectar botones del index a estos endpoints.

No pegar claves secretas en chat.
Deploy final V13
