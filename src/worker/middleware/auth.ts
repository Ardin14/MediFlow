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

    // Get clinic user info, prefer Supabase (authoritative for staff status/approval), fallback to D1.
    try {
      let clinicUser: any = null;

      // Prefer Supabase: includes status and richer metadata.
      try {
        const { data: suClinicUser, error: suErr } = await (createClient(
          c.env.SUPABASE_URL as string,
          c.env.SUPABASE_SERVICE_ROLE_KEY as string
        ) as any)
          .from('clinic_users')
          .select('*, clinic:clinics(id,name)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (suErr) {
          (globalThis as any).console?.warn?.('Supabase clinic_users lookup failed, falling back to D1', suErr);
        } else if (suClinicUser) {
          clinicUser = {
            ...suClinicUser,
            clinic_name: Array.isArray((suClinicUser as any).clinic) ? (suClinicUser as any).clinic[0]?.name : (suClinicUser as any).clinic?.name,
          };
        }
      } catch (e) {
        // ignore and fallback to D1
      }

      if (!clinicUser) {
        const { results } = await c.env.DB.prepare(
          "SELECT cu.*, cl.name as clinic_name FROM clinic_users cu JOIN clinics cl ON cu.clinic_id = cl.id WHERE cu.user_id = ?"
        ).bind(user.id).all();
        clinicUser = results.length > 0 ? results[0] : null;
      }

      c.set('user', user);
      c.set('clinicUser', clinicUser);
    } catch (dbErr) {
      (globalThis as any).console?.error?.('Error querying clinic_user', dbErr);
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

  // If status column exists and the user is not active, block access until approved by clinic admin.
  if (typeof clinicUser.status !== 'undefined' && clinicUser.status !== 'active') {
    return c.json({ error: 'Awaiting clinic admin approval', status: clinicUser.status }, 403);
  }

  await next();
};
