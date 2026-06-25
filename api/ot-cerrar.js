import { getSupabaseAdmin, sendOk, sendError, normalizeBody } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return sendError(res, 'Método no permitido', 405);
    const supabase = getSupabaseAdmin();
    const b = normalizeBody(req.body || {});

    if (!b.orden_trabajo_id && !b.codigo_ot) return sendError(res, 'Falta orden_trabajo_id o codigo_ot.', 400);
    if (!b.trabajo_realizado) return sendError(res, 'Falta trabajo realizado.', 400);
    if (!b.foto_url) return sendError(res, 'Foto de cierre obligatoria.', 400);
    if (!b.fecha_cierre_real) return sendError(res, 'Falta fecha de cierre real.', 400);

    let otQuery = supabase.from('ordenes_trabajo').select('*').limit(1);
    otQuery = b.orden_trabajo_id ? otQuery.eq('id', b.orden_trabajo_id) : otQuery.eq('codigo_ot', b.codigo_ot);

    const { data: ots, error: readError } = await otQuery;
    if (readError) throw readError;
    const ot = ots?.[0];
    if (!ot) return sendError(res, 'OT no encontrada.', 404);

    const { data: cierre, error: cierreError } = await supabase
      .from('cierres_ot')
      .insert({
        orden_trabajo_id: ot.id,
        trabajo_realizado: b.trabajo_realizado,
        sistemas_afectados: b.sistemas_afectados || b.sistema_afectado || null,
        fecha_cierre_real: b.fecha_cierre_real,
        mecanico: b.mecanico || ot.mecanico_asignado || null,
        foto_url: b.foto_url,
        observaciones: b.observaciones || null,
        estado_final_equipo: b.estado_final_equipo || 'OPERATIVO'
      })
      .select('*')
      .single();
    if (cierreError) throw cierreError;

    const { data: otActualizada, error: updateError } = await supabase
      .from('ordenes_trabajo')
      .update({ estado: 'CERRADA', fecha_cierre_real: b.fecha_cierre_real })
      .eq('id', ot.id)
      .select('*')
      .single();
    if (updateError) throw updateError;

    return sendOk(res, { cierre, orden_trabajo: otActualizada });
  } catch (error) {
    return sendError(res, error);
  }
}