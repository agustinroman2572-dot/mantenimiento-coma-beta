import { getSupabaseAdmin, sendOk, sendError, normalizeBody } from '../lib/supabaseAdmin.js';

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clean(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

async function buscarEquipoPorInterno(supabase, interno) {
  const { data, error } = await supabase
    .from('equipos')
    .select('id, interno, descripcion, marca, modelo, estado, obra_id, horometro_actual, ultimo_service_horometro, service_intervalo_horas')
    .eq('interno', String(interno))
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function guardarUnHorometro(supabase, body) {
  const b = normalizeBody(body || {});

  const interno = clean(b.interno);
  const horometro = toNumber(b.horometro_actual ?? b.horometro ?? b.horas);

  if (!interno || horometro === null) {
    throw new Error('Falta interno u horómetro válido.');
  }

  const equipo = await buscarEquipoPorInterno(supabase, interno);

  if (!equipo) {
    throw new Error(`No se encontró equipo con interno ${interno}.`);
  }

  const fechaReporte =
    clean(b.fecha_reporte) ||
    clean(b.fecha) ||
    new Date().toISOString().slice(0, 10);

  const responsable =
    clean(b.responsable) ||
    clean(b.nombre) ||
    clean(b.reporta) ||
    'REPORTE WEB';

  const observacion =
    clean(b.observacion) ||
    clean(b.obs) ||
    clean(b.comentario) ||
    null;

  const origen =
    clean(b.origen) ||
    'REPORTE WEB';

  const payloadHorometro = {
    equipo_id: equipo.id,
    fecha_reporte: fechaReporte,
    horometro,
    obra_id: equipo.obra_id || null,
    responsable,
    origen,
    observacion
  };

  const { data: horometroInsertado, error: insertError } = await supabase
    .from('horometros')
    .insert(payloadHorometro)
    .select('*')
    .single();

  if (insertError) throw insertError;

 const { data: ultimoRegistro, error: ultimoError } = await supabase
  .from("horometros")
  .select("id, fecha_reporte, horometro, created_at")
  .eq("equipo_id", equipo.id)
  .order("fecha_reporte", { ascending: false })
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (ultimoError) throw ultimoError;

const updateEquipo = {};

if (ultimoRegistro && ultimoRegistro.horometro !== null) {
  updateEquipo.horometro_actual = Number(ultimoRegistro.horometro);
}

if (b.estado_equipo || b.estado) {
  updateEquipo.estado = clean(b.estado_equipo || b.estado);
}

if (Object.keys(updateEquipo).length > 0) {
  const { error: updateError } = await supabase
    .from("equipos")
    .update(updateEquipo)
    .eq("id", equipo.id);

  if (updateError) throw updateError;
}
  if (updateError) throw updateError;

  return {
    interno,
    equipo_id: equipo.id,
    horometro: horometroInsertado
  };
}

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('horometros')
        .select(`
          id,
          equipo_id,
          fecha_reporte,
          horometro,
          obra_id,
          responsable,
          origen,
          observacion,
          created_at,
          equipos (
            interno,
            descripcion,
            marca,
            modelo
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return sendOk(res, { horometros: data || [] });
    }

    if (req.method === 'POST') {
      const body = req.body || {};

      const registros =
        Array.isArray(body.registros) ? body.registros :
        Array.isArray(body.equipos) ? body.equipos :
        Array.isArray(body.horometros) ? body.horometros :
        null;

      if (registros) {
        const guardados = [];

        for (const item of registros) {
          const base = {
            responsable: body.responsable || body.nombre || body.reporta,
            fecha_reporte: body.fecha_reporte || body.fecha,
            origen: body.origen || 'REPORTE WEB'
          };

          const resultado = await guardarUnHorometro(supabase, {
            ...base,
            ...item
          });

          guardados.push(resultado);
        }

        return sendOk(res, {
          mensaje: 'Reporte semanal guardado correctamente.',
          cantidad: guardados.length,
          guardados
        });
      }

      const resultado = await guardarUnHorometro(supabase, body);

      return sendOk(res, {
        mensaje: 'Horómetro guardado correctamente.',
        ...resultado
      });
    }

    return sendError(res, 'Método no permitido', 405);
  } catch (error) {
    return sendError(res, error);
  }
}
