import { getSupabaseAdmin, sendOk, sendError, normalizeBody } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return sendError(res, 'Método no permitido', 405);
    const supabase = getSupabaseAdmin();
    const b = normalizeBody(req.body || {});

    if (!b.interno || !b.descripcion) return sendError(res, 'Falta interno o descripción.', 400);

    const tienePlan = Boolean(b.fecha_programada_inicio || b.fecha_inicio) && Boolean(b.fecha_estimada_cierre);
    const payload = {
      origen: 'DIRECTA',
      interno: b.interno,
      equipo: b.equipo || null,
      obra: b.obra || null,
      tipo: b.tipo || 'CORRECTIVO',
      prioridad: b.prioridad || 'MEDIA',
      sistema_afectado: b.sistema_afectado || null,
      descripcion: b.descripcion,
      mecanico_asignado: b.mecanico_asignado || null,
      fecha_programada_inicio: b.fecha_programada_inicio || b.fecha_inicio || null,
      fecha_estimada_cierre: b.fecha_estimada_cierre || null,
      observacion_interna: b.observacion_interna || null,
      estado: b.mecanico_asignado && tienePlan ? 'ASIGNADA' : 'PENDIENTE'
    };

    const { data, error } = await supabase.from('ordenes_trabajo').insert(payload).select('*').single();
    if (error) throw error;
    return sendOk(res, { orden_trabajo: data });
  } catch (error) {
    return sendError(res, error);
  }
}