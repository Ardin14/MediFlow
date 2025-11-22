// Minimal ambient declarations for Deno functions and remote imports used in /supabase/functions
// These are intentionally narrow to silence editor TypeScript errors; they do not affect runtime.

declare module 'https://deno.fresh.dev/std/http/server.ts' {
  // serve accepts a handler that returns a Response or a Promise<Response>
  export function serve(handler: (_req: Request) => Promise<Response> | Response): void;
}

declare module 'https://esm.sh/@supabase/supabase-js' {
  // Minimal supabase-js surface used by the function. Keep as `any` to avoid coupling.
  export function createClient(_url: string, _key: string): any;
  export type SupabaseClient = any;
  const _default: { createClient: typeof createClient };
  export default _default;
}

// Minimal Deno env typing for use in functions. Use namespace-style declaration
// so the editor recognizes `Deno.env.get(...)`.
declare namespace Deno {
  export namespace env {
    function get(_key: string): string | undefined;
  }
}

export {};
