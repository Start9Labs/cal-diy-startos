<p align="center">
  <img src="icon.svg" alt="Cal.diy Logo" width="21%">
</p>

# Cal.diy on StartOS

> **Upstream repo:** <https://github.com/calcom/cal.diy>
> **Upstream docs:** <https://cal.com/docs>
>
> Everything not listed in this document should behave the same as upstream
> Cal.diy. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable.

Cal.diy is the community-driven, fully open-source edition of Cal.com — a scheduling platform for booking meetings, managing availability, and connecting external calendars.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property      | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| App image     | `calcom/cal.com` (upstream Docker Hub; per-arch tags selected at build) |
| Database      | `postgres:16-alpine`                                                 |
| Cron sidecar  | `alpine:3.20 + curl` (built locally from `cron.Dockerfile`); runs `busybox crond` against the documented Vercel-style schedule from upstream's `apps/web/vercel.json` |
| Architectures | x86_64, aarch64                                                      |
| RAM           | 2048 MB declared in `hardwareRequirements`. Cal.diy + Postgres idles ~950 MB and spikes higher under load. |
| Entrypoint    | Upstream `start.sh` (runs `replace-placeholder.sh` to swap the baked URL, then Prisma migrations + app-store seed, then Next.js) |

Upstream publishes amd64 and arm64 as separate tags rather than a multi-arch manifest list. A thin Dockerfile in this repo selects the correct tag per architecture at pack time.

---

## Volume and Data Layout

| Volume    | Mount Point             | Purpose                                                              |
| --------- | ----------------------- | -------------------------------------------------------------------- |
| `startos` | StartOS-managed         | `store.json` — generated secrets, selected primary URL, SMTP config, and Stripe credentials |
| `db`      | `/var/lib/postgresql`   | PostgreSQL data directory                                            |

---

## Installation and First-Run Flow

On first install:

1. StartOS generates and stores four secrets in `store.json`:
   - `postgresPassword` — for the bundled PostgreSQL sidecar.
   - `nextAuthSecret` — `NEXTAUTH_SECRET`, used to sign session tokens.
   - `calendsoEncryptionKey` — `CALENDSO_ENCRYPTION_KEY`, used by Cal.diy for symmetric encryption of integration credentials.
   - `cronApiKey` — `CRON_API_KEY`, shared between the cal-diy daemon (which validates incoming cron requests) and the cron sidecar (which authenticates outgoing calls).
2. **Open signups are disabled by default** (`signupDisabled: true` in `store.json` → `NEXT_PUBLIC_DISABLE_SIGNUP=true` to the daemon). Cal.com's signup gate is `process.env.NEXT_PUBLIC_DISABLE_SIGNUP === "true" || <DB feature flag>`, so the env half short-circuits and blocks. The DB-side `disable-signup` Feature row stays at upstream's seeded `enabled: false` and is irrelevant unless the env half is unset.
3. The `taskSetPrimaryUrl` init step pre-selects the service's `.local` URL as the primary URL so the package boots into a usable state on the LAN with no further configuration.
4. PostgreSQL starts and the `cal-diy` daemon waits for it.
5. The `cal-diy` daemon runs `prisma migrate deploy` against the empty database, seeds the bundled app store, then launches Next.js.

Once the **Web Interface** health check turns green, open the **Web UI** from the Dashboard tab. The first time the URL is hit you're redirected to `/auth/setup` — Cal.diy's first-admin bootstrap. That endpoint only checks `userCount === 0` and is **not** gated by `NEXT_PUBLIC_DISABLE_SIGNUP`, so the initial admin can be created even with open signups disabled.

