<p align="center">
  <img src="icon.svg" alt="Cal.diy Logo" width="21%">
</p>

# Cal.diy on StartOS

> Everything not listed in this document should behave the same as upstream
> Cal.diy. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Cal.diy](https://github.com/calcom/cal.diy) is a self-hosted scheduling and booking platform. This package bundles the PostgreSQL database and the scheduled-job runner that upstream's hosted deployment provides for you, generates every secret at install, and closes signups by default.

- **Upstream repo:** <https://github.com/calcom/cal.diy>
- **Wrapper repo:** <https://github.com/Start9Labs/cal-diy-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Three images. The application's is built here only to pick the right upstream tag, and the cron sidecar is a few lines of Alpine.

| Property      | Value                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Images        | `calcom/cal.com` (via `Dockerfile`), `postgres`, and a local `cron.Dockerfile` build |
| Architectures | x86_64, aarch64                                                                      |
| Entrypoint    | Each image's own; the cron sidecar runs busybox `crond`                              |
| Memory        | The manifest declares a 1.5 GiB floor                                                |

The application Dockerfile exists because upstream publishes each architecture under a **separate tag** rather than as one multi-architecture manifest, so the image cannot be pulled by tag alone; the Dockerfile selects the right base for the target architecture and adds nothing.

| Subcontainer        | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `cal-diy-sub`       | The `cal-diy` daemon — the application, and the one to `attach` to |
| `postgres-sub`      | The private database                                               |
| `cal-cron-sub`      | The scheduled-job runner                                           |
| `cal-hash-password` | Temporary; used by the Reset User Password action                  |

Startup is ordered `postgres` → `cal-diy` → `cron`. Postgres listens on loopback only, inside the service's own network namespace.

**The cron sidecar has no upstream equivalent in a self-hosted deployment.** Upstream runs these jobs on its hosting platform's scheduler, so a plain container deployment silently never runs them — booking reminders are never sent, calendar OAuth tokens are never refreshed and expire within about an hour, workflows never fire, and calendar subscriptions never sync. The sidecar reproduces upstream's published schedule with `crond` and `curl` against the application's own job endpoints, authenticating with a key generated at install.

## Volume and Data Layout

Two volumes, and neither is mounted into the application.

| Volume    | Mount Point                             | Purpose                                      |
| --------- | --------------------------------------- | -------------------------------------------- |
| `db`      | `/var/lib/postgresql` in `postgres-sub` | The PostgreSQL data directory                |
| `startos` | — (host side)                           | `store.json`; never mounted into a container |

The application subcontainer mounts nothing at all: everything Cal.diy persists lives in Postgres, and everything the package decides lives in `store.json` and reaches it as environment.

## File Models

One model. It holds every secret the package generates and every choice the actions expose, and none of it is ever visible to the application as a file.

| File         | Format | Modelled                | Written by                           |
| ------------ | ------ | ----------------------- | ------------------------------------ |
| `store.json` | JSON   | Yes — `FileHelper.json` | Install, every init, and the actions |

| Key                     | Set by                                | Notes                                                      |
| ----------------------- | ------------------------------------- | ---------------------------------------------------------- |
| `postgresPassword`      | Install                               | The bundled database's password; also used to take backups |
| `nextAuthSecret`        | Install                               | Session signing                                            |
| `calendsoEncryptionKey` | Install                               | Application-level encryption of stored credentials         |
| `cronApiKey`            | Install                               | Authenticates the cron sidecar to the job endpoints        |
| `url`                   | Init, then the Set Primary URL action | The address every generated link is built from             |
| `smtp`                  | The Configure SMTP action             | Either StartOS's system SMTP or credentials you supply     |
| `stripe`                | The Configure Stripe action           | All four credentials, or disabled                          |
| `signupDisabled`        | Install, then the signup action       | Defaults to **true**                                       |

Later inits merge the file without disturbing any of it, so the secrets are stable for the life of the install. Nothing rewrites a value you set through an action.

**No configuration file reaches the application.** Cal.diy is configured entirely by environment, composed fresh on each start from the table above. That is also where this package's departures from upstream defaults live:

| Variable                                                                | Upstream default              | Set here          | Why                                             |
| ----------------------------------------------------------------------- | ----------------------------- | ----------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_DISABLE_SIGNUP`                                            | signups open                  | `true` at install | A personal instance should not accept strangers |
| `CALCOM_TELEMETRY_DISABLED`, `NEXT_TELEMETRY_DISABLED`                  | telemetry on                  | disabled          | Nothing phones home                             |
| `CSP_POLICY`                                                            | unset, disabling CSP entirely | `non-strict`      | Nonce-based script CSP on the login pages       |
| `ENABLE_ASYNC_TASKER`, `TASKER_ENABLE_EMAILS`, `TASKER_ENABLE_WEBHOOKS` | off                           | on                | The cron sidecar needs queued work to drain     |
| `CRON_SECRET`, `CRON_API_KEY`                                           | unset                         | `cronApiKey`      | Authenticate the scheduled job requests         |
| `PAYMENT_FEE_FIXED`, `PAYMENT_FEE_PERCENTAGE`                           | a platform's own cut          | `0`               | You are your own platform                       |

`NEXT_PUBLIC_WEBAPP_URL` and its siblings come from `url`. Upstream bakes a build-time URL into its static assets and rewrites them at container start, which is why changing the primary URL restarts the service rather than taking effect live.

## Dependencies

None. PostgreSQL is bundled as a private sidecar rather than declared as a dependency, so it is not shared with any other service.

Email is the one optional external piece, and it is not a dependency either: [Configure SMTP](#actions) can use StartOS's system SMTP settings or credentials of your own.

## Network Access and Interfaces

One interface. The database and the cron sidecar are internal and never published.

| Interface | Id   | Type | Port | Description               |
| --------- | ---- | ---- | ---- | ------------------------- |
| Web UI    | `ui` | ui   | 3000 | The Cal.diy web interface |

The port is bound on the `ui-multi` MultiHost and is not masked.

## Installation and First-Run Flow

Install generates all four secrets, disables signups, and picks a primary URL — nothing is asked of you and no credential is shown, because the first account is created inside the application.

1. **Secrets are generated** into `store.json`.
2. **Signups are closed.** This does not block the first admin: upstream's setup route is gated on there being no users at all, not on the signup flag, so the initial account can still be created on first visit. Every account after that is added from Cal.diy's own admin console.
3. **A primary URL is chosen** from the addresses StartOS has published for the interface, preferring the `.local` one. If the stored URL later stops being one of those addresses — a domain removed, for instance — a `critical` task asks you to pick again. See [Tasks](#tasks).

The application's own first-run flow follows: open the Web UI and create the admin account.

## Actions

Five actions, all user-facing.

### Set Primary URL

Chooses which of the addresses StartOS publishes is the one Cal.diy builds links from — booking pages, share links, magic-link logins, and outbound email.

- **What it changes:** `url` in `store.json`, and through it most of the application's URL environment.
- **Cost:** seconds, then a restart. The restart is required rather than incidental: upstream rewrites its statically-built assets from the new value at container start.
- **Repeat safety:** technically safe at any time, but not consequence-free once the instance is in use. OAuth integrations must have their redirect URIs re-registered with each provider, active sessions are signed out because session cookies are bound to the domain, and links already shared or already emailed keep pointing at the old address.
- **Input:** a dropdown of the addresses currently published for the interface — not free text, so an unreachable URL cannot be chosen.

### Configure SMTP

Sets up outbound email, which booking confirmations, reminders, and magic-link sign-in all need.

- **What it changes:** `smtp` in `store.json`; the credentials become environment on the next start.
- **Cost:** seconds, then a restart.
- **Repeat safety:** idempotent; the form is pre-filled with the current settings.
- **Options:** StartOS's system SMTP, or your own server. A `from` address written as `Name <address>` is split before it reaches the application, which would otherwise nest it inside its own display name.

### Configure Stripe Payments

Supplies the four Stripe credentials that let calendar owners collect payment for bookings.

- **What it changes:** `stripe` in `store.json`.
- **Cost:** seconds, then a restart. The application seeds its Stripe integration at boot, and only when all four credentials are present — which the form enforces as a group rather than field by field.
- **Repeat safety:** idempotent, and reversible by selecting Disabled.
- **Input validation:** each field is checked against the prefix Stripe uses for that key type, so a mis-pasted key is caught in the form rather than failing silently at boot.

### Enable / Disable Signups

Toggles open registration. The action's name and description flip to describe what running it will do.

- **What it changes:** `signupDisabled` in `store.json`.
- **Cost:** seconds, then a restart.
- **Repeat safety:** idempotent in both directions, and it never affects existing users.
- **Worth knowing:** with signups disabled, the login page still renders a "Create Account" link — it is baked into upstream's static bundle — but following it reaches an error page. The block is enforced server-side, not by hiding the link.

### Reset User Password

Generates a new random password for one user, by email address.

- **What it changes:** that user's password hash in the database.
- **Availability:** only while the service is running, since it goes through the live database.
- **Repeat safety:** safe to re-run; each run generates a fresh password.
- **Outputs:** the new password, to be shared out of band.
- **Limitation:** it does nothing for an account that signs in only through OAuth, because such an account has no stored password.

## Tasks

One task, and it is raised by a condition rather than at install.

| Task            | Severity   | Raised when                                                                         | Cleared when    |
| --------------- | ---------- | ----------------------------------------------------------------------------------- | --------------- |
| Set Primary URL | `critical` | The stored primary URL is no longer among the addresses published for the interface | The action runs |

It cannot be raised on a fresh install, because init picks an available URL when none is stored. It appears when an address the instance was built around goes away — a domain removed, or a network configuration changed. `critical` because every link Cal.diy generates would otherwise point somewhere unreachable.

## Health Checks

Six checks, and three of them are status displays rather than fault detectors: they report a configuration state, never a failure.

| Check         | Displayed         | Method                                          | Grace |
| ------------- | ----------------- | ----------------------------------------------- | ----- |
| `cal-diy`     | "Web Interface"   | HTTP `GET /api/version`                         | 5 min |
| `postgres`    | "Database"        | `pg_isready`                                    | —     |
| `cron`        | "Background Jobs" | Reports success whenever the sidecar is running | —     |
| `primary-url` | "Primary URL"     | Reports the address links are being built from  | —     |
| `email`       | "Email Delivery"  | `disabled` until SMTP is configured             | —     |
| `payments`    | "Payments"        | `disabled` until Stripe is configured           | —     |

**The five-minute grace on `cal-diy` is not padding.** The endpoint it probes only answers once the framework's router and the database client are both serving, and the container rewrites its static assets at start; a shorter grace would report failure during a normal boot.

**While the container's start script is still working, `cal-diy` names the step instead of probing** — "Rewriting web assets for the primary URL", "Applying database migrations (N of M)", "Registering apps" — read from the process list and the `_prisma_migrations` table. These report `starting` for as long as that step's process is alive, even after the five-minute grace window expires. That window begins when the daemon launches, not when the web server starts: if startup steps take longer than five minutes, an unavailable `/api/version` reports `failure` as soon as they finish.

**`email` and `payments` showing `disabled` is not a fault** — it is how an unconfigured optional feature is meant to look, and it names the action that would change it.

## Backups and Restore

Mixed, and the distinction matters: **the database is dumped rather than copied.**

- **`db` is dumped.** `Backups.withPgDump` takes a logical dump of the application database, authenticating with the password from `store.json`. The volume's files are never captured; a restore replays the dump into a fresh database.
- **`startos` is copied wholesale** — `store.json`, and with it every generated secret, the primary URL, and the SMTP and Stripe settings.

The two halves are not independent: the dump is taken with a credential that lives in `store.json`, so a backup missing that file could not be restored.

**Restore is complete**, and no reconfiguration is needed — bookings, users, event types, and integrations all come back, along with the session and encryption keys, so existing sessions and stored credentials remain valid. If the restored server does not publish the same primary URL as the original, the task above will ask you to choose a new one.

## Limitations and Differences

1. **PostgreSQL is a private sidecar.** It cannot be shared with another service or replaced with an external database.
2. **Signups are closed at install**, and adding users is done from Cal.diy's admin console rather than by self-registration.
3. **Scheduled jobs run in a bundled sidecar** rather than on a hosting platform's scheduler, on the schedule upstream publishes.
4. **Changing the primary URL restarts the service**, because upstream's statically-built assets carry the URL and are rewritten at start.
5. **A "Create Account" link remains visible on the login page** while signups are disabled; it leads to an error page.
6. **The instance requires at least 1.5 GiB of RAM**, declared in the manifest, and will not install below it.
7. **No riscv64 build.** x86_64 and aarch64 only.

---

## Quick Reference for AI Consumers

```yaml
package_id: cal-diy
image: ./Dockerfile # selects calcom/cal.com's per-architecture tag
architectures:
  - x86_64
  - aarch64
subcontainers:
  - cal-diy-sub # the application; the one to attach to
  - postgres-sub # private database
  - cal-cron-sub # scheduled jobs
  - cal-hash-password # temporary; the Reset User Password action
volumes:
  db: /var/lib/postgresql
  startos: host side (store.json)
file_models:
  - store.json
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
  - NEXT_PUBLIC_DISABLE_SIGNUP
  - ALLOWED_HOSTNAMES
  - CRON_SECRET
  - CRON_API_KEY
  - ENABLE_ASYNC_TASKER
  - TASKER_ENABLE_EMAILS
  - TASKER_ENABLE_WEBHOOKS
  - CALCOM_TELEMETRY_DISABLED
  - NEXT_TELEMETRY_DISABLED
  - CSP_POLICY
  - NODE_ENV
  - EMAIL_FROM # when SMTP is configured
  - EMAIL_FROM_NAME # when SMTP is configured
  - EMAIL_SERVER_HOST # when SMTP is configured
  - EMAIL_SERVER_PORT # when SMTP is configured
  - EMAIL_SERVER_USER # when SMTP is configured
  - EMAIL_SERVER_PASSWORD # when SMTP is configured
  - NEXT_PUBLIC_STRIPE_PUBLIC_KEY # when Stripe is configured
  - STRIPE_PRIVATE_KEY # when Stripe is configured
  - STRIPE_CLIENT_ID # when Stripe is configured
  - STRIPE_WEBHOOK_SECRET # when Stripe is configured
  - PAYMENT_FEE_FIXED # when Stripe is configured
  - PAYMENT_FEE_PERCENTAGE # when Stripe is configured
  - POSTGRES_USER
  - POSTGRES_PASSWORD
  - POSTGRES_DB
dependencies: []
interfaces:
  ui: { type: ui, port: 3000 }
actions:
  - set-primary-url
  - manage-smtp
  - manage-stripe
  - toggle-signup
  - reset-password # only-running
tasks:
  - { action: set-primary-url, severity: critical }
health_checks:
  - cal-diy # displayed "Web Interface"
  - postgres # displayed "Database"
  - cron # displayed "Background Jobs"
  - primary-url # displayed "Primary URL"; informational
  - email # displayed "Email Delivery"; informational
  - payments # displayed "Payments"; informational
```
