// Import ambient types (side-effect) instead of triple-slash reference per lint rule
import '../types.d.ts';
// Remote Deno imports; use @ts-expect-error to indicate intentional external source
// @ts-expect-error: Remote Deno std http import not resolvable to local TS config
import { serve } from 'https://deno.fresh.dev/std/http/server.ts';

// NOTE: Currently this function only constructs an email preview. Remove supabase client import
// until actually needed to perform DB operations to avoid unused variable lint warnings.

// If the ambient Deno declaration isn't picked up by the editor, provide a fallback
// to silence diagnostics. This does not affect runtime in the Supabase/Deno environment.
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, name, role } = await req.json();

    // Build email content (preview) – replace with real email integration
    const emailContent = `
      Hello ${name},

      You have been invited to join MediFlow as a ${role}. 
      Here are your login credentials:

      Email: ${email}
      Temporary Password: ${password}

      Please log in at ${Deno.env.get('APP_URL')} and change your password immediately.

      Best regards,
      The MediFlow Team
    `;

  // TODO: Integrate with email provider (e.g., SendGrid/Postmark)
  // await sendEmail(email, 'Welcome to MediFlow', emailContent);

    return new Response(
      JSON.stringify({ success: true, preview: emailContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    const msg = (error as any)?.message || String(error);
    return new Response(
      JSON.stringify({ error: msg }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});