To add more users without enabling open signups, sign in as the admin and go to **Settings → Admin → Users → Add** (Cal.diy's built-in admin user-add page, backed by the `users.add` tRPC `authedAdminProcedure`). The new user has no password row until they either:

- run Cal.diy's **Forgot Password** flow (requires SMTP — see the "Configure SMTP" action), or
- have you run the StartOS **Reset User Password** action to mint their initial password.

Only enable open signups if you specifically want strangers to self-register.

---

## Configuration Management

| StartOS-Managed                          | Upstream-Managed                                            |
| ---------------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`, `DATABASE_DIRECT_URL`, `DATABASE_HOST` | Calendar / video integration credentials, and each owner's connected Stripe account (set inside the Cal.diy UI) |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL`        | All user accounts, event types, availability, and bookings |
| `CALENDSO_ENCRYPTION_KEY`                |                                                             |
| `NEXT_PUBLIC_WEBAPP_URL`, `NEXT_PUBLIC_WEBSITE_URL` (sourced from the "Set Primary URL" action) |  |
| `BUILT_NEXT_PUBLIC_WEBAPP_URL` (fixed at `http://localhost:3000` to match the upstream bake-time value, so `replace-placeholder.sh` can do its job) | |
| `EMAIL_FROM`, `EMAIL_FROM_NAME`, `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD` (sourced from the "Configure SMTP" action) | |
| `NEXT_PUBLIC_DISABLE_SIGNUP` (sourced from the "Enable/Disable Signups" action) | |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`, `STRIPE_PRIVATE_KEY`, `STRIPE_CLIENT_ID`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_FEE_FIXED=0`, `PAYMENT_FEE_PERCENTAGE=0` (sourced from the "Configure Stripe Payments" action; emitted only when all four credentials are set. Upstream's boot-time `seed-app-store.ts` requires all six before it seeds and enables the Stripe app, and fees are zero because a self-hoster is their own Connect platform) | |
| `ALLOWED_HOSTNAMES` (derived from the primary URL's hostname; dead code in cal.diy v6.2.0 but pre-filled defensively) | |
| `CRON_API_KEY` (auto-generated at install; shared with the cron sidecar) | |
| `ENABLE_ASYNC_TASKER=true`, `TASKER_ENABLE_EMAILS=1`, `TASKER_ENABLE_WEBHOOKS=1` (enable cal.com's tasker so `/api/tasks/cron` has queued work to drain) | |
| `CSP_POLICY=non-strict` (turns on cal's nonce-based CSP on `/auth/login` and `/login`; relaxes `style-src` to `'unsafe-inline'` to avoid breaking inline styles on the login page while keeping the nonce-based `script-src` + `strict-dynamic` defense — the actual XSS win) | |
| `CALCOM_TELEMETRY_DISABLED=1`, `NEXT_TELEMETRY_DISABLED=1` | |
| `NODE_ENV=production`                    |                                                             |

---

## Network Access and Interfaces

| Interface | Port | Protocol | Purpose            |
| --------- | ---- | -------- | ------------------ |
| Web UI    | 3000 | HTTP     | Cal.diy web app    |

**Access methods:**

- LAN IP with unique port
- `<hostname>.local` with unique port
- Tor `.onion` address
- Custom domains (if configured)

---

## Actions (StartOS UI)

| Name                   | ID                | Availability   | Purpose                                                                                                                                                                                                                                                            |
| ---------------------- | ----------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Set Primary URL        | `set-primary-url` | Any status     | Choose which of the service's non-local URLs (LAN, `.local`, Tor, custom domain) Cal.diy treats as canonical. Persisted to `store.json`; the daemon restarts and upstream's `replace-placeholder.sh` rewrites the statically-baked URL in `.next/` on next start. |
| Configure SMTP         | `manage-smtp`     | Any status     | Three-mode SMTP picker (disabled / system / custom) using the SDK's `smtpInputSpec`. Selected credentials are mapped to Cal.diy's `EMAIL_*` env vars at daemon start.                                                                                              |
| Configure Stripe Payments | `manage-stripe` | Any status   | Enable or disable Stripe for paid bookings (a Disabled/Enabled union — Enabled requires all four platform credentials: publishable key, secret key, Connect client ID, webhook signing secret). Persisted to `store.json` and mapped to `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` / `STRIPE_PRIVATE_KEY` / `STRIPE_CLIENT_ID` / `STRIPE_WEBHOOK_SECRET` (+ `PAYMENT_FEE_*=0`) at daemon start; cal's boot-time `seed-app-store.ts` reads these to seed and enable the Stripe app. Inputs validate the `pk_`/`sk_`/`ca_`/`whsec_` prefixes and mask the two secrets. Requires a public HTTPS primary URL (Stripe must reach the OAuth callback + webhook); the action's description renders both URLs to register. |
| Enable/Disable Signups | `toggle-signup`   | Any status     | Flips `signupDisabled` in `store.json`; the daemon picks it up reactively and the next start passes `NEXT_PUBLIC_DISABLE_SIGNUP` to cal. Cal's signup gate is `env-or-dbFlag`, and we rely entirely on the env half. The vestigial "Create Account" link in the login footer is baked into the client bundle and cannot be hidden at runtime; clicking it redirects to a "Signup is disabled" error. |
| Reset User Password    | `reset-password`  | Only running   | Generates a 22-character random password, hashes it with `bcryptjs` (cost 12) inside a temp container of the `main` image, and upserts it into the `UserPassword` row joined to `User.email`. Surfaces the new password back to the StartOS UI as a masked, copyable single-value result. |

A `taskSetPrimaryUrl` init step pre-selects a `.local` URL on first install and re-prompts the user (as a critical task) if the chosen URL later becomes unavailable.

---

## Backups and Restore

**Included in backup:**

- Full PostgreSQL dump of the `calendso` database (taken with `pg_dump` against the sidecar)
- `startos` volume (preserves the generated secrets, primary URL, SMTP config, and Stripe credentials so a restore continues to decrypt existing integration credentials)

**Restore behavior:** PostgreSQL is dump-restored before the `cal-diy` daemon starts.

---

## Health Checks

| Check            | Method                              | Messages                                                                 |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| Database         | `pg_isready` against the sidecar    | Success: "PostgreSQL is ready" / Loading: "Waiting for PostgreSQL to be ready" |
| Web Interface    | HTTP GET `/api/version` against `http://127.0.0.1:3000` with a 5-minute grace period | Success: "Cal.diy is ready" / Error: "Cal.diy is not ready" |
| Background Jobs  | Static success while the cron sidecar daemon is up | "Cron sidecar is running. Booking reminders, OAuth credential refresh, calendar sync, and workflow emails fire on schedule." |
| Primary URL      | Static success, displays the active URL | "Booking links, email confirmations, and magic-link logins all point at &lt;url&gt;..." |
| Email Delivery   | Reflects whether SMTP is configured | Success: "SMTP configured" / Disabled: prompt to run the SMTP action     |
| Payments         | Reflects whether Stripe is configured | Success: "Stripe configured — owners can connect their account…" / Disabled: prompt to run the Stripe action |

The web check probes `/api/version` rather than just port-listening, so it doesn't go green until the Next.js router and Prisma client are actually serving requests. The 5-minute grace period covers Prisma migrations, app-store seeding, and (if the primary URL has changed) the `replace-placeholder.sh` sweep on every container start.

### Scheduled jobs

Cal.com expects an external scheduler to hit `/api/cron/*` and `/api/tasks/*` on the schedule defined by upstream's `apps/web/vercel.json`. Without this, booking reminder emails never send, OAuth access tokens for Google / Microsoft / Apple Calendar integrations are never refreshed (and stop working after their TTL expires, ~1h for Google), workflow SMS/email/WhatsApp reminders never fire, calendar feeds drift, and queued form responses pile up.

A small alpine sidecar bundled in this package runs `busybox crond` with this exact crontab (authenticated with the auto-generated `CRON_API_KEY`):

| Schedule        | Endpoint                                       | Purpose                                                  |
| --------------- | ---------------------------------------------- | -------------------------------------------------------- |
| every minute    | `/api/tasks/cron`                              | Central tasker — drains queued reminder/webhook jobs     |
| every 5 minutes | `/api/cron/calendar-subscriptions`             | Sync external calendar feeds                             |
| every 5 minutes | `/api/cron/credentials`                        | Refresh OAuth access tokens for connected integrations   |
| every 5 minutes | `/api/cron/selected-calendars`                 | Reconcile per-user selected calendar state               |
| daily 03:00     | `/api/cron/calendar-subscriptions-cleanup`     | Drop stale calendar subscriptions                        |
| every 12 hours  | `/api/cron/queuedFormResponseCleanup`          | Cleanup queued routing-form responses                    |
| daily 00:00     | `/api/tasks/cleanup`                           | Tasker cleanup                                           |

The cron sidecar runs in the same network namespace as the web daemon and calls `http://127.0.0.1:3000/...?apiKey=<CRON_API_KEY>`. Cal.com accepts the raw key via the `apiKey` query param or via an `Authorization` header.

---

## Dependencies

None.

---

## Limitations and Differences

1. **No public REST API.** Upstream's optional `apps/api/v2` service (NestJS + Redis) is not packaged. The web UI, tRPC, and integrations all work; programmatic access via the public `/api/v2` REST endpoints does not.
2. **No enterprise features.** Cal.diy upstream has removed Teams, Organizations, Insights, Workflows, SSO/SAML, and other commercial features that exist in Cal.com. None of them are available here either.
3. **Static URL rewrite on each start.** When the primary URL differs from the baked-in `http://localhost:3000`, the upstream `replace-placeholder.sh` rewrites the entire `.next/` directory on every container start. Expect tens of seconds of extra startup time after a URL change.
4. **Changing the primary URL after Cal.diy has been in use has external side effects** that the package cannot paper over. The internal rewrite is idempotent (the `replace-placeholder.sh` `FROM` is always the baked `http://localhost:3000`, the `TO` is the new value), but: OAuth integrations need their redirect URI re-registered with each provider and reconnected here; all NextAuth sessions are invalidated because the cookie domain changed; booking links / iframe embeds / email signatures already shared externally with the old URL stop working; and links inside already-sent emails continue to point at the old URL. New emails, new booking pages, new embeds use the new URL.
4. **Disabling signups leaves a vestigial UI link.** The "Create Account" link in the login page footer is baked into the static client bundle via `process.env.NEXT_PUBLIC_DISABLE_SIGNUP` and cannot be hidden at runtime; clicking it redirects to a "Signup is disabled" error page. The signup API route and server-rendered signup page both block correctly.
5. **Reset User Password only resets the local password.** Users who sign in via OAuth providers (Google, Microsoft, etc.) do not have a row in `UserPassword`; the action upserts a hash for them but those users still authenticate via OAuth and the hash is ignored.
6. **Telemetry is disabled** via `CALCOM_TELEMETRY_DISABLED=1` and `NEXT_TELEMETRY_DISABLED=1`.

---

## What Is Unchanged from Upstream

- All scheduling, availability, event-type, and booking functionality
- All upstream-provided calendar / video integrations (Google, Apple, Microsoft, Zoom, Daily, etc. — configurable through the Cal.diy UI once you provide your own credentials). The **Jitsi Video** and **Nextcloud Talk** apps are particularly StartOS-friendly: both upstream-packaged services (`jitsi-startos`, `nextcloud-startos`) compose cleanly with Cal.diy via the in-app configuration in **Settings → Apps**, no env vars or custom integration code required from this package. Jitsi works out of the box (defaults to public meet.jit.si; point it at a self-hosted Jitsi for fully local video).
- The full Cal.diy admin dashboard
- The Cal.diy public booking pages

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and development workflow.

---

## Quick Reference for AI Consumers

```yaml
package_id: cal-diy
image: calcom/cal.com
architectures: [x86_64, aarch64]
volumes:
  startos: store.json (StartOS-managed)
  db: /var/lib/postgresql
ports:
  ui: 3000
dependencies: none
startos_managed_env_vars:
  - DATABASE_URL
  - DATABASE_DIRECT_URL
  - DATABASE_HOST
  - NEXTAUTH_SECRET
  - NEXTAUTH_URL
  - CALENDSO_ENCRYPTION_KEY
  - NEXT_PUBLIC_WEBAPP_URL
  - NEXT_PUBLIC_WEBSITE_URL
  - BUILT_NEXT_PUBLIC_WEBAPP_URL
  - EMAIL_FROM
  - EMAIL_FROM_NAME
  - EMAIL_SERVER_HOST
  - EMAIL_SERVER_PORT
  - EMAIL_SERVER_USER
  - EMAIL_SERVER_PASSWORD
  - NEXT_PUBLIC_DISABLE_SIGNUP
  - NEXT_PUBLIC_STRIPE_PUBLIC_KEY
  - STRIPE_PRIVATE_KEY
  - STRIPE_CLIENT_ID
  - STRIPE_WEBHOOK_SECRET
  - PAYMENT_FEE_FIXED
  - PAYMENT_FEE_PERCENTAGE
  - ALLOWED_HOSTNAMES
  - CSP_POLICY
  - CRON_API_KEY
  - ENABLE_ASYNC_TASKER
  - TASKER_ENABLE_EMAILS
  - TASKER_ENABLE_WEBHOOKS
  - CALCOM_TELEMETRY_DISABLED
  - NEXT_TELEMETRY_DISABLED
  - NODE_ENV
actions:
  - set-primary-url
  - manage-smtp
  - manage-stripe
  - toggle-signup
  - reset-password
```
