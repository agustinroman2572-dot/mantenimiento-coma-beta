export default async function handler(req, res) {
  const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  null;
    null;

  const secret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    null;

  res.status(200).json({
    ok: true,
    NEXT_PUBLIC_SUPABASE_URL_detectada: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_URL_detectada: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SECRET_KEY_detectada: Boolean(process.env.SUPABASE_SECRET_KEY),
    SUPABASE_SERVICE_ROLE_KEY_detectada: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    APP_PASSWORD_detectada: Boolean(process.env.APP_PASSWORD),

    url_que_lee_vercel: url,
    url_largo: url ? url.length : 0,
    url_empieza_con_https: url ? url.startsWith("https://") : false,
    url_termina_con_supabase: url ? url.endsWith(".supabase.co") : false,

    secret_largo: secret ? secret.length : 0,
    secret_inicio: secret ? secret.slice(0, 12) : null,
    secret_fin: secret ? secret.slice(-6) : null
  });
}
