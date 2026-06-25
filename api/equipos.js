import { getSupabaseAdmin, sendOk, sendError, normalizeBody } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('equipos').select('*').order('interno');
      if (error) throw error;
      return sendOk(res, { equipos: data || [] });
    }

    if (req.method === 'POST') {
      const b = normalizeBody(req.body || {});
      if (!b.interno) return sendError(res, 'Falta interno.', 400);

      const payload = {
        interno: b.interno,
        equipo: b.equipo || null,
        grupo: b.grupo || null,
        tipo: b.tipo || null,
        marca: b.marca || null,
        modelo: b.modelo || null,
        anio: b.anio || null,
        serie: b.serie || null,
        chasis: b.chasis || null,
        motor: b.motor || null,
        obra_actual: b.obra_actual || b.obra || null,
        estado: b.estado || 'OPERATIVO',
        horometro_actual: b.horometro_actual ? Number(b.horometro_actual) : null
      };

      const { data, error } = await supabase.from('equipos').upsert(payload, { onConflict:'interno' }).select('*').single();
      if (error) throw error;
      return sendOk(res, { equipo: data });
    }

    return sendError(res, 'Método no permitido', 405);
  } catch (error) {
    return sendError(res, error);
  }
}