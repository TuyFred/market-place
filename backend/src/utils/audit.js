import { supabaseAdmin } from '../config/supabase.js';

/**
 * Best-effort audit log. Never throws to callers.
 */
export async function writeAuditLog({
  actorId,
  actorEmail,
  action,
  targetType,
  targetId,
  meta,
  request
}) {
  if (!supabaseAdmin) return;

  const row = {
    actor_id: actorId || null,
    actor_email: actorEmail || null,
    action,
    target_type: targetType || null,
    target_id: targetId || null,
    meta: meta || {},
    ip: request ? (request.headers['x-forwarded-for'] || request.ip || null) : null,
    user_agent: request?.headers?.['user-agent'] || null
  };

  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert(row);
    if (error) {
      // Table may not exist yet — log and continue
      request?.log?.warn?.({ err: error.message }, 'audit_logs insert failed');
    }
  } catch (err) {
    request?.log?.warn?.({ err: err.message }, 'audit_logs write failed');
  }
}
