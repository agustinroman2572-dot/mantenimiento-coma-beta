import { sendOk, sendError, normalizeBody } from '../lib/supabaseAdmin.js';

const rolesConPassword = ['ADMINISTRADORES', 'MECÁNICOS'];

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return sendError(res, 'Método no permitido', 405);
    const body = normalizeBody(req.body || {});
    const rol = body.rol || body.role;
    const nombre = body.nombre || body.usuario || 'USUARIO';
    const password = req.body?.password || req.body?.clave || '';

    if (rolesConPassword.includes(rol) && password !== process.env.APP_PASSWORD) {
      return sendError(res, 'Contraseña incorrecta.', 401);
    }

    return sendOk(res, { usuario: { nombre, rol } });
  } catch (error) {
    return sendError(res, error);
  }
}