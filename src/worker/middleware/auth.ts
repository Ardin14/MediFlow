import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '@/shared/types';

// Supabase auth middleware
export const supabaseAuthMiddleware = async (c: any, next: () => Promise<void>) => {
  // Validate worker env
  if (!c.env?.SUPABASE_URL || !c.env?.SUPABASE_SERVICE_ROLE_KEY) {
    (globalThis as any).console?.error?.('Supabase env missing in worker');
    return c.json({ error: 'Server misconfiguration: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing' }, 500);
  }

  try {
    const supabase = createClient(
      c.env.SUPABASE_URL as string,
      c.env.SUPABASE_SERVICE_ROLE_KEY as string
    );

    // Get session from request header
    const authHeader = c.req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify the token and get user
    const { data: userData, error: getUserError } = await supabase.auth.getUser(token as any);
    const user = (userData as any)?.user || null;

    if (getUserError || !user) {
      (globalThis as any).console?.error?.('Supabase getUser failed', getUserError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get clinic user info if exists from D1 via c.env.DB
    try {
      const { results } = await c.env.DB.prepare(
        "SELECT cu.*, cl.name as clinic_name FROM clinic_users cu JOIN clinics cl ON cu.clinic_id = cl.id WHERE cu.user_id = ?"
      ).bind(user.id).all();

      c.set('user', user);
      c.set('clinicUser', results.length > 0 ? results[0] : null);
    } catch (dbErr) {
      (globalThis as any).console?.error?.('Error querying clinic_user from DB', dbErr);
      // don't fail auth if DB lookup fails; return a server error
      return c.json({ error: 'Failed to load clinic user' }, 500);
    }

    await next();
  } catch (err: any) {
    (globalThis as any).console?.error?.('Auth middleware unexpected error', err);
    return c.json({ error: err?.message || 'Internal Server Error' }, 500);
  }
};

// Role checking middleware
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (c: any, next: () => Promise<void>) => {
    const clinicUser = c.get('clinicUser');
    
    if (!clinicUser || !allowedRoles.includes(clinicUser.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  };
};

// Clinic user check middleware
export const clinicUserMiddleware = async (c: any, next: () => Promise<void>) => {
  const clinicUser = c.get('clinicUser');
  
  if (!clinicUser) {
    return c.json({ error: 'Clinic registration required' }, 403);
  }

  await next();
};