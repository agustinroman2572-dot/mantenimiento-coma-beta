import { getSupabaseAdmin, sendOk, sendError, normalizeBody } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return sendError(res, 'Método no permitido', 405);
    const supabase = getSupabaseAdmin();
    const b = normalizeBody(req.body || {});

    if (!b.id && !b.codigo_ot) return sendError(res, 'Falta id o codigo_ot.', 400);
    if (!b.mecanico_asignado || !b.fecha_programada_inicio || !b.fecha_estimada_cierre) {
      return sendError(res, 'Falta mecánico, fecha programada o fecha estimada de cierre.', 400);
    }

    const update = {
      mecanico_asignado: b.mecanico_asignado,
      fecha_programada_inicio: b.fecha_programada_inicio,
      fecha_estimada_cierre: b.fecha_estimada_cierre,
      prioridad: b.prioridad || 'MEDIA',
      observacion_mecanico: b.observacion_mecanico || null,
      estado: 'ASIGNADA'
    };

    let query = supabase.from('ordenes_trabajo').update(update);
    query = b.id ? query.eq('id', b.id) : query.eq('codigo_ot', b.codigo_ot);

    const { data, error } = await query.select('*').single();
    if (error) throw error;

    return sendOk(res, { orden_trabajo: data });
  } catch (error) {
    return sendError(res, error);
  }
}