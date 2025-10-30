import { Hono } from "hono";
// custom CORS handling (avoid permissive "*" in production)
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import { 
  UserRole,
  CreatePatientSchema,
  CreateAppointmentSchema,
  UpdateAppointmentStatusSchema,
  CreateVisitSchema,
  CreatePrescriptionSchema,
  CreateInvoiceSchema,
  UpdateInvoiceStatusSchema,
  CreateClinicUserSchema
} from "@/shared/types";

// Worker environment bindings (documented here for reference)
// Expected bindings:
// - DB: D1Database
// - MOCHA_USERS_SERVICE_API_URL: string
// - MOCHA_USERS_SERVICE_API_KEY: string
// - ALLOWED_ORIGIN?: string (comma-separated allowlist)

const app = new Hono();

// Safer CORS middleware: respects ALLOWED_ORIGIN binding when set, otherwise echoes request origin.
// This enables cookies (credentials) while avoiding a blanket '*' in production.
// Rate limiting map (in-memory). Note: Workers are stateless — this provides a basic guard but is not bulletproof.
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 120; // max requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // per minute

// Optional: if a KV namespace binding named RATE_LIMIT_KV exists, prefer KV-backed rate limiting
// KV must support get/put with JSON string values. This reduces per-instance false negatives.
const useKVRateLimit = async (c: any, ip: string): Promise<boolean> => {
  try {
    const kv = (c.env && c.env.RATE_LIMIT_KV) ? c.env.RATE_LIMIT_KV : null;
    if (!kv) return false; // KV not configured

    const key = `rl:${ip}`;
    const raw = await kv.get(key);
    const now = Date.now();
    if (!raw) {
      await kv.put(key, JSON.stringify({ count: 1, windowStart: now }), { expirationTtl: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) });
      return false;
    }

    const entry = JSON.parse(raw as string);
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      await kv.put(key, JSON.stringify({ count: 1, windowStart: now }), { expirationTtl: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) });
      return false;
    }

    entry.count += 1;
    if (entry.count > RATE_LIMIT_MAX) {
      // update kv to reflect continued rate-limited state
      await kv.put(key, JSON.stringify(entry), { expirationTtl: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) });
      return true; // rate-limited
    }

    await kv.put(key, JSON.stringify(entry), { expirationTtl: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) });
    return false;
  } catch (err) {
    // if KV fails, fallback to in-memory approach
    return false;
  }
};

// Simple logger helper
const logError = (msg: string, err?: any) => {
  // use globalThis.console to avoid TS lib issues in some environments
  (globalThis as any).console?.error?.(`[MediFlow Worker] ${msg}`, err || "");
};

// Enhanced CORS + rate-limit middleware
app.use("/*", async (c: any, next: any) => {
  try {
    // Rate limiting per IP. Prefer KV-backed if available to reduce per-instance variability.
    const ip = c.req.headers.get('CF-Connecting-IP') || c.req.headers.get('x-forwarded-for') || 'unknown';
    const kvLimited = await useKVRateLimit(c, ip);
    if (kvLimited) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    // Fallback in-memory
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry) {
      rateLimitMap.set(ip, { count: 1, windowStart: now });
    } else {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        // reset window
        rateLimitMap.set(ip, { count: 1, windowStart: now });
      } else {
        entry.count += 1;
        if (entry.count > RATE_LIMIT_MAX) {
          // Too many requests
          return c.json({ error: 'Rate limit exceeded' }, 429);
        }
        rateLimitMap.set(ip, entry);
      }
    }

    // CORS handling
    const origin = c.req.headers.get("Origin") || "";
    const allowedRaw = c.env.ALLOWED_ORIGIN || "";
  const allowedList = allowedRaw.split(",").map((s: string) => s.trim()).filter(Boolean);

    const shouldAllow = allowedList.length > 0 ? allowedList.includes(origin) : !!origin;
    if (shouldAllow && origin) {
      c.header("Access-Control-Allow-Origin", origin);
      c.header("Access-Control-Allow-Credentials", "true");
      c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      c.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    }

    if (c.req.method === "OPTIONS") {
      return c.text("", 204);
    }

    await next();
  } catch (err) {
    logError('Middleware failure', err);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Helper middleware to get clinic user info
const clinicUserMiddleware = async (c: any, next: any) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT cu.*, cl.name as clinic_name FROM clinic_users cu JOIN clinics cl ON cu.clinic_id = cl.id WHERE cu.user_id = ?"
  ).bind(user.id).all();

  if (results.length === 0) {
    return c.json({ error: "User not registered in clinic system" }, 403);
  }

  c.set("clinicUser", results[0]);
  await next();
};

