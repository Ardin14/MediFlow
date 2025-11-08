import { serve } from 'https://deno.fresh.dev/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, name, role } = await req.json();

    // Initialize Supabase client with service role key
    const _supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Send email using your preferred email service
    // This is a placeholder - replace with your actual email sending logic
    const _emailContent = `
      Hello ${name},

      You have been invited to join MediFlow as a ${role}. 
      Here are your login credentials:

      Email: ${email}
      Temporary Password: ${password}

      Please log in at ${Deno.env.get('APP_URL')} and change your password immediately.

      Best regards,
      The MediFlow Team
    `;

    // Here you would integrate with your email service provider
    // For example, using SendGrid, Postmark, or similar
    // await sendEmail(email, 'Welcome to MediFlow', emailContent);

    return new Response(
      JSON.stringify({ success: true }),
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