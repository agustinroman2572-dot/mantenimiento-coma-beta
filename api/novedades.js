import { getSupabaseAdmin, sendOk, sendError, normalizeBody, boolSi } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('novedades').select('*').order('created_at', { ascending:false });
      if (error) throw error;
      return sendOk(res, { novedades: data || [] });
    }

    if (req.method === 'POST') {
      const b = normalizeBody(req.body || {});
      const equipoDetenido = boolSi(b.equipo_detenido);
      const criticidad = b.criticidad || 'MEDIA';
      const fotoObligatoria = criticidad === 'ALTA' || equipoDetenido;

      if (fotoObligatoria && !b.foto_url) {
        return sendError(res, 'Foto obligatoria si criticidad ALTA o equipo detenido.', 400);
      }

      const novedadPayload = {
        solicitante: b.solicitante || b.nombre || b.nombre_apellido || null,
        interno: b.interno,
        equipo: b.equipo || null,
        obra: b.obra || null,
        horometro: b.horometro ? Number(b.horometro) : null,
        sistema_afectado: b.sistema_afectado || null,
        criticidad,
        equipo_detenido: equipoDetenido,
        descripcion: b.descripcion || null,
        foto_url: b.foto_url || null,
        estado: 'PENDIENTE_REVISION'
      };

      const { data: novedad, error: novedadError } = await supabase
        .from('novedades').insert(novedadPayload).select('*').single();
      if (novedadError) throw novedadError;

      const { data: ot, error: otError } = await supabase
        .from('ordenes_trabajo')
        .insert({
          origen: 'NOVEDAD',
          novedad_id: novedad.id,
          interno: novedad.interno,
          equipo: novedad.equipo,
          obra: novedad.obra,
          tipo: 'CORRECTIVO',
          prioridad: novedad.criticidad,
          sistema_afectado: novedad.sistema_afectado,
          descripcion: novedad.descripcion,
          estado: 'PENDIENTE'
        })
        .select('*')
        .single();
      if (otError) throw otError;

      return sendOk(res, { novedad, orden_trabajo: ot });
    }

    return sendError(res, 'Método no permitido', 405);
  } catch (error) {
    return sendError(res, error);
  }
}