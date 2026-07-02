import { getSupabaseAdmin } from "../lib/supabaseAdmin.js";

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("vw_indicadores_gruas_moviles")
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({
        ok: false,
        error: error.message
      });
    }

    return res.status(200).json({
      ok: true,
      indicadores: data
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
