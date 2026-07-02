import { getSupabaseAdmin, normalizeBody } from "../lib/supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Método no permitido"
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const body = normalizeBody(req.body || {});

    const ot_id = body.ot_id;
    const horometro_service = body.horometro_service;
    const observacion_cierre = body.observacion_cierre || null;

    if (!ot_id) {
      return res.status(400).json({
        ok: false,
        error: "Falta ot_id"
      });
    }

    if (!horometro_service) {
      return res.status(400).json({
        ok: false,
        error: "Falta horómetro de service"
      });
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
      return res.status(500).json({
        ok: false,
        error: error.message
      });
    }

    return res.status(200).json({
      ok: true,
      resultado: data
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
