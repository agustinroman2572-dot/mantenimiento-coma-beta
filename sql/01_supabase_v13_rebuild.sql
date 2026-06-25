-- MANTENIMIENTO COMA SA - V13 REBUILD
-- Base limpia para la app visual V11.4 aprobada.
-- Ejecutar completo en Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- 1) Secuencias
create sequence if not exists ordenes_trabajo_codigo_seq start 1;

-- 2) Tablas
create table if not exists equipos (
  id uuid primary key default gen_random_uuid(),
  interno text unique not null,
  equipo text,
  grupo text,
  tipo text,
  marca text,
  modelo text,
  anio text,
  serie text,
  chasis text,
  motor text,
  obra_actual text,
  estado text default 'OPERATIVO',
  horometro_actual numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists novedades (
  id uuid primary key default gen_random_uuid(),
  solicitante text,
  interno text,
  equipo text,
  obra text,
  horometro numeric,
  sistema_afectado text,
  criticidad text default 'MEDIA',
  equipo_detenido boolean default false,
  descripcion text,
  foto_url text,
  estado text default 'PENDIENTE_REVISION',
  created_at timestamptz default now()
);

create table if not exists ordenes_trabajo (
  id uuid primary key default gen_random_uuid(),
  codigo_ot text unique default ('OT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('ordenes_trabajo_codigo_seq')::text, 4, '0')),
  origen text default 'DIRECTA',
  novedad_id uuid references novedades(id) on delete set null,
  interno text,
  equipo text,
  obra text,
  tipo text,
  prioridad text default 'MEDIA',
  sistema_afectado text,
  descripcion text,
  mecanico_asignado text,
  fecha_programada_inicio date,
  fecha_estimada_cierre date,
  fecha_cierre_real date,
  observacion_interna text,
  observacion_mecanico text,
  estado text default 'PENDIENTE',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cierres_ot (
  id uuid primary key default gen_random_uuid(),
  orden_trabajo_id uuid references ordenes_trabajo(id) on delete cascade,
  trabajo_realizado text not null,
  sistemas_afectados text,
  fecha_cierre_real date not null,
  mecanico text,
  foto_url text not null,
  observaciones text,
  estado_final_equipo text,
  created_at timestamptz default now()
);

create table if not exists horometros (
  id uuid primary key default gen_random_uuid(),
  interno text,
  equipo text,
  obra text,
  horometro_actual numeric not null,
  fecha_reporte date default current_date,
  estado_equipo text default 'OPERATIVO',
  observacion text,
  proximo_service numeric,
  horas_faltantes numeric,
  created_at timestamptz default now()
);

create table if not exists archivos_fotos (
  id uuid primary key default gen_random_uuid(),
  modulo text,
  registro_id uuid,
  interno text,
  url text not null,
  nombre_archivo text,
  created_at timestamptz default now()
);

create table if not exists auditoria_cambios (
  id uuid primary key default gen_random_uuid(),
  usuario text,
  modulo text,
  registro_id uuid,
  accion text,
  detalle jsonb,
  created_at timestamptz default now()
);

create table if not exists usuarios_app (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  rol text,
  activo boolean default true,
  created_at timestamptz default now()
);

-- 3) Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mantenimiento-fotos', 'mantenimiento-fotos', false, 52428800, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 4) Datos de prueba controlados
insert into equipos (interno, equipo, grupo, tipo, marca, modelo, anio, obra_actual, estado, horometro_actual)
values
('223','GRÚA 90 TN','GRÚAS','GRÚA MÓVIL','SANY','SRC900C','2020','RIO TINTO','OPERATIVO',6245),
('237','GRÚA SOBRE ORUGAS','GRÚAS','GRÚA ORUGA','SANY','SCC2800','2023','RIO TINTO','OPERATIVO',4920),
('206','BOMBA HORMIGÓN','BOMBAS','BOMBA','WEICHAI',null,null,'PREDIO MORENO','OPERATIVO CON OBSERVACIONES',null)
on conflict (interno) do update set
  equipo=excluded.equipo,
  grupo=excluded.grupo,
  tipo=excluded.tipo,
  marca=excluded.marca,
  modelo=excluded.modelo,
  anio=excluded.anio,
  obra_actual=excluded.obra_actual,
  estado=excluded.estado,
  horometro_actual=excluded.horometro_actual,
  updated_at=now();

insert into horometros (interno, equipo, obra, horometro_actual, fecha_reporte, estado_equipo, observacion, proximo_service, horas_faltantes)
values
('223','SANY SRC900C','RIO TINTO',6245,current_date,'OPERATIVO','PROGRAMAR SERVICE',6250,5),
('237','SANY SCC2800','RIO TINTO',4920,current_date,'OPERATIVO','SIN NOVEDAD',5000,80)
on conflict do nothing;

insert into ordenes_trabajo (origen, interno, equipo, obra, tipo, prioridad, sistema_afectado, descripcion, mecanico_asignado, fecha_programada_inicio, fecha_estimada_cierre, estado)
values
('SERVICE','223','SANY SRC900C','RIO TINTO','SERVICE','ALTA','MOTOR','SERVICE 6250 HS Y CONTROL GENERAL','JUAN PÉREZ', current_date + 1, current_date + 3, 'ASIGNADA'),
('DIRECTA','237','SANY SCC2800','RIO TINTO','PREVENTIVO','MEDIA','HIDRÁULICO','CONTROL PREVENTIVO POR HORÓMETRO','CARLOS LÓPEZ', current_date + 2, current_date + 4, 'EN CURSO')
on conflict do nothing;

insert into usuarios_app (nombre, rol)
values
('AGUSTÍN ROMÁN','ADMINISTRADORES'),
('JUAN PÉREZ','MECÁNICOS'),
('CARLOS LÓPEZ','MECÁNICOS'),
('SUPERVISOR RT','JEFE DE OBRA / OPERADOR')
on conflict do nothing;

-- 5) Vistas limpias
create or replace view vw_dashboard_general as
select
  (select count(*) from ordenes_trabajo where estado in ('PENDIENTE','ASIGNADA','EN CURSO')) as ot_abiertas,
  (select count(*) from ordenes_trabajo where estado = 'PENDIENTE') as ot_pendientes,
  (select count(*) from ordenes_trabajo where estado in ('ASIGNADA','EN CURSO')) as ot_en_proceso,
  (select count(*) from ordenes_trabajo where estado = 'CERRADA') as ot_cerradas,
  (select count(*) from horometros where horas_faltantes <= 50) as services_a_programar,
  (select count(*) from equipos) as equipos_total;

create or replace view vw_ultimo_horometro as
select distinct on (interno)
  *
from horometros
order by interno, fecha_reporte desc, created_at desc;

create or replace view vw_equipos_actuales as
select
  e.*,
  h.proximo_service,
  h.horas_faltantes,
  h.fecha_reporte as fecha_ultimo_horometro
from equipos e
left join vw_ultimo_horometro h on h.interno = e.interno;

create or replace view vw_ot_pendientes as
select *
from ordenes_trabajo
where estado in ('PENDIENTE','ASIGNADA','EN CURSO')
order by created_at desc;

create or replace view vw_ot_cerradas as
select
  ot.codigo_ot,
  ot.interno,
  ot.equipo,
  ot.obra,
  ot.tipo,
  ot.prioridad,
  c.trabajo_realizado,
  c.sistemas_afectados,
  c.fecha_cierre_real,
  c.mecanico,
  c.foto_url,
  c.observaciones
from cierres_ot c
join ordenes_trabajo ot on ot.id = c.orden_trabajo_id
order by c.fecha_cierre_real desc;

create or replace view vw_services_programacion as
select
  e.interno,
  e.equipo,
  e.obra_actual as obra,
  e.horometro_actual,
  e.proximo_service,
  e.horas_faltantes,
  current_date + greatest(0, ceil(coalesce(e.horas_faltantes, 0) / 9.0))::int as fecha_tentativa_service,
  current_date + greatest(0, ceil(coalesce(e.horas_faltantes, 0) / 9.0))::int - 14 as fecha_programar,
  case
    when e.horas_faltantes <= 0 then 'VENCIDO'
    when e.horas_faltantes <= 50 then 'PROGRAMAR'
    else 'NORMAL'
  end as estado_service
from vw_equipos_actuales e
where e.horas_faltantes is not null;

create or replace view vw_gantt_operativo as
select
  'OT' as tipo_registro,
  ot.codigo_ot as codigo,
  ot.interno,
  ot.equipo,
  ot.obra,
  ot.estado,
  ot.fecha_programada_inicio as fecha_inicio,
  ot.fecha_estimada_cierre as fecha_fin,
  ot.prioridad,
  ot.descripcion
from ordenes_trabajo ot
where ot.estado <> 'CERRADA'
union all
select
  'SERVICE' as tipo_registro,
  ('SERVICE ' || proximo_service::text) as codigo,
  interno,
  equipo,
  obra,
  estado_service as estado,
  fecha_programar as fecha_inicio,
  fecha_tentativa_service as fecha_fin,
  case when estado_service='VENCIDO' then 'ALTA' when estado_service='PROGRAMAR' then 'MEDIA' else 'BAJA' end as prioridad,
  ('PRÓXIMO SERVICE ' || proximo_service::text || ' HS') as descripcion
from vw_services_programacion;

create or replace view vw_reportes_lunes as
select * from horometros order by fecha_reporte desc, created_at desc;

create or replace view vw_historial_mantenimiento as
select * from vw_ot_cerradas;