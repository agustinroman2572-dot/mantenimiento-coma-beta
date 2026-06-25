import { getSupabaseAdmin, sendOk, sendError } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();
    const consultas = await Promise.all([
      supabase.from('vw_dashboard_general').select('*').maybeSingle(),
      supabase.from('vw_equipos_actuales').select('*').order('interno'),
      supabase.from('vw_ot_pendientes').select('*').limit(100),
      supabase.from('vw_gantt_operativo').select('*').limit(200),
      supabase.from('novedades').select('*').order('created_at', { ascending:false }).limit(50)
    ]);

    for (const r of consultas) if (r.error) throw r.error;

    return sendOk(res, {
      dashboard: consultas[0].data,
      equipos: consultas[1].data || [],
      ot_pendientes: consultas[2].data || [],
      gantt: consultas[3].data || [],
      novedades: consultas[4].data || []
    });
  } catch (error) {
    return sendError(res, error);
  }
}