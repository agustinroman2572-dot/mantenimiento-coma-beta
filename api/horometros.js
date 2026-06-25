import { getSupabaseAdmin, sendOk, sendError, normalizeBody } from '../lib/supabaseAdmin.js';

function proximoService250(h) {
  const n = Number(h || 0);
  if (!Number.isFinite(n)) return null;
  return Math.ceil((n + 0.0001) / 250) * 250;
}

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('horometros').select('*').order('fecha_reporte', { ascending:false });
      if (error) throw error;
      return sendOk(res, { horometros: data || [] });
    }

    if (req.method === 'POST') {
      const b = normalizeBody(req.body || {});
      const h = Number(b.horometro_actual || b.horometro);
      if (!b.interno || !Number.isFinite(h)) return sendError(res, 'Falta interno u horómetro válido.', 400);

      const prox = proximoService250(h);
      const payload = {
        interno: b.interno,
        equipo: b.equipo || null,
        obra: b.obra || null,
        horometro_actual: h,
        fecha_reporte: b.fecha_reporte || new Date().toISOString().slice(0, 10),
        estado_equipo: b.estado_equipo || 'OPERATIVO',
        observacion: b.observacion || null,
        proximo_service: prox,
        horas_faltantes: prox - h
      };

      const { data, error } = await supabase.from('horometros').insert(payload).select('*').single();
      if (error) throw error;

      await supabase.from('equipos')
        .update({ horometro_actual: h, obra_actual: payload.obra, estado: payload.estado_equipo })
        .eq('interno', payload.interno);

      return sendOk(res, { horometro: data });
    }

    return sendError(res, 'Método no permitido', 405);
  } catch (error) {
    return sendError(res, error);
  }
}