// Helper function to check role permissions
const requireRole = (allowedRoles: UserRole[]) => {
  return async (c: any, next: any) => {
    const clinicUser = c.get("clinicUser");
    if (!clinicUser || !allowedRoles.includes(clinicUser.role)) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }
    await next();
  };
};

// Authentication endpoints
app.get('/api/oauth/google/redirect_url', async (c: any) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c: any) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c: any) => {
  const user = c.get("user");
  
  // Get clinic user info if exists
  const { results } = await c.env.DB.prepare(
    "SELECT cu.*, cl.name as clinic_name FROM clinic_users cu JOIN clinics cl ON cu.clinic_id = cl.id WHERE cu.user_id = ?"
  ).bind(user!.id).all();

  return c.json({ 
    user, 
    clinicUser: results.length > 0 ? results[0] : null 
  });
});

app.get('/api/logout', async (c: any) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Get available clinics for registration
app.get("/api/clinics", authMiddleware, async (c: any) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, address, phone, email FROM clinics ORDER BY name"
  ).all();

  return c.json(results);
});

// Clinic user registration/management
app.post("/api/clinic-users", authMiddleware, async (c: any) => {
  const user = c.get("user");
  const body = await c.req.json();

  // Check if user already exists in clinic system
  const { results: existingUser } = await c.env.DB.prepare(
    "SELECT * FROM clinic_users WHERE user_id = ?"
  ).bind(user!.id).all();

  if (existingUser.length > 0) {
    return c.json({ error: "User already registered" }, 400);
  }

  const validatedData = CreateClinicUserSchema.parse(body);
  const fullName = validatedData.full_name || user!.google_user_data.name || '';

  // Insert into clinic_users table
  const { success: clinicUserSuccess } = await c.env.DB.prepare(
    "INSERT INTO clinic_users (user_id, clinic_id, role, full_name, phone) VALUES (?, ?, ?, ?, ?)"
  ).bind(user!.id, validatedData.clinic_id, validatedData.role, fullName, validatedData.phone || null).run();

  if (!clinicUserSuccess) {
    return c.json({ error: "Failed to register user" }, 500);
  }

  // If the role is patient, also create a patient record
  if (validatedData.role === 'patient') {
    const { success: patientSuccess } = await c.env.DB.prepare(`
      INSERT INTO patients (user_id, clinic_id, full_name, email, phone)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      user!.id,
      validatedData.clinic_id,
      fullName,
      user!.google_user_data.email || null,
      validatedData.phone || null
    ).run();

    if (!patientSuccess) {
      return c.json({ error: "Failed to create patient record" }, 500);
    }
  }

  return c.json({ success: true }, 201);
});

// Patients endpoints - now clinic-scoped
app.get("/api/patients", authMiddleware, clinicUserMiddleware, requireRole(['admin', 'receptionist', 'doctor']), async (c: any) => {
  const clinicUser = c.get("clinicUser");
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM patients WHERE clinic_id = ? ORDER BY created_at DESC"
  ).bind(clinicUser.clinic_id).all();

  return c.json(results);
});

app.post("/api/patients", authMiddleware, clinicUserMiddleware, requireRole(['admin', 'receptionist']), async (c: any) => {
  const clinicUser = c.get("clinicUser");
  const body = await c.req.json();
  const validatedData = CreatePatientSchema.parse(body);

  const { success } = await c.env.DB.prepare(`
    INSERT INTO patients (clinic_id, full_name, gender, date_of_birth, phone, email, address, medical_history)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    clinicUser.clinic_id,
    validatedData.full_name,
    validatedData.gender || null,
    validatedData.date_of_birth || null,
    validatedData.phone || null,
    validatedData.email || null,
    validatedData.address || null,
    validatedData.medical_history || null
  ).run();

  if (!success) {
    return c.json({ error: "Failed to create patient" }, 500);
  }

  return c.json({ success: true }, 201);
});

// Appointments endpoints - now clinic-scoped
app.get("/api/appointments", authMiddleware, clinicUserMiddleware, async (c: any) => {
  const clinicUser = c.get("clinicUser");
  let query = `
    SELECT a.*, p.full_name as patient_name, cu.full_name as doctor_name 
    FROM appointments a 
    JOIN patients p ON a.patient_id = p.id 
    JOIN clinic_users cu ON a.doctor_id = cu.user_id 
    WHERE a.clinic_id = ?
  `;
  let params: any[] = [clinicUser.clinic_id];

  // Doctors can only see their own appointments
  if (clinicUser.role === 'doctor') {
    query += " AND a.doctor_id = ?";
    params.push(clinicUser.user_id);
  }

  query += " ORDER BY a.appointment_date DESC";

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

app.post("/api/appointments", authMiddleware, clinicUserMiddleware, requireRole(['admin', 'receptionist']), async (c: any) => {
  const clinicUser = c.get("clinicUser");
  const body = await c.req.json();
  const validatedData = CreateAppointmentSchema.parse(body);

  // Verify patient belongs to the same clinic
  const { results: patientCheck } = await c.env.DB.prepare(
    "SELECT id FROM patients WHERE id = ? AND clinic_id = ?"
  ).bind(validatedData.patient_id, clinicUser.clinic_id).all();

  if (patientCheck.length === 0) {
    return c.json({ error: "Patient not found in this clinic" }, 404);
  }

  // Verify doctor belongs to the same clinic
  const { results: doctorCheck } = await c.env.DB.prepare(
    "SELECT user_id FROM clinic_users WHERE user_id = ? AND clinic_id = ? AND role = 'doctor'"
  ).bind(validatedData.doctor_id, clinicUser.clinic_id).all();

  if (doctorCheck.length === 0) {
    return c.json({ error: "Doctor not found in this clinic" }, 404);
  }

  const { success } = await c.env.DB.prepare(`
    INSERT INTO appointments (clinic_id, patient_id, doctor_id, appointment_date, reason, status)
    VALUES (?, ?, ?, ?, ?, 'booked')
  `).bind(
    clinicUser.clinic_id,
    validatedData.patient_id,
    validatedData.doctor_id,
    validatedData.appointment_date,
    validatedData.reason || null
  ).run();

  if (!success) {
    return c.json({ error: "Failed to create appointment" }, 500);
  }

  return c.json({ success: true }, 201);
});

app.put("/api/appointments/:id/status", authMiddleware, clinicUserMiddleware, async (c: any) => {
  const clinicUser = c.get("clinicUser");
  const appointmentId = c.req.param("id");
  const body = await c.req.json();
  const validatedData = UpdateAppointmentStatusSchema.parse(body);

  // Verify appointment belongs to the same clinic
  const { results: appointmentCheck } = await c.env.DB.prepare(
    "SELECT id FROM appointments WHERE id = ? AND clinic_id = ?"
  ).bind(appointmentId, clinicUser.clinic_id).all();

  if (appointmentCheck.length === 0) {
    return c.json({ error: "Appointment not found in this clinic" }, 404);
  }

  const { success } = await c.env.DB.prepare(
    "UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ?"
  ).bind(validatedData.status, appointmentId, clinicUser.clinic_id).run();

  if (!success) {
    return c.json({ error: "Failed to update appointment" }, 500);
  }

  return c.json({ success: true });
});

// Visits endpoints - now clinic-scoped
app.post("/api/visits", authMiddleware, clinicUserMiddleware, requireRole(['doctor']), async (c: any) => {
  const clinicUser = c.get("clinicUser");
  const body = await c.req.json();
  const validatedData = CreateVisitSchema.parse(body);

  // Verify appointment belongs to the same clinic and doctor
  const { results: appointmentCheck } = await c.env.DB.prepare(
    "SELECT id FROM appointments WHERE id = ? AND clinic_id = ? AND doctor_id = ?"
  ).bind(validatedData.appointment_id, clinicUser.clinic_id, clinicUser.user_id).all();

  if (appointmentCheck.length === 0) {
    return c.json({ error: "Appointment not found or unauthorized" }, 404);
  }

  const { success } = await c.env.DB.prepare(`
    INSERT INTO visits (clinic_id, appointment_id, diagnosis, notes, follow_up_date)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    clinicUser.clinic_id,
    validatedData.appointment_id,
    validatedData.diagnosis || null,
    validatedData.notes || null,
    validatedData.follow_up_date || null
  ).run();

  if (!success) {
    return c.json({ error: "Failed to create visit" }, 500);
  }

  // Mark appointment as completed
  await c.env.DB.prepare(
    "UPDATE appointments SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ?"
  ).bind(validatedData.appointment_id, clinicUser.clinic_id).run();

  return c.json({ success: true }, 201);
});

// Prescriptions endpoints - now clinic-scoped
app.post("/api/prescriptions", authMiddleware, clinicUserMiddleware, requireRole(['doctor']), async (c: any) => {
  const clinicUser = c.get("clinicUser");
  const body = await c.req.json();
  const validatedData = CreatePrescriptionSchema.parse(body);

  // Verify visit belongs to the same clinic
  const { results: visitCheck } = await c.env.DB.prepare(
    "SELECT id FROM visits WHERE id = ? AND clinic_id = ?"
  ).bind(validatedData.visit_id, clinicUser.clinic_id).all();

  if (visitCheck.length === 0) {
    return c.json({ error: "Visit not found in this clinic" }, 404);
  }

  const { success } = await c.env.DB.prepare(`
    INSERT INTO prescriptions (clinic_id, visit_id, medicine_name, dosage, duration)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    clinicUser.clinic_id,
    validatedData.visit_id,
    validatedData.medicine_name,
    validatedData.dosage || null,
    validatedData.duration || null
  ).run();

  if (!success) {
    return c.json({ error: "Failed to create prescription" }, 500);
  }

  return c.json({ success: true }, 201);
});

// Invoices endpoints - now clinic-scoped
app.get("/api/invoices", authMiddleware, clinicUserMiddleware, requireRole(['admin', 'receptionist']), async (c: any) => {
  const clinicUser = c.get("clinicUser");
  
  const { results } = await c.env.DB.prepare(`
    SELECT i.*, p.full_name as patient_name 
    FROM invoices i 
    JOIN patients p ON i.patient_id = p.id 
    WHERE i.clinic_id = ?
    ORDER BY i.created_at DESC
  `).bind(clinicUser.clinic_id).all();

  return c.json(results);
});

app.post("/api/invoices", authMiddleware, clinicUserMiddleware, requireRole(['admin', 'receptionist']), async (c: any) => {
  const clinicUser = c.get("clinicUser");
  const body = await c.req.json();
  const validatedData = CreateInvoiceSchema.parse(body);

  // Verify patient belongs to the same clinic
  const { results: patientCheck } = await c.env.DB.prepare(
    "SELECT id FROM patients WHERE id = ? AND clinic_id = ?"
  ).bind(validatedData.patient_id, clinicUser.clinic_id).all();

  if (patientCheck.length === 0) {
    return c.json({ error: "Patient not found in this clinic" }, 404);
  }

  const { success } = await c.env.DB.prepare(`
    INSERT INTO invoices (clinic_id, patient_id, amount, date, description, payment_status)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, 'pending')
  `).bind(
    clinicUser.clinic_id,
    validatedData.patient_id,
    validatedData.amount,
    validatedData.description || null
  ).run();

  if (!success) {
    return c.json({ error: "Failed to create invoice" }, 500);
  }

  return c.json({ success: true }, 201);
});

app.put("/api/invoices/:id/status", authMiddleware, clinicUserMiddleware, requireRole(['admin', 'receptionist']), async (c: any) => {
  const clinicUser = c.get("clinicUser");
  const invoiceId = c.req.param("id");
  const body = await c.req.json();
  const validatedData = UpdateInvoiceStatusSchema.parse(body);

  // Verify invoice belongs to the same clinic
  const { results: invoiceCheck } = await c.env.DB.prepare(
    "SELECT id FROM invoices WHERE id = ? AND clinic_id = ?"
  ).bind(invoiceId, clinicUser.clinic_id).all();

  if (invoiceCheck.length === 0) {
    return c.json({ error: "Invoice not found in this clinic" }, 404);
  }

  const { success } = await c.env.DB.prepare(
    "UPDATE invoices SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND clinic_id = ?"
  ).bind(validatedData.payment_status, invoiceId, clinicUser.clinic_id).run();

  if (!success) {
    return c.json({ error: "Failed to update invoice" }, 500);
  }

  return c.json({ success: true });
});

// Get clinic users by role (for scheduling appointments) - now clinic-scoped
app.get("/api/clinic-users/doctors", authMiddleware, clinicUserMiddleware, async (c: any) => {
  const clinicUser = c.get("clinicUser");
  
  const { results } = await c.env.DB.prepare(
    "SELECT user_id, full_name FROM clinic_users WHERE role = 'doctor' AND clinic_id = ? ORDER BY full_name"
  ).bind(clinicUser.clinic_id).all();

  return c.json(results);
});

// Dashboard stats endpoint - now clinic-scoped
app.get("/api/dashboard/stats", authMiddleware, clinicUserMiddleware, async (c: any) => {
  const clinicUser = c.get("clinicUser");
  
  // Get total patients for this clinic
  const { results: patientsCount } = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM patients WHERE clinic_id = ?"
  ).bind(clinicUser.clinic_id).all();

  // Get today's appointments for this clinic
  const today = new Date().toISOString().split('T')[0];
  let appointmentsQuery = "SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = ? AND clinic_id = ?";
  let appointmentsParams = [today, clinicUser.clinic_id];
  
  if (clinicUser.role === 'doctor') {
    appointmentsQuery = "SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = ? AND clinic_id = ? AND doctor_id = ?";
    appointmentsParams = [today, clinicUser.clinic_id, clinicUser.user_id];
  }

  const { results: todayAppointments } = await c.env.DB.prepare(appointmentsQuery)
    .bind(...appointmentsParams).all();

  // Get pending invoices for this clinic (admin/receptionist only)
  let pendingInvoicesCount = 0;
  if (clinicUser.role === 'admin' || clinicUser.role === 'receptionist') {
    const { results } = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM invoices WHERE payment_status = 'pending' AND clinic_id = ?"
    ).bind(clinicUser.clinic_id).all();
    pendingInvoicesCount = (results[0] as any).count;
  }

  return c.json({
    totalPatients: (patientsCount[0] as any).count,
    todayAppointments: (todayAppointments[0] as any).count,
    pendingInvoices: pendingInvoicesCount,
  });
});

export default app;
