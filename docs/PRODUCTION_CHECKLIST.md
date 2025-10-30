# MediFlow Production Checklist

This document lists recommended steps before deploying MediFlow to production.

1. Configure environment bindings
   - Set `ALLOWED_ORIGIN` to your frontend origin(s) (comma-separated) in `wrangler.toml` or Cloudflare dashboard.
   - (Optional) Create a KV namespace and bind it as `RATE_LIMIT_KV` to enable global rate-limiting.
   - Ensure `MOCHA_USERS_SERVICE_API_URL` and `MOCHA_USERS_SERVICE_API_KEY` are set securely.

2. Security
   - Run `npm audit` and fix vulnerabilities. (I've updated `hono` and `eslint` to resolved versions.)
   - Ensure cookies and session tokens use `httpOnly`, `secure`, and `sameSite` appropriate to your deployment.
   - Enable TLS and a valid certificate for your frontend domain.

3. Database
   - Run SQL migrations in `migrations/` against your Cloudflare D1 instance.
   - Consider adding foreign key constraints for critical relationships.
   - Ensure backups and encryption at rest if data contains PHI.

4. Observability
   - Verify `observability.enabled` in `wrangler.toml` or `wrangler.json`.
   - Configure logs and alerts for errors and rate-limit events.

5. Tests & CI
   - Add unit tests for Zod schemas and key business logic.
   - Add integration tests for authentication flow and appointment lifecycle.
   - Ensure CI (GitHub Actions) runs lint and build (added `.github/workflows/ci.yml`).

6. Rate limiting & scaling
   - Use KV or Durable Objects for robust global rate limiting.
   - Tune `RATE_LIMIT_MAX` based on expected traffic.

7. Monitoring & privacy
   - Ensure logs do not contain PHI.
   - Review data retention policies.

8. Post-deploy checks
   - Verify OAuth redirect flow in staging before production.
   - Test cross-origin cookie behavior for auth.
   - Smoke test: create clinic user, add patient, schedule appointment, complete visit, create invoice.

If you want, I can help implement any of the items above (tests, Durable Objects, DB constraints, or CI improvements).