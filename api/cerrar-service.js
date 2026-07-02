import { getSupabaseAdmin, sendOk, sendError, normalizeBody } from "../lib/supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "Método no permitido");
  }

  try {
    const supabase = getSupabaseAdmin();
    const body = normalizeBody(req.body || {});

    const ot_id = body.ot_id;
    const horometro_service = body.horometro_service;
    const observacion_cierre = body.observacion_cierre || null;

    if (!ot_id) {
      return sendError(res, 400, "Falta ot_id");
    }

    if (!horometro_service) {
      return sendError(res, 400, "Falta horómetro de service");
    }

    const { data, error } = await supabase.rpc(
      "cerrar_ot_y_actualizar_service",
      {
        p_ot_id: ot_id,
        p_horometro_service: Number(horometro_service),
        p_observacion_cierre: observacion_cierre
      }
    );

    if (error) {
      return sendError(res, 500, error.message);
    }

    return sendOk(res, {
      resultado: data
    });

  } catch (err) {
    return sendError(res, 500, err.message);
  }
}
