import { getSupabaseAdmin, sendOk, sendError } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
      APP_PASSWORD: Boolean(process.env.APP_PASSWORD)
    };

    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
      return res.status(200).json({
        ok: false,
        etapa: 'variables_vercel',
        env,
        mensaje: 'Faltan variables. Cargalas en Vercel > Settings > Environment Variables.'
      });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('equipos').select('id, interno, descripcion, marca, modelo').limit(3);
    if (error) throw error;

    return sendOk(res, {
      etapa: 'conexion_supabase',
      mensaje: 'Backend conectado correctamente con Supabase.',
      env,
      muestra_equipos: data || []
    });
  } catch (error) {
    return sendError(res, error);
  }
}
