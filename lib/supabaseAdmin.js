import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    const faltan = [];
    if (!url) faltan.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!secret) faltan.push('SUPABASE_SECRET_KEY');
    throw new Error('Faltan variables de entorno: ' + faltan.join(', '));
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function sendOk(res, payload = {}) {
  return res.status(200).json({ ok: true, ...payload });
}

export function sendError(res, error, status = 500) {
  const message = error?.message || String(error);
  return res.status(status).json({ ok: false, error: message });
}

export function upper(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

export function normalizeBody(body = {}) {
  const out = {};
  for (const [key, value] of Object.entries(body || {})) out[key] = upper(value);
  return out;
}

export function boolSi(value) {
  const v = upper(value);
  return v === true || v === 'SI' || v === 'SÍ' || v === 'TRUE' || v === '1';
}