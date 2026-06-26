export default async function handler(req, res) {
  const url =
   3  process.env.SUPABASE_URL ||
4  process.env.NEXT_PUBLIC_SUPABASE_URL ||
    null;

  const secret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    null;

  if (!url || !secret) {
    return res.status(200).json({
      ok: false,
      etapa: "variables",
      mensaje: "Falta URL o secret key"
    });
  }

  try {
    const response = await fetch(`${url}/rest/v1/equipos?select=id,interno&limit=2`, {
      method: "GET",
      headers: {
        apikey: secret,
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json"
      }
    });

    const text = await response.text();

    return res.status(200).json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url_usada: `${url}/rest/v1/equipos?select=id,interno&limit=2`,
      respuesta: text
    });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      etapa: "fetch_directo",
      error_name: error.name,
      error_message: error.message,
      error_cause: error.cause ? String(error.cause) : null,
      url_usada: `${url}/rest/v1/equipos?select=id,interno&limit=2`
    });
  }
}
